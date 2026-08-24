import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';
import { DayOfWeekEnum } from '@repo/contracts';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // Update existing classes with default room, shift, start_time, end_time, start_date, end_date
  await dataSource.query(`
    UPDATE classes
    SET room = COALESCE(room, 'Room ' || (id + 100)),
        shift = COALESCE(shift, 'MORNING'),
        start_time = COALESCE(start_time, '07:30'),
        end_time = COALESCE(end_time, '11:30'),
        start_date = COALESCE(start_date, '2025-09-01'),
        end_date = COALESCE(end_date, '2026-06-30')
    WHERE deleted_at IS NULL;
  `);

  // Fetch active classes to attach timetables
  const classes: { id: number; name: string }[] = await dataSource.query(`
    SELECT id, name FROM classes WHERE deleted_at IS NULL LIMIT 10;
  `);

  if (!classes.length) return;

  const moduleTemplates = [
    { day: DayOfWeekEnum.MONDAY, subject: 'Phonics & Vocabulary', code: 'VOC-101', startTime: '07:30', endTime: '09:00', colorTag: '#45AC5E' },
    { day: DayOfWeekEnum.MONDAY, subject: 'Speaking & Pronunciation', code: 'SPK-101', startTime: '09:30', endTime: '11:00', colorTag: '#3B82F6' },
    { day: DayOfWeekEnum.TUESDAY, subject: 'Reading Comprehension', code: 'RDG-101', startTime: '07:30', endTime: '09:00', colorTag: '#8B5CF6' },
    { day: DayOfWeekEnum.TUESDAY, subject: 'Grammar Practice', code: 'GRM-101', startTime: '09:30', endTime: '11:00', colorTag: '#F59E0B' },
    { day: DayOfWeekEnum.WEDNESDAY, subject: 'Listening & Dialogue', code: 'LIS-101', startTime: '07:30', endTime: '09:00', colorTag: '#45AC5E' },
    { day: DayOfWeekEnum.WEDNESDAY, subject: 'Writing & Expression', code: 'WRT-101', startTime: '09:30', endTime: '11:00', colorTag: '#EC4899' },
    { day: DayOfWeekEnum.THURSDAY, subject: 'Conversation Lab', code: 'LAB-101', startTime: '07:30', endTime: '09:00', colorTag: '#10B981' },
    { day: DayOfWeekEnum.THURSDAY, subject: 'Review & Progress Quiz', code: 'REV-101', startTime: '09:30', endTime: '11:00', colorTag: '#8B5CF6' },
    { day: DayOfWeekEnum.FRIDAY, subject: 'Computer & Office Practice', code: 'ICT-101', startTime: '07:30', endTime: '09:00', colorTag: '#06B6D4' },
    { day: DayOfWeekEnum.FRIDAY, subject: 'Group Presentation & Activities', code: 'ACT-101', startTime: '09:30', endTime: '11:00', colorTag: '#F97316' },
  ];

  for (const cls of classes) {
    for (const t of moduleTemplates) {
      const roomStr = `Room ${cls.id + 100}`;
      await dataSource.query(`
        INSERT INTO class_timetables (uuid, class_id, day_of_week, subject, subject_code, teacher_name, room, start_time, end_time, color_tag, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'Mr. Sokha', $6, $7, $8, $9, NOW(), NOW())
      `, [randomUUID(), cls.id, t.day, t.subject, t.code, roomStr, t.startTime, t.endTime, t.colorTag]);
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`TRUNCATE TABLE class_timetables CASCADE;`);
};
