import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PaginationResponseDto,
  ResponseDto,
  type PaginationDto,
} from '@repo/shared';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HTTP_MESSAGE_KEY } from '../decorator/message.decorator.js';

type RawResponseDataType =
  { count: number; rows: Record<string, any>[] } | Record<string, any>;

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // exclude metrics routes
    if (request.path.includes('/metrics')) return next.handle();

    const statusCode = response.statusCode;
    const { page, pageSize } = (request.query ??
      {}) as unknown as PaginationDto;
    // get a message from the HTTP_MESSAGE_KEY decorator
    const message = this.getMessage(context);
    if (!this.isJsonRes(response)) return next.handle();
    return next.handle().pipe(
      map((_data: RawResponseDataType) => {
        // if (!_data) return new ResponseDto(statusCode, message, null);
        const pagination =
          page && pageSize && typeof _data?.count == 'number'
            ? new PaginationResponseDto(+page, +pageSize, _data?.count)
            : undefined;
        const data =
          typeof _data?.count == 'number'
            ? (_data.rows as Record<string, any>[])
            : _data;
        return new ResponseDto(statusCode, message, data, pagination);
      }),
    );
  }

  private getMessage(context: ExecutionContext) {
    return (
      this.reflector.getAllAndOverride<string>(HTTP_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'success'
    );
  }

  private isJsonRes(response: Response): boolean {
    const contentType = response.getHeader('content-type');
    if (contentType === undefined) return true;
    return contentType.toString().includes('application/json');
  }
}
