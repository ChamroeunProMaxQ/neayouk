import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS class_timetables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      class_id INT NOT NULL,
      day_of_week VARCHAR(20) NOT NULL DEFAULT 'MONDAY',
      subject VARCHAR(255) NOT NULL,
      subject_code VARCHAR(50) NULL,
      teacher_id BIGINT UNSIGNED NULL,
      teacher_name VARCHAR(255) NULL,
      room VARCHAR(100) NULL,
      start_time VARCHAR(10) NOT NULL DEFAULT '08:00',
      end_time VARCHAR(10) NOT NULL DEFAULT '09:30',
      color_tag VARCHAR(50) NULL DEFAULT '#45AC5E',
      notes TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_class_timetables_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      INDEX idx_class_timetables_class_id (class_id),
      INDEX idx_class_timetables_day (day_of_week),
      INDEX idx_class_timetables_teacher (teacher_id),
      INDEX idx_class_timetables_room (room)
    ) ENGINE=InnoDB;
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await dataSource.query(`DROP TABLE IF EXISTS class_timetables;`);
  await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1;`);
};
