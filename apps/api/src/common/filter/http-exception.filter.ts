import {
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  EmptyResultError as SequelizeEmptyResultError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';

import type {
  ArgumentsHost,
  ExceptionFilter,
  LoggerService,
} from '@nestjs/common';
import { ResponseDto } from '@repo/shared';
// import { ThrottlerException } from '@nestjs/throttler';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { Counter } from 'prom-client';
import { APP_LOGGER } from '../config/logger.config.js';
// import {
//   EmptyResultError as SequelizeEmptyResultError,
//   ValidationError as SequelizeValidationError,
// } from 'sequelize';

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
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();
    this.logger.log(exception?.constructor?.name);
    this.logger.error(exception);

    if (exception instanceof SequelizeValidationError) {
      const errors = exception.errors.map((error) => {
        return error.message;
      });
      const responseDto = new ResponseDto(
        HttpStatus.BAD_REQUEST,
        errors?.at(0) ?? '',
        errors,
      );
      this.incrementHttpMetric(request, HttpStatus.BAD_REQUEST);
      return response.status(HttpStatus.BAD_REQUEST).json(responseDto);
    }

    if (exception instanceof SequelizeEmptyResultError) {
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
}
