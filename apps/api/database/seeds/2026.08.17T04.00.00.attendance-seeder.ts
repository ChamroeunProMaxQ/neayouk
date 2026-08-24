import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // 1. Get sample students, classes, and teachers
  const students = await dataSource.query(`SELECT id FROM students LIMIT 10`);
  const classes = await dataSource.query(`SELECT id FROM classes LIMIT 2`);
  const teachers = await dataSource.query(`SELECT id, user_id FROM teachers LIMIT 4`);
  const adminUser = await dataSource.query(`SELECT id FROM users WHERE user_type = 'ADMIN' LIMIT 1`);
  const adminUserId = adminUser && adminUser.length > 0 ? adminUser[0].id : null;

  const dates = ['2026-08-15', '2026-08-16', '2026-08-17'];
  const studentStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];

  // Seed student attendances
  if (students && students.length > 0 && classes && classes.length > 0) {
    const classId = classes[0].id;
    for (const d of dates) {
      for (let i = 0; i < students.length; i++) {
        const studentId = students[i].id;
        const status = studentStatuses[(i + dates.indexOf(d)) % studentStatuses.length];
        const remarks = status === 'LATE' ? 'Late 15 minutes due to traffic' : status === 'EXCUSED' ? 'Doctor appointment' : null;
        
        await dataSource.query(
          `INSERT INTO student_attendances (uuid, student_id, class_id, date, status, remarks, recorded_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [randomUUID(), studentId, classId, d, status, remarks, adminUserId]
        );
      }
    }
  }

  // Seed teacher attendances
  if (teachers && teachers.length > 0) {
    for (const d of dates) {
      for (let i = 0; i < teachers.length; i++) {
        const teacherId = teachers[i].id;
        const status = i === 3 ? 'ON_LEAVE' : i === 2 ? 'LATE' : 'PRESENT';
        const checkIn = status === 'ON_LEAVE' ? null : status === 'LATE' ? '08:15' : '07:30';
        const checkOut = status === 'ON_LEAVE' ? null : '11:30';
        const hoursWorked = status === 'ON_LEAVE' ? 0 : status === 'LATE' ? 3.25 : 4.0;
        const remarks = status === 'ON_LEAVE' ? 'Approved Casual Leave' : status === 'LATE' ? 'Rain delay' : null;

        await dataSource.query(
          `INSERT INTO teacher_attendances (uuid, teacher_id, date, check_in_time, check_out_time, hours_worked, status, remarks, verified_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           ON CONFLICT (teacher_id, date) DO NOTHING`,
          [randomUUID(), teacherId, d, checkIn, checkOut, hoursWorked, status, remarks, adminUserId]
        );
      }
    }
  }

  // Seed leave requests (for teachers)
  if (teachers && teachers.length > 0) {
    // 1. Approved Teacher Leave
    await dataSource.query(
      `INSERT INTO leave_requests (uuid, teacher_id, user_id, leave_type, start_date, end_date, total_days, reason, status, reviewer_id, reviewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'CASUAL', '2026-08-17', '2026-08-17', 1.0, 'Family obligation', 'APPROVED', $4, NOW(), NOW(), NOW())`,
      [randomUUID(), teachers[0].id, teachers[0].user_id, adminUserId]
    );

    // 2. Pending Teacher Leave
    if (teachers.length > 1) {
      await dataSource.query(
        `INSERT INTO leave_requests (uuid, teacher_id, user_id, leave_type, start_date, end_date, total_days, reason, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'SICK', '2026-08-20', '2026-08-21', 2.0, 'Dental surgery and recovery', 'PENDING', NOW(), NOW())`,
        [randomUUID(), teachers[1].id, teachers[1].user_id]
      );
    }

    // 3. Rejected Teacher Leave
    if (teachers.length > 2) {
      await dataSource.query(
        `INSERT INTO leave_requests (uuid, teacher_id, user_id, leave_type, start_date, end_date, total_days, reason, status, reviewer_id, reviewed_at, rejection_reason, created_at, updated_at)
         VALUES ($1, $2, $3, 'OTHER', '2026-08-18', '2026-08-19', 2.0, 'Trip without advance notice', 'REJECTED', $4, NOW(), 'Leave request must be submitted at least 3 days in advance.', NOW(), NOW())`,
        [randomUUID(), teachers[2].id, teachers[2].user_id, adminUserId]
      );
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`TRUNCATE TABLE student_attendances, teacher_attendances, leave_requests CASCADE;`);
};
