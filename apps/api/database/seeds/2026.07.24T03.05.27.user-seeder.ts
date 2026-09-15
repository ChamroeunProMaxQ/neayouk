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

  // Check if branches table exists and fetch default branch if available
  let defaultBranchId: number | null = null;
  const hasBranchesTable = (
    await dataSource.query(`SELECT to_regclass('public.branches') as tbl`)
  )[0]?.tbl;

  if (hasBranchesTable) {
    const branchRes = await dataSource.query(
      `SELECT id FROM branches WHERE is_default = true OR code = 'MAIN' ORDER BY is_default DESC LIMIT 1`,
    );
    if (branchRes.length > 0) {
      defaultBranchId = branchRes[0].id;
    }
  }

  // Check if users table has branch_id column
  const hasBranchIdCol = (
    await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'branch_id'`,
    )
  ).length > 0;

  const users = Array.from({ length: 10 }).map(() => ({
    username: faker.internet.username(),
    uuid: randomUUID(),
    password: hashPassword('string'),
    user_type: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.ACTIVE,
    branch_id: null as number | null,
    created_at: now,
    updated_at: now,
  }));
  const adminUser = {
    username: 'string',
    uuid: randomUUID(),
    password: hashPassword('string'),
    user_type: UserTypeEnum.SUPER_ADMIN,
    status: UserStatusEnum.ACTIVE,
    branch_id: defaultBranchId,
    created_at: now,
    updated_at: now,
  };

  const allUsers = [...users, adminUser];
  for (const u of allUsers) {
    if (hasBranchIdCol) {
      await dataSource.query(
        `INSERT INTO users (username, uuid, password, user_type, status, branch_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         ON CONFLICT (username) DO UPDATE SET 
           password = EXCLUDED.password, 
           user_type = EXCLUDED.user_type, 
           status = EXCLUDED.status, 
           branch_id = COALESCE(EXCLUDED.branch_id, users.branch_id),
           updated_at = EXCLUDED.updated_at`,
        [u.username, u.uuid, u.password, u.user_type, u.status, u.branch_id, u.created_at, u.updated_at],
      );
    } else {
      await dataSource.query(
        `INSERT INTO users (username, uuid, password, user_type, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (username) DO UPDATE SET 
           password = EXCLUDED.password, 
           user_type = EXCLUDED.user_type, 
           status = EXCLUDED.status, 
           updated_at = EXCLUDED.updated_at`,
        [u.username, u.uuid, u.password, u.user_type, u.status, u.created_at, u.updated_at],
      );
    }
  }

  // If roles and user_roles tables exist, link user 'string' to 'admin' role
  const hasRolesTable = (
    await dataSource.query(`SELECT to_regclass('public.roles') as tbl`)
  )[0]?.tbl;
  const hasUserRolesTable = (
    await dataSource.query(`SELECT to_regclass('public.user_roles') as tbl`)
  )[0]?.tbl;

  if (hasRolesTable && hasUserRolesTable) {
    const adminRole = (
      await dataSource.query(`SELECT id FROM roles WHERE slug = 'admin' LIMIT 1`)
    )[0];
    const stringUser = (
      await dataSource.query(`SELECT id FROM users WHERE username = 'string' LIMIT 1`)
    )[0];
    if (adminRole && stringUser) {
      await dataSource.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [stringUser.id, adminRole.id],
      );
    }
  }
}

export async function down({ context }: { context: DataSource | (() => Promise<DataSource>) }) {
  const dataSource = await (typeof context === 'function' ? context() : context);
  await dataSource.query(`TRUNCATE TABLE user_tokens, user_infos, users CASCADE;`);
}
