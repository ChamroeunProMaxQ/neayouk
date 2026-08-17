import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // Ensure column books exists if table was created previously
  const cols: Array<{ COLUMN_NAME: string }> = await dataSource.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'programs'
      AND COLUMN_NAME = 'books';
  `);

  if (cols.length === 0) {
    await dataSource.query(`
      ALTER TABLE programs
      ADD COLUMN books JSON NULL AFTER code;
    `);
  }

  // All books and programs have levels 1 to 6
  const levels1to6 = ['1', '2', '3', '4', '5', '6'];

  const programs = [
    {
      uuid: randomUUID(),
      name: 'English For Kindergarten',
      code: 'EFK',
      books: JSON.stringify(['Phonics World']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'English For Kids',
      code: 'EFKIDS',
      books: JSON.stringify(['Oxford Discover']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'GEP For Teenagers',
      code: 'GEP-TEEN',
      books: JSON.stringify(['Solutions']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'GEP For Adults',
      code: 'GEP-ADULT',
      books: JSON.stringify(['New Headway']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'GCP For Kids',
      code: 'GCP-KIDS',
      books: JSON.stringify(['Easy Step to Chinese']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'GCP For Adults',
      code: 'GCP-ADULT',
      books: JSON.stringify(['Discover China']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      name: 'Computer Administration',
      code: 'COMP-ADMIN',
      books: JSON.stringify(['Computer Fundamentals', 'Microsoft Word', 'Microsoft Excel', 'Canva']),
      gradeLevels: JSON.stringify(levels1to6),
      status: 'ACTIVE',
    },
  ];

  for (const prog of programs) {
    const existing = await dataSource.query(`SELECT id FROM programs WHERE code = ? OR name = ?`, [prog.code, prog.name]);
    if (existing.length === 0) {
      await dataSource.query(
        `INSERT INTO programs (uuid, name, code, books, grade_levels, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          prog.uuid,
          prog.name,
          prog.code,
          prog.books,
          prog.gradeLevels,
          prog.status,
        ],
      );
    } else {
      await dataSource.query(
        `UPDATE programs 
         SET name = ?, code = ?, books = ?, grade_levels = ?, status = ?, updated_at = NOW() 
         WHERE id = ?`,
        [prog.name, prog.code, prog.books, prog.gradeLevels, prog.status, existing[0].id],
      );
    }
  }

  // Link existing classes to matching programs if program_id is null
  const insertedPrograms: Array<{ id: number; name: string; code: string }> =
    await dataSource.query(`SELECT id, name, code FROM programs`);

  for (const prog of insertedPrograms) {
    await dataSource.query(
      `UPDATE classes 
       SET program_id = ? 
       WHERE (program LIKE ? OR name LIKE ?) AND (program_id IS NULL OR program_id = 0)`,
      [prog.id, `%${prog.name}%`, `%${prog.name}%`],
    );
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(
    `DELETE FROM programs WHERE code IN ('EFK', 'EFKIDS', 'GEP-TEEN', 'GEP-ADULT', 'GCP-KIDS', 'GCP-ADULT', 'COMP-ADMIN');`,
  );
};
