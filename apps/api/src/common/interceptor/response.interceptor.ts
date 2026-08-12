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
} from '@repo/contracts';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HTTP_MESSAGE_KEY } from '@src/common/decorator/message.decorator.js';

type RawResponseDataType =
  [Record<string, any>[], number] | Record<string, any>;

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const url = request.originalUrl || request.url || request.path || '';
    // exclude metrics routes
    if (url.includes('metrics')) return next.handle();

    const statusCode = response.statusCode;
    const { page, pageSize } = (request.query ??
      {}) as unknown as PaginationDto;
    // get a message from the HTTP_MESSAGE_KEY decorator
    const message = this.getMessage(context);
    if (!this.isJsonRes(response)) return next.handle();
    return next.handle().pipe(
      map((_data: RawResponseDataType) => {
        // if (!_data) return new ResponseDto(statusCode, message, null);
        const isPaginated = this.isPaginate(_data);
        const pagination =
          page && pageSize && isPaginated
            ? new PaginationResponseDto(+page, +pageSize, _data[1])
            : undefined;
        const data = isPaginated ? _data[0] : _data;

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

  private isPaginate(_data: unknown): boolean {
    return Array.isArray(_data) &&
      _data.length === 2 &&
      Array.isArray(_data[0]) &&
      typeof _data[1] === 'number';
  }
}
