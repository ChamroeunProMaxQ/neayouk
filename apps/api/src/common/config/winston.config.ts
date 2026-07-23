import { context, trace } from '@opentelemetry/api';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';
import LokiTransport from 'winston-loki';

export const otelTraceFormat = winston.format((info) => {
  const span = trace.getSpan(context.active());

  if (span) {
    const spanContext = span.spanContext();

    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
  }

  return info;
});

export const winstonConfig = WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        otelTraceFormat(),
        nestWinstonModuleUtilities.format.nestLike('API', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    new LokiTransport({
      host: 'http://localhost:3100',
      labels: {
        app: 'nestjs-prometheus',
      },
      format: winston.format.combine(
        otelTraceFormat(),
        nestWinstonModuleUtilities.format.nestLike('API', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
  ],
});
