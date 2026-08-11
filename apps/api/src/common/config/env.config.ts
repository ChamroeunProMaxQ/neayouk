import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';

console.log('node env', process.env.NODE_ENV);

const nodeEnv = process.env.NODE_ENV;

dotenv.config({
  path: nodeEnv == 'test' ? '.env.test' : '.env',
});

function resolveEnv<T = string>(key: string): T | undefined {
  const value = process.env[key];

  if (!value) return undefined;

  if (!isNaN(Number(value))) {
    return Number(value) as T;
  }

  if (value.toLowerCase() === 'true') {
    return true as T;
  }

  if (value.toLowerCase() === 'false') {
    return false as T;
  }

  return value as T;
}

export const envConfig = {
  NODE_ENV: resolveEnv<string>('NODE_ENV'),
  OBSERVABLE_ENABLE: resolveEnv<boolean>('OBSERVABLE_ENABLE'),
  DB_HOST: resolveEnv<string>('DB_HOST'),
  DB_PORT: resolveEnv<string>('DB_PORT'),
  DB_USER: resolveEnv<string>('DB_USER'),
  DB_PASSWORD: resolveEnv<string>('DB_PASSWORD'),
  DB_NAME: resolveEnv<string>('DB_NAME'),
  JWT_SECRET: resolveEnv<string>('JWT_SECRET'),
  JWT_EXPIRES_IN: resolveEnv<number>('JWT_EXPIRES_IN'),
};

export const envModuelConfig = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '.env.stg', '.env.prod', '.env.test'],
  load: [],
  cache: true,
  expandVariables: true,
  validationSchema: null,
});
