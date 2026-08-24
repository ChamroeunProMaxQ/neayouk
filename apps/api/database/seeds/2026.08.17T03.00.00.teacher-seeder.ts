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

  // 1. Ensure 'teacher' role exists
  const teacherRole = await dataSource.query(`SELECT id FROM roles WHERE slug = 'teacher' LIMIT 1`);
  let teacherRoleId: number;
  if (!teacherRole || teacherRole.length === 0) {
    const roleUuid = randomUUID();
    await dataSource.query(
      `INSERT INTO roles (uuid, name, slug, description, created_at, updated_at) VALUES ($1, 'Teacher', 'teacher', 'Academic teacher role', NOW(), NOW()) ON CONFLICT (slug) DO NOTHING`,
      [roleUuid]
    );
    const newRole = await dataSource.query(`SELECT id FROM roles WHERE slug = 'teacher' LIMIT 1`);
    teacherRoleId = newRole[0].id;
  } else {
    teacherRoleId = teacherRole[0].id;
  }

  // 2. Sample teacher fixture datasets
  const teacherFixtures = [
    {
      code: 'TCH-2026-001',
      name: 'John Sok',
      nameKm: 'សុខ ចន',
      gender: 'MALE',
      dob: '1988-04-15',
      phone: '012345678',
      email: 'john.sok@school.edu.kh',
      salaryInHour: 15.0,
      specialization: 'Mathematics & Cambridge Primary',
      bio: 'Over 8 years experience teaching primary and secondary mathematics.',
      status: 'ACTIVE',
      username: 'teacher_john',
    },
    {
      code: 'TCH-2026-002',
      name: 'Sreymom Chan',
      nameKm: 'ចាន់ ស្រីមុំ',
      gender: 'FEMALE',
      dob: '1992-08-22',
      phone: '098765432',
      email: 'sreymom.chan@school.edu.kh',
      salaryInHour: 18.5,
      specialization: 'English & Literature (GEP)',
      bio: 'Certified Cambridge English teacher with IELTS 8.0.',
      status: 'ACTIVE',
      username: 'teacher_sreymom',
    },
    {
      code: 'TCH-2026-003',
      name: 'Dara Vong',
      nameKm: 'វង្ស តារា',
      gender: 'MALE',
      dob: '1985-11-03',
      phone: '077112233',
      email: 'dara.vong@school.edu.kh',
      salaryInHour: 20.0,
      specialization: 'Science & Physics',
      bio: 'Head of STEM Department with Master of Education.',
      status: 'ACTIVE',
      username: 'teacher_dara',
    },
    {
      code: 'TCH-2026-004',
      name: 'Bopha Pich',
      nameKm: 'ពេជ្រ បុប្ផា',
      gender: 'FEMALE',
      dob: '1995-02-14',
      phone: '089445566',
      email: 'bopha.pich@school.edu.kh',
      salaryInHour: 12.0,
      specialization: 'Early Childhood & Kindergarten',
      bio: 'Passionate EYFS lead instructor with 5 years early learning experience.',
      status: 'ON_LEAVE',
      username: 'teacher_bopha',
    },
    {
      code: 'TCH-2026-005',
      name: 'Vireak Men',
      nameKm: 'ម៉ែន វិរៈ',
      gender: 'MALE',
      dob: '1980-07-30',
      phone: '010998877',
      email: 'vireak.men@school.edu.kh',
      salaryInHour: 14.0,
      specialization: 'Khmer Literature & History',
      bio: 'Senior National Curriculum advisor.',
      status: 'INACTIVE',
      username: 'teacher_vireak',
    },
  ];

  const defaultPasswordHash = hashPassword('teacher123');

  for (const t of teacherFixtures) {
    // Check if user already exists
    const existingUser = await dataSource.query(`SELECT id FROM users WHERE username = $1 LIMIT 1`, [t.username]);
    let userId: number;
    if (!existingUser || existingUser.length === 0) {
      const userUuid = randomUUID();
      await dataSource.query(
        `INSERT INTO users (uuid, username, password, user_type, status, created_at, updated_at) VALUES ($1, $2, $3, 'CMS', 'ACTIVE', NOW(), NOW()) ON CONFLICT (username) DO NOTHING`,
        [userUuid, t.username, defaultPasswordHash]
      );
      const newUser = await dataSource.query(`SELECT id FROM users WHERE username = $1 LIMIT 1`, [t.username]);
      userId = newUser[0].id;
    } else {
      userId = existingUser[0].id;
    }

    // Attach role to user
    await dataSource.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, teacherRoleId]
    );

    // Insert teacher
    const teacherUuid = randomUUID();
    await dataSource.query(
      `INSERT INTO teachers (uuid, user_id, teacher_code, name, name_km, gender, date_of_birth, phone, email, salary_in_hour, specialization, bio, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       ON CONFLICT (teacher_code) DO UPDATE SET name = EXCLUDED.name, salary_in_hour = EXCLUDED.salary_in_hour, status = EXCLUDED.status`,
      [
        teacherUuid,
        userId,
        t.code,
        t.name,
        t.nameKm,
        t.gender,
        t.dob,
        t.phone,
        t.email,
        t.salaryInHour,
        t.specialization,
        t.bio,
        t.status,
      ]
    );
  }

  // 3. Assign first teachers to existing classes if any
  const teachers = await dataSource.query(`SELECT id FROM teachers WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 2`);
  if (teachers && teachers.length > 0) {
    const t1Id = teachers[0].id;
    const t2Id = teachers.length > 1 ? teachers[1].id : t1Id;

    const classes = await dataSource.query(`SELECT id FROM classes LIMIT 4`);
    if (classes && classes.length > 0) {
      for (let i = 0; i < classes.length; i++) {
        const assignedId = i % 2 === 0 ? t1Id : t2Id;
        await dataSource.query(`UPDATE classes SET teacher_id = $1 WHERE id = $2`, [assignedId, classes[i].id]);
      }
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`UPDATE classes SET teacher_id = NULL;`);
  await dataSource.query(`TRUNCATE TABLE teachers CASCADE;`);
  await dataSource.query(`DELETE FROM users WHERE username LIKE 'teacher_%';`);
};
