import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  const defaultBranch = await dataSource.query(`SELECT id FROM branches WHERE is_default = TRUE OR id = 1 LIMIT 1`);
  const defaultBranchId = defaultBranch[0]?.id ?? 1;

  await dataSource.query(`UPDATE fee_structures SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE school_expenses SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`
    UPDATE student_payments sp
    SET branch_id = COALESCE(s.branch_id, $1)
    FROM students s
    WHERE sp.student_id = s.id AND sp.branch_id IS NULL
  `, [defaultBranchId]);
  await dataSource.query(`UPDATE student_payments SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE grading_rules SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE payrolls SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE programs SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE classes SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE students SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
  await dataSource.query(`UPDATE staff SET branch_id = $1 WHERE branch_id IS NULL`, [defaultBranchId]);
};

export const down: MigrationFn<DataSource> = async () => {
  // No rollback necessary for data backfill
};
