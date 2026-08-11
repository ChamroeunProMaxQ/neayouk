import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import { swaggerConfig } from './common/config/swagger.config.js';
import './tracing.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
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
