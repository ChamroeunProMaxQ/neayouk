import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggerModule } from './common/config/logger.config.js';
import { oberservableConfig } from './common/config/oberservable.config.js';
import { HttpExceptionsFilter } from './common/filter/http-exception.filter.js';
import { HttpMetricsInterceptor } from './common/interceptor/http-metrics.interceptor .js';
import { ResponseInterceptor } from './common/interceptor/response.interceptor.js';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware.js';
import { HttpRequestDurationProvider } from './common/provider/http-request-duration.provider .js';
import { HttpRequestsCounterProvider } from './common/provider/http-requests-counter.provider .js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.stg', '.env.prod'],
      load: [],
      cache: true,
      expandVariables: true,
      validationSchema: null,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadModels: true,
        synchronize: false,
        pool: {
          max: 10,
          min: 1,
        },
      }),
    }),
    UserModule,
    LoggerModule,
    ...oberservableConfig,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HttpRequestDurationProvider,
    HttpRequestsCounterProvider,
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
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
