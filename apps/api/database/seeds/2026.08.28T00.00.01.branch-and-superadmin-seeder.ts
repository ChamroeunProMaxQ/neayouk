import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // 1. Create Default Branch (Main Campus) if not exists
  let defaultBranch = (
    await dataSource.query(`SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1`)
  )[0];

  if (!defaultBranch) {
    const branchResult = await dataSource.query(
      `INSERT INTO branches (uuid, name, code, is_default, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [randomUUID(), 'Main Campus', 'MAIN', true, 'ACTIVE'],
    );
    defaultBranch = branchResult[0];
  }

  // 2. Create Second Demo Branch (South Campus) if not exists
  let southBranch = (
    await dataSource.query(`SELECT id FROM branches WHERE code = 'SOUTH' LIMIT 1`)
  )[0];

  if (!southBranch) {
    const branchResult = await dataSource.query(
      `INSERT INTO branches (uuid, name, code, address, phone, is_default, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
      [randomUUID(), 'South Campus', 'SOUTH', 'St. 271, Sangkat Boeung Tumpun, Phnom Penh', '023 998 877', false, 'ACTIVE'],
    );
    southBranch = branchResult[0];
  }

  // 3. Create Platform SuperAdmin user if not exists
  const existingSuperAdmin = (
    await dataSource.query(`SELECT id FROM users WHERE username = 'superadmin' LIMIT 1`)
  )[0];

  if (!existingSuperAdmin) {
    const hashedPassword = hashPassword('superadmin123');
    await dataSource.query(
      `INSERT INTO users (uuid, username, password, user_type, status, branch_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [randomUUID(), 'superadmin', hashedPassword, 'SUPER_ADMIN', 'ACTIVE', null],
    );
  }

  // 4. Create or update Default Branch Admin user (Main Campus)
  let adminUser = (
    await dataSource.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`)
  )[0];

  if (!adminUser) {
    const hashedPassword = hashPassword('admin123');
    const userResult = await dataSource.query(
      `INSERT INTO users (uuid, username, password, user_type, status, branch_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [randomUUID(), 'admin', hashedPassword, 'ADMIN', 'ACTIVE', defaultBranch.id],
    );
    adminUser = userResult[0];
  } else {
    await dataSource.query(
      `UPDATE users SET branch_id = $1, user_type = 'ADMIN' WHERE id = $2`,
      [defaultBranch.id, adminUser.id],
    );
  }

  await dataSource.query(
    `UPDATE branches SET admin_user_id = $1 WHERE id = $2`,
    [adminUser.id, defaultBranch.id],
  );

  // 5. Create South Campus Branch Admin user
  let southAdminUser = (
    await dataSource.query(`SELECT id FROM users WHERE username = 'southadmin' LIMIT 1`)
  )[0];

  if (!southAdminUser) {
    const hashedPassword = hashPassword('southadmin123');
    const userResult = await dataSource.query(
      `INSERT INTO users (uuid, username, password, user_type, status, branch_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [randomUUID(), 'southadmin', hashedPassword, 'ADMIN', 'ACTIVE', southBranch.id],
    );
    southAdminUser = userResult[0];
  } else {
    await dataSource.query(
      `UPDATE users SET branch_id = $1, user_type = 'ADMIN' WHERE id = $2`,
      [southBranch.id, southAdminUser.id],
    );
  }

  await dataSource.query(
    `UPDATE branches SET admin_user_id = $1 WHERE id = $2`,
    [southAdminUser.id, southBranch.id],
  );

  // Link admin role to admin users
  const adminRole = (
    await dataSource.query(`SELECT id FROM roles WHERE slug = 'admin' LIMIT 1`)
  )[0];

  if (adminRole) {
    if (adminUser) {
      await dataSource.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [adminUser.id, adminRole.id],
      );
    }
    if (southAdminUser) {
      await dataSource.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [southAdminUser.id, adminRole.id],
      );
    }
  }

  // 6. Seed South Campus Demo Domain Data
  if (southBranch) {
    // Demo Program in South Campus
    const existingSouthProgram = (
      await dataSource.query(`SELECT id FROM programs WHERE code = 'S-ENG' LIMIT 1`)
    )[0];
    let southProgId = existingSouthProgram?.id;
    if (!southProgId) {
      const progRes = await dataSource.query(
        `INSERT INTO programs (uuid, branch_id, name, code, status, books, grade_levels, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [randomUUID(), southBranch.id, 'South English Immersion', 'S-ENG', 'ACTIVE', '[]', '["Level 1", "Level 2"]'],
      );
      southProgId = progRes[0]?.id;
    }

    // Demo Teacher in South Campus
    const existingSouthTeacher = (
      await dataSource.query(`SELECT id FROM staff WHERE staff_code = 'TCH-S01' LIMIT 1`)
    )[0];
    let southTeacherId = existingSouthTeacher?.id;
    if (!southTeacherId) {
      const teachRes = await dataSource.query(
        `INSERT INTO staff (uuid, branch_id, staff_code, name, gender, department, designation, employment_type, salary_type, base_salary, hourly_rate, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id`,
        [randomUUID(), southBranch.id, 'TCH-S01', 'Dara Roth', 'MALE', 'ACADEMIC', 'Senior Teacher', 'FULL_TIME', 'MONTHLY', 500, 0, 'ACTIVE'],
      );
      southTeacherId = teachRes[0]?.id;
    }

    // Demo Class in South Campus
    const existingSouthClass = (
      await dataSource.query(`SELECT id FROM classes WHERE code = 'SC-G1A' LIMIT 1`)
    )[0];
    let southClassId = existingSouthClass?.id;
    if (!southClassId) {
      const classRes = await dataSource.query(
        `INSERT INTO classes (uuid, branch_id, teacher_id, program_id, name, code, grade_level, monthly_fee, semester, academic_year, capacity, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id`,
        [randomUUID(), southBranch.id, southTeacherId, southProgId, 'South Grade 1A', 'SC-G1A', 'Grade 1', 75, 'SEMESTER_1', '2025-2026', 30, 'ACTIVE'],
      );
      southClassId = classRes[0]?.id;
    }

    // Demo Student in South Campus
    const existingSouthStudent = (
      await dataSource.query(`SELECT id FROM students WHERE student_code = 'STU-S001' LIMIT 1`)
    )[0];
    if (!existingSouthStudent) {
      const stuRes = await dataSource.query(
        `INSERT INTO students (uuid, branch_id, student_code, first_name, last_name, first_name_km, last_name_km, gender, date_of_birth, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING id`,
        [randomUUID(), southBranch.id, 'STU-S001', 'Vannak', 'Long', 'វណ្ណៈ', 'ឡុង', 'MALE', '2017-05-10', 'ACTIVE'],
      );
      const southStuId = stuRes[0]?.id;

      if (southStuId && southClassId) {
        await dataSource.query(
          `INSERT INTO student_classes (student_id, class_id, academic_year, semester, is_primary, status, enrolled_at, created_at, updated_at)
           VALUES ($1, $2, '2025-2026', 'SEMESTER_1', true, 'ENROLLED', NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING`,
          [southStuId, southClassId],
        );
      }
    }

    // Demo Fee Structure in South Campus
    const existingSouthFee = (
      await dataSource.query(`SELECT id FROM fee_structures WHERE name = 'South Campus Tuition' LIMIT 1`)
    )[0];
    if (!existingSouthFee) {
      await dataSource.query(
        `INSERT INTO fee_structures (uuid, branch_id, name, category, amount, billing_cycle, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [randomUUID(), southBranch.id, 'South Campus Tuition', 'TUITION', 75, 'MONTHLY', true],
      );
    }

    // Demo Expense in South Campus
    const existingSouthExpense = (
      await dataSource.query(`SELECT id FROM school_expenses WHERE title = 'South Campus Office Setup' LIMIT 1`)
    )[0];
    if (!existingSouthExpense) {
      await dataSource.query(
        `INSERT INTO school_expenses (uuid, branch_id, title, category, amount, payment_method, status, expense_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())`,
        [randomUUID(), southBranch.id, 'South Campus Office Setup', 'MAINTENANCE', 320, 'BANK_TRANSFER', 'APPROVED'],
      );
    }
  }

  // 7. Update existing unassigned records to point to default branch (Main Campus)
  if (defaultBranch) {
    await dataSource.query(`UPDATE students SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE staff SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE classes SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE programs SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE fee_structures SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE school_expenses SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE payrolls SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE student_payments SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
    await dataSource.query(`UPDATE grading_rules SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranch.id]);
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DELETE FROM users WHERE username IN ('superadmin', 'admin', 'southadmin')`);
  await dataSource.query(`DELETE FROM branches WHERE code IN ('MAIN', 'SOUTH')`);
};
