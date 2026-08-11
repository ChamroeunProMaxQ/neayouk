import { AppModule } from '../../../src/app.module.js';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('D1 Nest Monorepo Template')
    .setDescription('api docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config, {
    deepScanRoutes: false
  });
  // for (const path of Object.keys(documentFactory.paths)) {
  //   if (path.startsWith('/nestlens') || path.startsWith('/__nestlens__')) {
  //     delete documentFactory.paths[path];
  //   }
  // }
  SwaggerModule.setup('api/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
