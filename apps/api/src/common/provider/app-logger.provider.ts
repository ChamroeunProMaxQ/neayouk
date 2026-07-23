import { Logger, type LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { envConfig } from '../config/env.config.js';

export const AppLoggerProvider = {
  provide: 'APP_LOGGER',
  useFactory: (winstonLogger: LoggerService) => {
    return envConfig.OBSERVABLE_ENABLE ? winstonLogger : new Logger();
  },
  inject: [WINSTON_MODULE_NEST_PROVIDER],
};
