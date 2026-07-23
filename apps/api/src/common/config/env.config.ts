import * as dotenv from 'dotenv';

dotenv.config();

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
  DB_PORT: resolveEnv<number>('DB_PORT'),
  DB_USER: resolveEnv<number>('DB_USER'),
  DB_PASSWORD: resolveEnv<number>('DB_PASSWORD'),
  DB_NAME: resolveEnv<number>('DB_NAME'),
};
