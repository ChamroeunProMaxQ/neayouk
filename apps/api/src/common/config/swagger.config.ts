import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Neayouk API')
    .setDescription('api docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => {
    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: false,
    });

    for (const path of Object.keys(document.paths)) {
      if (path.includes('metrics')) {
        delete document.paths[path];
      }
    }

    return document;
  };

  SwaggerModule.setup('api/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
