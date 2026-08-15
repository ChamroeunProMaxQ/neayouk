import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppController } from '@src/app.controller.js';
import { AppService } from '@src/app.service.js';
import { AuthModule } from '@src/auth/auth.module.js';
import { LoggerModule } from '@src/common/config/logger.config.js';
import { oberservableConfig } from '@src/common/config/oberservable.config.js';
import { HttpExceptionsFilter } from '@src/common/filter/http-exception.filter.js';
import { HttpMetricsInterceptor } from '@src/common/interceptor/http-metrics.interceptor .js';
import { ResponseInterceptor } from '@src/common/interceptor/response.interceptor.js';
import { HttpLoggerMiddleware } from '@src/common/middleware/http-logger.middleware.js';
import { HttpRequestDurationProvider } from '@src/common/provider/http-request-duration.provider .js';
import { HttpRequestsCounterProvider } from '@src/common/provider/http-requests-counter.provider .js';
import { UserModule } from '@src/user/user.module.js';
import { caslConfig } from '@src/common/config/casl.config.js';
import { envModuelConfig } from '@src/common/config/env.config.js';
import { typeOrmConfig } from './common/config/orm.config.js';

@Module({
  imports: [
    envModuelConfig,
    caslConfig,
    typeOrmConfig,
    UserModule,
    ...oberservableConfig,
    LoggerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HttpRequestDurationProvider,
    HttpRequestsCounterProvider,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*path');
  }
}
