import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';
import { getAllPermissionsFromContract } from '@repo/contracts';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  const permissionsList = getAllPermissionsFromContract();

  for (const perm of permissionsList) {
    await dataSource.query(
      `INSERT INTO permissions (uuid, resource, action, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT (resource, action) DO NOTHING`,
      [randomUUID(), perm.resource, perm.action, perm.description],
    );
  }

  const rolesList = [
    { name: 'Administrator', slug: 'admin', description: 'System Administrator with full access' },
    { name: 'CMS Operator', slug: 'cms', description: 'Backoffice and Content Management' },
    { name: 'Teacher', slug: 'teacher', description: 'Teacher with academic & grading access' },
    { name: 'Operations Staff', slug: 'staff', description: 'Operations & HR/Fee management' },
    { name: 'Student', slug: 'student', description: 'Student with academic viewer access' },
    { name: 'Customer', slug: 'customer', description: 'End-user / Customer profile' },
  ];

  for (const role of rolesList) {
    await dataSource.query(
      `INSERT INTO roles (uuid, name, slug, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT (slug) DO NOTHING`,
      [randomUUID(), role.name, role.slug, role.description],
    );
  }

  // Fetch inserted IDs to wire role_permissions
  const allPermissions: { id: number; resource: string; action: string }[] = await dataSource.query(
    `SELECT id, resource, action FROM permissions`,
  );
  const allRoles: { id: number; slug: string }[] = await dataSource.query(
    `SELECT id, slug FROM roles`,
  );

  const permMap = new Map<string, number>();
  allPermissions.forEach((p) => permMap.set(`${p.resource}:${p.action}`, p.id));

  const roleMap = new Map<string, number>();
  allRoles.forEach((r) => roleMap.set(r.slug, r.id));

  const rolePermMappings: Record<string, string[]> = {
    admin: allPermissions.map((p) => `${p.resource}:${p.action}`),
    cms: [
      'user:manage',
      'role:manage',
      'permission:read',
      'announcement:manage',
      'report:manage',
      'setting:manage',
      'dashboard:read',
    ],
    teacher: [
      'academic:read',
      'academic_year:read',
      'program:read',
      'class:read',
      'timetable:read',
      'student:read',
      'teacher:read',
      'student_attendance:manage',
      'teacher_attendance:read',
      'leave_request:create',
      'leave_request:read',
      'examination:manage',
      'grading_rule:read',
      'report_card:manage',
      'assignment:manage',
      'library:read',
      'report:read',
      'dashboard:read',
    ],
    staff: [
      'staff:manage',
      'payroll:manage',
      'fee_structure:manage',
      'invoice:manage',
      'expense:manage',
      'transport:manage',
      'hostel:manage',
      'library:manage',
      'teacher_attendance:manage',
      'leave_request:manage',
      'dashboard:read',
    ],
    student: [
      'academic:read',
      'class:read',
      'timetable:read',
      'student_attendance:read',
      'examination:read',
      'report_card:read',
      'assignment:read',
      'library:read',
      'dashboard:read',
    ],
    customer: ['user:read', 'user:update'],
  };

  for (const [slug, perms] of Object.entries(rolePermMappings)) {
    const roleId = roleMap.get(slug);
    if (!roleId) continue;
    for (const pKey of perms) {
      const permId = permMap.get(pKey);
      if (permId) {
        await dataSource.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [roleId, permId],
        );
      }
    }
  }

  // Assign roles to existing users based on user_type
  const users: { id: number; user_type: string }[] = await dataSource.query(
    `SELECT id, user_type FROM users`,
  );
  for (const user of users) {
    const targetSlug = user.user_type === 'ADMIN' ? 'admin' : user.user_type === 'CMS' ? 'cms' : 'customer';
    const roleId = roleMap.get(targetSlug);
    if (roleId) {
      await dataSource.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [user.id, roleId],
      );
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`TRUNCATE TABLE role_permissions, user_roles, permissions, roles CASCADE;`);
};
