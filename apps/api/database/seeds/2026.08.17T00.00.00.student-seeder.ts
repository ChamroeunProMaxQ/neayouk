import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';
import {
  SemesterEnum,
  StudentStatusEnum,
  ClassEnrollmentStatusEnum,
  PaymentStatusEnum,
  PaymentMethodEnum,
} from '@repo/contracts';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // 1. Seed Classes / Levels
  const classesList = [
    { name: 'Kindergarten - K1', code: 'K1-A', gradeLevel: 'K1', program: 'Kindergarten', section: 'A', monthlyFee: 45.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 25 },
    { name: 'Kindergarten - K2', code: 'K2-A', gradeLevel: 'K2', program: 'Kindergarten', section: 'A', monthlyFee: 45.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 25 },
    { name: 'Primary - Grade 1A', code: 'G1-A', gradeLevel: '1', program: 'Primary', section: 'A', monthlyFee: 65.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 1B', code: 'G1-B', gradeLevel: '1', program: 'Primary', section: 'B', monthlyFee: 65.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 2A', code: 'G2-A', gradeLevel: '2', program: 'Primary', section: 'A', monthlyFee: 65.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 3A', code: 'G3-A', gradeLevel: '3', program: 'Primary', section: 'A', monthlyFee: 70.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 4A', code: 'G4-A', gradeLevel: '4', program: 'Primary', section: 'A', monthlyFee: 70.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 5A', code: 'G5-A', gradeLevel: '5', program: 'Primary', section: 'A', monthlyFee: 75.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Primary - Grade 6A', code: 'G6-A', gradeLevel: '6', program: 'Primary', section: 'A', monthlyFee: 80.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 30 },
    { name: 'Secondary - Grade 7A', code: 'G7-A', gradeLevel: '7', program: 'Secondary', section: 'A', monthlyFee: 90.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 35 },
    { name: 'Secondary - Grade 8A', code: 'G8-A', gradeLevel: '8', program: 'Secondary', section: 'A', monthlyFee: 90.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 35 },
    { name: 'Secondary - Grade 9A', code: 'G9-A', gradeLevel: '9', program: 'Secondary', section: 'A', monthlyFee: 95.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 35 },
    { name: 'English ESL - Level 1', code: 'ESL-1', gradeLevel: 'ESL', program: 'Language', section: 'A', monthlyFee: 50.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 20 },
    { name: 'English ESL - Level 2', code: 'ESL-2', gradeLevel: 'ESL', program: 'Language', section: 'A', monthlyFee: 50.0, semester: SemesterEnum.SEMESTER_1, academicYear: '2025-2026', capacity: 20 },
  ];

  for (const c of classesList) {
    await dataSource.query(
      `INSERT INTO classes (uuid, name, code, grade_level, program, section, monthly_fee, semester, academic_year, capacity, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [randomUUID(), c.name, c.code, c.gradeLevel, c.program, c.section, c.monthlyFee, c.semester, c.academicYear, c.capacity, StudentStatusEnum.ACTIVE],
    );
  }

  const insertedClasses: { id: number; name: string; monthly_fee: string }[] = await dataSource.query(
    `SELECT id, name, monthly_fee FROM classes`,
  );
  const classMap = new Map<string, { id: number; monthly_fee: number }>();
  insertedClasses.forEach((c) => classMap.set(c.name, { id: c.id, monthly_fee: Number(c.monthly_fee) }));

  // 2. Seed Students
  const studentsList = [
    { code: 'STU2026001', firstName: 'Sokha', lastName: 'Chan', firstNameKm: 'សុខា', lastNameKm: 'ចាន់', gender: 'FEMALE', dob: '2016-04-12', phone: '012 345 678', guardian: 'Chan Samnang', guardianPhone: '092 112 233', payableDate: 1, discount: 5.0, primaryClass: 'Primary - Grade 1A', extraClass: 'English ESL - Level 1' },
    { code: 'STU2026002', firstName: 'Piseth', lastName: 'Mean', firstNameKm: 'ពិសិដ្ឋ', lastNameKm: 'មាន', gender: 'MALE', dob: '2015-08-23', phone: '098 765 432', guardian: 'Mean Vanna', guardianPhone: '088 223 344', payableDate: 5, discount: 0.0, primaryClass: 'Primary - Grade 2A', extraClass: undefined },
    { code: 'STU2026003', firstName: 'Sreypov', lastName: 'Keo', firstNameKm: 'ស្រីពៅ', lastNameKm: 'កែវ', gender: 'FEMALE', dob: '2017-02-14', phone: '077 889 900', guardian: 'Keo Sopheak', guardianPhone: '010 334 455', payableDate: 1, discount: 10.0, primaryClass: 'Kindergarten - K2', extraClass: undefined },
    { code: 'STU2026004', firstName: 'Vicheka', lastName: 'Heng', firstNameKm: 'វិច្ឆិកា', lastNameKm: 'ហេង', gender: 'MALE', dob: '2014-11-05', phone: '015 667 788', guardian: 'Heng Bunthoeun', guardianPhone: '012 445 566', payableDate: 10, discount: 0.0, primaryClass: 'Primary - Grade 3A', extraClass: 'English ESL - Level 2' },
    { code: 'STU2026005', firstName: 'Bopha', lastName: 'Seng', firstNameKm: 'បុប្ផា', lastNameKm: 'សេង', gender: 'FEMALE', dob: '2013-06-30', phone: '093 112 233', guardian: 'Seng Chamroeun', guardianPhone: '070 556 677', payableDate: 1, discount: 15.0, primaryClass: 'Primary - Grade 4A', extraClass: undefined },
    { code: 'STU2026006', firstName: 'Rotha', lastName: 'Chhim', firstNameKm: 'រដ្ឋា', lastNameKm: 'ឈឹម', gender: 'MALE', dob: '2012-09-18', phone: '085 223 344', guardian: 'Chhim Kosal', guardianPhone: '099 667 788', payableDate: 5, discount: 0.0, primaryClass: 'Primary - Grade 5A', extraClass: 'English ESL - Level 2' },
    { code: 'STU2026007', firstName: 'Sambath', lastName: 'Tep', firstNameKm: 'សម្បត្តិ', lastNameKm: 'ទេព', gender: 'MALE', dob: '2011-12-01', phone: '069 334 455', guardian: 'Tep Sarath', guardianPhone: '089 778 899', payableDate: 1, discount: 0.0, primaryClass: 'Primary - Grade 6A', extraClass: undefined },
    { code: 'STU2026008', firstName: 'Moniroth', lastName: 'Ly', firstNameKm: 'មុនីរ័ត្ន', lastNameKm: 'លី', gender: 'FEMALE', dob: '2010-03-25', phone: '011 445 566', guardian: 'Ly Rattanak', guardianPhone: '095 889 900', payableDate: 10, discount: 10.0, primaryClass: 'Secondary - Grade 7A', extraClass: 'English ESL - Level 2' },
    { code: 'STU2026009', firstName: 'Sovann', lastName: 'Sam', firstNameKm: 'សុវណ្ណ', lastNameKm: 'សំ', gender: 'MALE', dob: '2009-07-14', phone: '078 556 677', guardian: 'Sam Phally', guardianPhone: '017 990 011', payableDate: 1, discount: 0.0, primaryClass: 'Secondary - Grade 8A', extraClass: undefined },
    { code: 'STU2026010', firstName: 'Dara', lastName: 'Lim', firstNameKm: 'ដារ៉ា', lastNameKm: 'លីម', gender: 'MALE', dob: '2008-10-08', phone: '086 667 788', guardian: 'Lim Chetra', guardianPhone: '081 112 233', payableDate: 5, discount: 5.0, primaryClass: 'Secondary - Grade 9A', extraClass: undefined },
    { code: 'STU2026011', firstName: 'Pich', lastName: 'Mom', firstNameKm: 'ពេជ្រ', lastNameKm: 'ម៉ម', gender: 'FEMALE', dob: '2016-01-20', phone: '097 778 899', guardian: 'Mom Sopheap', guardianPhone: '068 223 344', payableDate: 1, discount: 0.0, primaryClass: 'Primary - Grade 1B', extraClass: 'English ESL - Level 1' },
    { code: 'STU2026012', firstName: 'Chantha', lastName: 'Kong', firstNameKm: 'ចាន់ថា', lastNameKm: 'គង់', gender: 'FEMALE', dob: '2015-05-19', phone: '016 889 900', guardian: 'Kong Veasna', guardianPhone: '076 334 455', payableDate: 10, discount: 0.0, primaryClass: 'Primary - Grade 2A', extraClass: undefined },
  ];

  for (const s of studentsList) {
    await dataSource.query(
      `INSERT INTO students (uuid, student_code, first_name, last_name, first_name_km, last_name_km, gender, date_of_birth, contact, guardian_name, guardian_phone, payable_date, registered_at, discount, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14, NOW(), NOW())
       ON CONFLICT (student_code) DO NOTHING`,
      [randomUUID(), s.code, s.firstName, s.lastName, s.firstNameKm, s.lastNameKm, s.gender, s.dob, s.phone, s.guardian, s.guardianPhone, s.payableDate, s.discount, StudentStatusEnum.ACTIVE],
    );
  }

  const insertedStudents: { id: number; student_code: string; discount: string }[] = await dataSource.query(
    `SELECT id, student_code, discount FROM students`,
  );
  const studentMap = new Map<string, { id: number; discount: number }>();
  insertedStudents.forEach((s) => studentMap.set(s.student_code, { id: s.id, discount: Number(s.discount) }));

  // 3. Seed Student Class Enrollments
  for (const s of studentsList) {
    const studentInfo = studentMap.get(s.code);
    if (!studentInfo) continue;

    const primaryCls = classMap.get(s.primaryClass);
    if (primaryCls) {
      await dataSource.query(
        `INSERT INTO student_classes (student_id, class_id, academic_year, semester, is_primary, status, enrolled_at, created_at, updated_at)
         VALUES ($1, $2, '2025-2026', $3, true, $4, NOW(), NOW(), NOW())`,
        [studentInfo.id, primaryCls.id, SemesterEnum.SEMESTER_1, ClassEnrollmentStatusEnum.ENROLLED],
      );
    }

    if (s.extraClass) {
      const extraCls = classMap.get(s.extraClass);
      if (extraCls) {
        await dataSource.query(
          `INSERT INTO student_classes (student_id, class_id, academic_year, semester, is_primary, status, enrolled_at, created_at, updated_at)
           VALUES ($1, $2, '2025-2026', $3, false, $4, NOW(), NOW(), NOW())`,
          [studentInfo.id, extraCls.id, SemesterEnum.SEMESTER_1, ClassEnrollmentStatusEnum.ENROLLED],
        );
      }
    }
  }

  // 4. Seed Monthly Payment Records for 2026 (Jan - Aug)
  for (const s of studentsList) {
    const studentInfo = studentMap.get(s.code);
    if (!studentInfo) continue;

    const primaryCls = classMap.get(s.primaryClass);
    if (!primaryCls) continue;

    const baseFee = primaryCls.monthly_fee;
    const discount = studentInfo.discount;
    const amountDue = Math.max(0, baseFee - discount);

    // Seed Jan, Feb, Mar as PAID
    for (let month = 1; month <= 3; month++) {
      const receiptNo = `REC-20260${month}-${s.code}`;
      const paidDate = `2026-0${month}-05 10:30:00`;
      await dataSource.query(
        `INSERT INTO student_payments (uuid, student_id, class_id, billing_year, billing_month, amount_due, amount_paid, discount_applied, status, payment_method, receipt_number, paid_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, 2026, $4, $5, $6, $7, $8, $9, $10, $11, 'Tuition fee payment', NOW(), NOW())
         ON CONFLICT (student_id, billing_year, billing_month) DO NOTHING`,
        [randomUUID(), studentInfo.id, primaryCls.id, month, amountDue, amountDue, discount, PaymentStatusEnum.PAID, PaymentMethodEnum.CASH, receiptNo, paidDate],
      );
    }

    // Seed April: some students paid, some partial, some unpaid
    if (s.code === 'STU2026001' || s.code === 'STU2026002') {
      const receiptNo = `REC-202604-${s.code}`;
      await dataSource.query(
        `INSERT INTO student_payments (uuid, student_id, class_id, billing_year, billing_month, amount_due, amount_paid, discount_applied, status, payment_method, receipt_number, paid_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, 2026, 4, $4, $5, $6, $7, $8, $9, '2026-04-06 14:15:00', 'Paid via KHQR Bakong', NOW(), NOW())
         ON CONFLICT (student_id, billing_year, billing_month) DO NOTHING`,
        [randomUUID(), studentInfo.id, primaryCls.id, amountDue, amountDue, discount, PaymentStatusEnum.PAID, PaymentMethodEnum.KHQR, receiptNo],
      );
    } else if (s.code === 'STU2026003') {
      const halfPaid = Math.round(amountDue / 2);
      const receiptNo = `REC-202604-${s.code}-PART`;
      await dataSource.query(
        `INSERT INTO student_payments (uuid, student_id, class_id, billing_year, billing_month, amount_due, amount_paid, discount_applied, status, payment_method, receipt_number, paid_at, notes, created_at, updated_at)
         VALUES ($1, $2, $3, 2026, 4, $4, $5, $6, $7, $8, $9, '2026-04-10 09:00:00', 'Partial deposit paid', NOW(), NOW())
         ON CONFLICT (student_id, billing_year, billing_month) DO NOTHING`,
        [randomUUID(), studentInfo.id, primaryCls.id, amountDue, halfPaid, discount, PaymentStatusEnum.PARTIAL, PaymentMethodEnum.CASH, receiptNo],
      );
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`TRUNCATE TABLE student_payments, student_classes, students, classes CASCADE;`);
};
