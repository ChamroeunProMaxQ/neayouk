import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      teacher_id INT NOT NULL,
      user_id INT NULL,
      leave_type VARCHAR(30) NOT NULL DEFAULT 'CASUAL',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days DECIMAL(4, 1) NOT NULL DEFAULT 1.0,
      reason TEXT NOT NULL,
      attachment_url VARCHAR(500) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      reviewer_id INT NULL,
      reviewed_at TIMESTAMP NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_leave_requests_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
      CONSTRAINT fk_leave_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      CONSTRAINT fk_leave_requests_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leave_req_status ON leave_requests (status);
    CREATE INDEX IF NOT EXISTS idx_leave_req_teacher ON leave_requests (teacher_id);
    CREATE INDEX IF NOT EXISTS idx_leave_req_dates ON leave_requests (start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_leave_req_user ON leave_requests (user_id);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS leave_requests CASCADE;`);
};
