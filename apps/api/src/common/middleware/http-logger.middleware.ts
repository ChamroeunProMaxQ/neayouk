import {
  Inject,
  Injectable,
  type LoggerService,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.includes('metrics')) return next();

    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${req.ip} "${req.headers['user-agent']}"`,
      );
    });

    next();
  }
}
