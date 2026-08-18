import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS teacher_attendances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      teacher_id INT NOT NULL,
      date DATE NOT NULL,
      check_in_time VARCHAR(10) NULL,
      check_out_time VARCHAR(10) NULL,
      hours_worked DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
      remarks TEXT NULL,
      verified_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_tch_att_date (date),
      INDEX idx_tch_att_status (status),
      INDEX idx_tch_att_teacher (teacher_id),
      UNIQUE KEY uq_tch_att_record (teacher_id, date),
      CONSTRAINT fk_teacher_attendances_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
      CONSTRAINT fk_teacher_attendances_verifier FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS teacher_attendances;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
