import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS student_attendances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      student_id INT NOT NULL,
      class_id INT NOT NULL,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
      session_slot_id INT NULL,
      remarks TEXT NULL,
      recorded_by INT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_stu_att_date (date),
      INDEX idx_stu_att_status (status),
      INDEX idx_stu_att_class_date (class_id, date),
      INDEX idx_stu_att_student (student_id),
      CONSTRAINT fk_student_attendances_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      CONSTRAINT fk_student_attendances_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
      CONSTRAINT fk_student_attendances_slot FOREIGN KEY (session_slot_id) REFERENCES class_timetables (id) ON DELETE SET NULL,
      CONSTRAINT fk_student_attendances_recorder FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS student_attendances;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
