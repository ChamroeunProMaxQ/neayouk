import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  const permissionsList = [
    { resource: 'all', action: 'manage', description: 'Full system management' },
    { resource: 'user', action: 'read', description: 'View users' },
    { resource: 'user', action: 'create', description: 'Create users' },
    { resource: 'user', action: 'update', description: 'Edit users' },
    { resource: 'user', action: 'delete', description: 'Delete users' },
    { resource: 'user', action: 'manage', description: 'Manage all users' },
    { resource: 'announcement', action: 'read', description: 'View announcements' },
    { resource: 'announcement', action: 'manage', description: 'Manage announcements' },
    { resource: 'academic', action: 'read', description: 'View academics' },
    { resource: 'academic', action: 'manage', description: 'Manage academics' },
    { resource: 'attendance', action: 'read', description: 'View attendance' },
    { resource: 'attendance', action: 'manage', description: 'Manage attendance' },
    { resource: 'examination', action: 'read', description: 'View examinations' },
    { resource: 'examination', action: 'manage', description: 'Manage examinations' },
    { resource: 'assignment', action: 'read', description: 'View assignments' },
    { resource: 'assignment', action: 'manage', description: 'Manage assignments' },
    { resource: 'fee', action: 'read', description: 'View fees' },
    { resource: 'fee', action: 'manage', description: 'Manage fees' },
    { resource: 'hr', action: 'read', description: 'View HR & Payroll' },
    { resource: 'hr', action: 'manage', description: 'Manage HR & Payroll' },
    { resource: 'library', action: 'read', description: 'View library' },
    { resource: 'library', action: 'manage', description: 'Manage library' },
    { resource: 'transport', action: 'read', description: 'View transport' },
    { resource: 'transport', action: 'manage', description: 'Manage transport' },
    { resource: 'hostel', action: 'read', description: 'View hostel' },
    { resource: 'hostel', action: 'manage', description: 'Manage hostel' },
    { resource: 'report', action: 'read', description: 'View reports' },
    { resource: 'report', action: 'manage', description: 'Manage reports' },
    { resource: 'setting', action: 'read', description: 'View settings' },
    { resource: 'setting', action: 'manage', description: 'Manage settings' },
  ];

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
    cms: ['user:manage', 'announcement:manage', 'report:read', 'setting:read'],
    teacher: ['academic:read', 'attendance:manage', 'examination:manage', 'assignment:manage', 'library:read', 'report:read'],
    staff: ['hr:manage', 'fee:manage', 'transport:manage', 'hostel:manage', 'library:manage'],
    student: ['academic:read', 'attendance:read', 'examination:read', 'assignment:read', 'library:read'],
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
