import { faker } from '@faker-js/faker';
import { UserStatusEnum, UserTypeEnum } from '@repo/contracts';

export interface UserFixtureOptions {
  username?: string;
  password?: string;
  type?: UserTypeEnum;
  status?: UserStatusEnum;
}

/**
 * Builds realistic random user data for E2E test inputs.
 */
export function buildUserData(overrides: UserFixtureOptions = {}) {
  return {
    username: overrides.username ?? faker.internet.username().toLowerCase() + faker.number.int({ min: 100, max: 9999 }),
    password: overrides.password ?? 'password123',
    type: overrides.type ?? UserTypeEnum.CUSTOMER,
    status: overrides.status ?? UserStatusEnum.ACTIVE,
  };
}

/**
 * Builds custom token payload options for test authentication.
 */
export function buildTokenPayload(overrides: {
  sub?: number;
  username?: string;
  type?: UserTypeEnum;
} = {}) {
  return {
    sub: overrides.sub ?? faker.number.int({ min: 100, max: 9999 }),
    username: overrides.username ?? faker.internet.username().toLowerCase(),
    type: overrides.type ?? UserTypeEnum.ADMIN,
  };
}
