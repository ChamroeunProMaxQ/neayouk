import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '@src/app.module.js';
import { swaggerConfig } from '@src/common/config/swagger.config.js';
import '@src/tracing.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: [
      'api/docs',
      'api/docs/*path',
      'metrics',
      'metrics/*path',
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  swaggerConfig(app);
  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(3000);
}

bootstrap()
  .then(() => {
    console.log('application start in port: 3000');
  })
  .catch((err) => {
    console.error('Failed to start application:', err);
  });
