import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserTypeEnum } from '@repo/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { migrator, seeder } from '@database/umzug.js';
import { AppModule } from '@src/app.module.js';

export interface SetupE2eOptions {
  globalPrefix?: string | false;
  version?: string | false;
}

export interface E2eTestContext {
  app: INestApplication;
  jwtService: JwtService;
  createToken: (payload?: {
    sub?: number;
    username?: string;
    type?: UserTypeEnum;
  }) => string;
  server: any;
}

/**
 * Initializes NestJS application for E2E testing along with DB migrations and seeders.
 */
export async function setupE2eApp(
  options: SetupE2eOptions = {},
): Promise<E2eTestContext> {
  const { globalPrefix = 'api', version = '1' } = options;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication()

  if (globalPrefix !== false) {
    app.setGlobalPrefix(globalPrefix);
  }

  if (version !== false) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: version,
    });
  }

  await migrator.up();
  await seeder.up();

  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();

  const jwtService = app.get(JwtService);

  const createToken = (payload?: {
    sub?: number;
    username?: string;
    type?: UserTypeEnum;
  }) => {
    return jwtService.sign({
      sub: payload?.sub ?? 11,
      username: payload?.username ?? 'admin',
      type: payload?.type ?? UserTypeEnum.ADMIN,
    });
  };

  return {
    app,
    jwtService,
    createToken,
    server: app.getHttpServer(),
  };
}

/**
 * Cleanly teardown database migrations and close NestJS app after E2E tests.
 */
export async function teardownE2eApp(app: INestApplication): Promise<void> {
  if (app) {
    await seeder.down({ to: 0 });
    await migrator.down({ to: 0 });
    await app.close();
  }
}
