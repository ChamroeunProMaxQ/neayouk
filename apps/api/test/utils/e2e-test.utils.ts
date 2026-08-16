import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserTypeEnum, type PermissionDto } from '@repo/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { seeder } from '@database/umzug.js';
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
    userType?: UserTypeEnum;
    roles?: string[];
    permissions?: PermissionDto[];
  }) => string;
  server: any;
}

/**
 * Initializes NestJS application for E2E testing using the globally migrated database.
 */
export async function setupE2eApp(
  options: SetupE2eOptions = {},
): Promise<E2eTestContext> {
  const { globalPrefix = 'api', version = '1' } = options;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  if (globalPrefix !== false) {
    app.setGlobalPrefix(globalPrefix);
  }

  if (version !== false) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: version,
    });
  }

  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();

  const jwtService = app.get(JwtService);

  const createToken = (payload?: {
    sub?: number;
    username?: string;
    type?: UserTypeEnum;
    userType?: UserTypeEnum;
    roles?: string[];
    permissions?: PermissionDto[];
  }) => {
    const userType = payload?.userType ?? payload?.type ?? UserTypeEnum.ADMIN;
    return jwtService.sign({
      sub: payload?.sub ?? 11,
      username: payload?.username ?? 'admin',
      type: userType,
      userType,
      roles: payload?.roles ?? [userType.toLowerCase()],
      permissions: payload?.permissions ?? [],
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
 * Rapidly reseeds test data without dropping database tables.
 */
export async function resetTestData(): Promise<void> {
  await seeder.down({ to: 0 });
  await seeder.up();
}

/**
 * Gracefully closes NestJS application after E2E tests.
 */
export async function teardownE2eApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}
