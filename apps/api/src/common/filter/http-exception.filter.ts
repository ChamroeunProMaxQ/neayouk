import type {
  ArgumentsHost,
  ExceptionFilter,
  LoggerService,
} from '@nestjs/common';
import {
  BadRequestException,
  Catch,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { ResponseDto } from '@repo/shared';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Request, Response } from 'express';
import { CollectorService } from 'nestlens';
import { ZodValidationException } from 'nestjs-zod';
import { Counter } from 'prom-client';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { APP_LOGGER } from '../config/logger.config.js';

type BadRequestExceptionResponse = {
  message: string[];
};

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter,

    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,

    @Optional()
    @Inject(CollectorService)
    private readonly collectorService?: CollectorService,
  ) {
    //
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();

    const url = request.originalUrl || request.url || request.path || '';
    if (url.includes('nestlens')) {
      throw exception;
    }

    this.logger.log('FILTER_EXECUTED');
    this.logger.log(exception?.constructor?.name);
    this.logger.error(exception);

    const calculatedStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof EntityNotFoundError
          ? HttpStatus.NOT_FOUND
          : exception instanceof QueryFailedError
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logToNestLens(exception, request, calculatedStatus);

    if (
      exception instanceof ForbiddenException ||
      (exception instanceof HttpException && exception.getStatus() === HttpStatus.FORBIDDEN)
    ) {
      const ex = exception as HttpException;
      const exResponse = ex.getResponse();
      const rawMessage =
        typeof exResponse === 'string'
          ? exResponse
          : typeof exResponse === 'object' && exResponse !== null && 'message' in exResponse
            ? (exResponse as { message: string | string[] }).message
            : ex.message;

      const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

      const responseDto = new ResponseDto(
        HttpStatus.FORBIDDEN,
        message || 'You do not have permission to access or modify this resource',
        null,
      );
      this.incrementHttpMetric(request, HttpStatus.FORBIDDEN);
      return response.status(HttpStatus.FORBIDDEN).json(responseDto);
    }

    if (exception instanceof QueryFailedError) {
      const responseDto = new ResponseDto(
        HttpStatus.BAD_REQUEST,
        exception.message,
        [exception.message],
      );
      this.incrementHttpMetric(request, HttpStatus.BAD_REQUEST);
      return response.status(HttpStatus.BAD_REQUEST).json(responseDto);
    }

    if (exception instanceof EntityNotFoundError) {
      this.incrementHttpMetric(request, HttpStatus.NOT_FOUND);
      return response.status(HttpStatus.NOT_FOUND).json({
        code: HttpStatus.NOT_FOUND,
        message: 'not found',
        data: null,
      });
    }

    if (exception instanceof ZodValidationException) {
      const errors = exception.getZodError() as string;
      const readableError = JSON.parse(errors) as any[];
      const messsageArray = readableError.map((r) => r.message);
      const responseDto = new ResponseDto(
        exception.getStatus(),
        messsageArray.at(0),
        messsageArray,
      );
      this.incrementHttpMetric(request, exception.getStatus());
      return response.json(responseDto);
    }

    if (exception instanceof BadRequestException) {
      const exResponse = exception.getResponse() as BadRequestExceptionResponse;

      const messageArray: string[] = exResponse.message;
      const isArrayMsg = Array.isArray(exResponse.message);

      const responseDto = new ResponseDto(
        exception.getStatus(),
        isArrayMsg ? messageArray[0] : (messageArray as unknown as string),
        isArrayMsg ? messageArray : [messageArray],
      );
      this.incrementHttpMetric(request, exception.getStatus());
      return response.json(responseDto);
    }

    const extractMessage = (): string => {
      if (!(exception instanceof HttpException)) return 'Internal server error';
      const res = exception.getResponse();
      if (typeof res === 'string') return res;
      if (typeof res === 'object' && res !== null && 'message' in res) {
        return (res as { message: string }).message;
      }
      this.logger.error('unexpected error response format', res);
      return 'Internal server error';
    };

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    this.incrementHttpMetric(request, status);
    return response
      .status(status)
      .json(new ResponseDto(status, extractMessage(), null));
  }

  private incrementHttpMetric(request: Request, status: number) {
    this.httpRequestsCounter.inc({
      method: request.method,
      route: request.route?.path ?? request.url,
      status: status.toString(),
    });
  }

  private logToNestLens(exception: unknown, request: Request, status: number) {
    if (!this.collectorService) return;
    try {
      const ex =
        exception instanceof Error ? exception : new Error(String(exception));
      const payload = {
        name: ex.name || 'Error',
        message: ex.message || String(exception),
        stack: ex.stack,
        code: status,
        context: 'HTTP',
        request: {
          method: request?.method,
          url: request?.originalUrl || request?.url,
          body: request?.body,
        },
      };
      const requestId = (request as any)?.nestlensRequestId;
      this.collectorService.collectImmediate('exception', payload, requestId);
    } catch {
      // Ignore if nestlens collector is unavailable
    }
  }
}
