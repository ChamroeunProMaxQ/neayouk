import { ConsoleLogger, Global, Module, Optional, type LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CollectorService } from 'nestlens';
import { envConfig } from './env.config.js';
import { winstonConfig } from './winston.config.js';

export const APP_LOGGER = 'APP_LOGGER';

class CompositeLogger implements LoggerService {
  constructor(
    private readonly baseLogger: LoggerService,
    private readonly collectorService?: CollectorService,
  ) {}

  private sendToNestLens(
    level: 'debug' | 'warn' | 'error' | 'log' | 'verbose',
    message: any,
    context?: string,
    stack?: string,
  ) {
    if (!this.collectorService) return;
    try {
      const ctxStr = typeof context === 'string' ? context : undefined;
      // Skip NestLens internal logs
      if (ctxStr?.includes('NestLens') || ctxStr?.includes('Collector')) {
        return;
      }
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
      const payload = {
        level,
        message: msgStr,
        context: ctxStr,
        stack,
      };
      this.collectorService.collect('log', payload);
    } catch {
      // Ignore
    }
  }

  log(message: any, ...optionalParams: any[]) {
    this.baseLogger.log(message, ...optionalParams);
    const context =
      optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : undefined;
    this.sendToNestLens('log', message, context);
  }

  error(message: any, ...optionalParams: any[]) {
    this.baseLogger.error(message, ...optionalParams);
    const stack =
      optionalParams.length > 0 && typeof optionalParams[0] === 'string'
        ? optionalParams[0]
        : undefined;
    const context =
      optionalParams.length > 1 && typeof optionalParams[1] === 'string'
        ? optionalParams[1]
        : undefined;
    this.sendToNestLens('error', message, context, stack);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.baseLogger.warn(message, ...optionalParams);
    const context =
      optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : undefined;
    this.sendToNestLens('warn', message, context);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.baseLogger.debug?.(message, ...optionalParams);
    const context =
      optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : undefined;
    this.sendToNestLens('debug', message, context);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.baseLogger.verbose?.(message, ...optionalParams);
    const context =
      optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : undefined;
    this.sendToNestLens('verbose', message, context);
  }
}

const AppLoggerProvider = {
  provide: APP_LOGGER,
  useFactory: (winstonLogger: LoggerService, collectorService?: CollectorService) => {
    const baseLogger = envConfig.OBSERVABLE_ENABLE ? winstonLogger : new ConsoleLogger();
    return new CompositeLogger(baseLogger, collectorService);
  },
  inject: [
    WINSTON_MODULE_NEST_PROVIDER,
    { token: CollectorService, optional: true },
  ],
};

@Global()
@Module({
  imports: [winstonConfig],
  providers: [AppLoggerProvider],
  exports: [APP_LOGGER],
})
export class LoggerModule {}
