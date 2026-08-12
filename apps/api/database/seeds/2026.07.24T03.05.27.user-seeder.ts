import { faker } from '@faker-js/faker';
import { UserStatusEnum, UserTypeEnum } from '@repo/contracts';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import type { DataSource } from 'typeorm';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function up({ context }: { context: DataSource | (() => Promise<DataSource>) }) {
  const dataSource = await (typeof context === 'function' ? context() : context);
  const now = new Date();
  const users = Array.from({ length: 10 }).map(() => ({
    username: faker.internet.username(),
    uuid: randomUUID(),
    password: hashPassword('string'),
    user_type: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.ACTIVE,
    created_at: now,
    updated_at: now,
  }));
  const adminUser = {
    username: 'string',
    uuid: randomUUID(),
    password: hashPassword('string'),
    user_type: UserTypeEnum.ADMIN,
    status: UserStatusEnum.ACTIVE,
    created_at: now,
    updated_at: now,
  };

  const allUsers = [...users, adminUser];
  for (const u of allUsers) {
    await dataSource.query(
      `INSERT IGNORE INTO users (username, uuid, password, user_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.username, u.uuid, u.password, u.user_type, u.status, u.created_at, u.updated_at],
    );
  }
}

export async function down({ context }: { context: DataSource | (() => Promise<DataSource>) }) {
  const dataSource = await (typeof context === 'function' ? context() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DELETE FROM user_tokens;`);
  await dataSource.query(`DELETE FROM user_infos;`);
  await dataSource.query(`DELETE FROM users;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
}
