import { join } from 'node:path';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '@src/app.module.js';
import { swaggerConfig } from '@src/common/config/swagger.config.js';
import '@src/tracing.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.includes(',')
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : process.env.CORS_ORIGIN
    : 'http://localhost:5173';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api', {
    exclude: [
      'api/docs',
      'api/docs/*path',
      'metrics',
      'metrics/*path',
      'uploads',
      'uploads/*path',
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  swaggerConfig(app);
  app.useGlobalPipes(new ZodValidationPipe());

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap()
  .then(() => {
    console.log(`application start in port: ${process.env.PORT ?? 3000}`);
  })
  .catch((err) => {
    console.error('Failed to start application:', err);
  });
