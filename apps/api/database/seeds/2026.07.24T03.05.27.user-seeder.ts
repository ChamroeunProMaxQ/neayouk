import { faker } from '@faker-js/faker';
import { UserStatusEnum, UserTypeEnum } from '@repo/shared';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { Sequelize } from 'sequelize';
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = scryptSync(password, salt, 64);

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function up({ context: sequelize }: { context: Sequelize }) {
  const users = Array.from({ length: 10 }).map(() => ({
    username: faker.internet.username(),
    uuid: randomUUID(),
    password: '12345678',
    user_type: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  }));
  const user = {
    username: 'string',
    uuid: randomUUID(),
    password: hashPassword('string'),
    user_type: UserTypeEnum.ADMIN,
    status: UserStatusEnum.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  };

  await sequelize.getQueryInterface().bulkInsert('users', [...users, user]);
}

export async function down({ context: sequelize }: { context: Sequelize }) {
  await sequelize.getQueryInterface().bulkDelete('users', {});
}
