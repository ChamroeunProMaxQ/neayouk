import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { NestLensModule } from 'nestlens';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { LoggerModule } from './common/config/logger.config.js';
import { oberservableConfig } from './common/config/oberservable.config.js';
import { HttpExceptionsFilter } from './common/filter/http-exception.filter.js';
import { UserTypesGuard } from './common/guard/user-types.guard.js';
import { HttpMetricsInterceptor } from './common/interceptor/http-metrics.interceptor .js';
import { ResponseInterceptor } from './common/interceptor/response.interceptor.js';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware.js';
import { HttpRequestDurationProvider } from './common/provider/http-request-duration.provider .js';
import { HttpRequestsCounterProvider } from './common/provider/http-requests-counter.provider .js';
import { UserModule } from './user/user.module.js';
import { CaslModule, type AuthorizableUser } from 'nest-casl';
import { UserTypeEnum } from '@repo/shared';
import type { JwtPayload } from './auth/dto/jwt-payload.dto.js';
import type { Request } from 'express';

@Module({
  imports: [
    CaslModule.forRoot<UserTypeEnum, AuthorizableUser<UserTypeEnum, number>>({
      superuserRole: UserTypeEnum.ADMIN,
      getUserFromRequest: (request) => {
        const user = (request as unknown as Request).user as JwtPayload | undefined;
        if (!user) return undefined;
        return {
          id: Number(user.sub),
          roles: [user.type as UserTypeEnum],
        };
      },
    }),
    NestLensModule.forRoot({
      enabled: true,
      authorization: {
        allowedEnvironments: ['dev', 'stg', 'prod'],
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.stg', '.env.prod', '.env.test'],
      load: [],
      cache: true,
      expandVariables: true,
      validationSchema: null,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    UserModule,
    LoggerModule,
    ...oberservableConfig,
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
    {
      provide: APP_GUARD,
      useClass: UserTypesGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: AccessGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
