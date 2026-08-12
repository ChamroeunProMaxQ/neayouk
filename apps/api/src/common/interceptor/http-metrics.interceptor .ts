import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Request } from 'express';
import { Counter, Histogram } from 'prom-client';
import { finalize, Observable, tap } from 'rxjs';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = process.hrtime();

    const url = request.originalUrl || request.url || request.path || '';
    // bypass metrics
    if (url.includes('metrics')) return next.handle();

    return next.handle().pipe(
      tap(() => {
        this.httpRequestsCounter.inc({
          method: request.method,
          route: request.route?.path ?? request.url,
          status: response.statusCode,
        });
      }),

      finalize(() => {
        const diff = process.hrtime(start);
        const duration = diff[0] + diff[1] / 1e9;
        this.requestDuration.observe(
          {
            method: request.method,
            route: request.route?.path ?? request.url,
            status: response.statusCode,
          },
          duration,
        );
      }),
    );
  }
}
