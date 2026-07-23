import { Global, Logger, Module, type LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { envConfig } from './env.config.js';
import { winstonConfig } from './winston.config.js';

export const APP_LOGGER = 'APP_LOGGER';

const AppLoggerProvider = {
  provide: 'APP_LOGGER',
  useFactory: (winstonLogger: LoggerService) => {
    return envConfig.OBSERVABLE_ENABLE ? winstonLogger : new Logger();
  },
  inject: [WINSTON_MODULE_NEST_PROVIDER],
};

@Global()
@Module({
  imports: [winstonConfig],
  providers: [AppLoggerProvider],
  exports: [APP_LOGGER],
})
export class LoggerModule {}
