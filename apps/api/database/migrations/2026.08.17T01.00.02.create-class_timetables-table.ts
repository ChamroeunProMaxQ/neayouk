import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS class_timetables (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL,
      class_id INT NOT NULL,
      day_of_week VARCHAR(20) NOT NULL DEFAULT 'MONDAY',
      subject VARCHAR(255) NOT NULL,
      subject_code VARCHAR(50) NULL,
      teacher_id INT NULL,
      teacher_name VARCHAR(255) NULL,
      room VARCHAR(100) NULL,
      start_time VARCHAR(10) NOT NULL DEFAULT '08:00',
      end_time VARCHAR(10) NOT NULL DEFAULT '09:30',
      color_tag VARCHAR(50) NULL DEFAULT '#45AC5E',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_class_timetables_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_class_timetables_class_id ON class_timetables (class_id);
    CREATE INDEX IF NOT EXISTS idx_class_timetables_day ON class_timetables (day_of_week);
    CREATE INDEX IF NOT EXISTS idx_class_timetables_teacher ON class_timetables (teacher_id);
    CREATE INDEX IF NOT EXISTS idx_class_timetables_room ON class_timetables (room);
  `);
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DROP TABLE IF EXISTS class_timetables CASCADE;`);
};
