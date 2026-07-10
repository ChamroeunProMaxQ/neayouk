import {
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ResponseDto } from '@repo/shared';
// import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
// import {
//   EmptyResultError as SequelizeEmptyResultError,
//   ValidationError as SequelizeValidationError,
// } from 'sequelize';

type BadRequestExceptionResponse = {
  message: string[];
};

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionsFilter.name);

  constructor() {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    // const request = ctx.getRequest<Request>();
    this.logger.debug(exception?.constructor?.name);
    this.logger.error(exception);

    if (exception instanceof ZodValidationException) {
      const errors = exception.getZodError() as string;
      const readableError = JSON.parse(errors) as any[];
      const messsageArray = readableError.map((r) => r.message);
      const responseDto = new ResponseDto(
        exception.getStatus(),
        messsageArray.at(0),
        messsageArray,
      );

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

    return response
      .status(status)
      .json(new ResponseDto(status, extractMessage(), null));
  }
}
