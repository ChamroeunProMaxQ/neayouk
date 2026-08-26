import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // 1. Seed Fee Structures
  const feeStructures = [
    { name: 'Grade 10 Tuition Fee', category: 'TUITION', amount: 150.0, billing_cycle: 'MONTHLY', is_optional: false, description: 'Monthly tuition fee' },
    { name: 'Annual Registration Fee', category: 'REGISTRATION', amount: 50.0, billing_cycle: 'ANNUAL', is_optional: false, description: 'New student registration' },
    { name: 'School Uniform - Size M', category: 'OTHER', amount: 15.0, billing_cycle: 'ONE_TIME', is_optional: true, description: 'School shirt & pants/skirt (Size M)' },
    { name: 'School Uniform - Size L', category: 'OTHER', amount: 18.0, billing_cycle: 'ONE_TIME', is_optional: true, description: 'School shirt & pants/skirt (Size L)' },
    { name: 'Textbooks & Study Kit', category: 'OTHER', amount: 45.0, billing_cycle: 'ANNUAL', is_optional: false, description: 'Semester curriculum book bundle' },
    { name: 'School Bus Route A', category: 'TRANSPORTATION', amount: 35.0, billing_cycle: 'MONTHLY', is_optional: true, description: 'Monthly shuttle bus service' },
    { name: 'School Lunch Program', category: 'MEALS', amount: 40.0, billing_cycle: 'MONTHLY', is_optional: true, description: 'Daily hot meal catering' },
  ];

  for (const fee of feeStructures) {
    const existing = await dataSource.query(`SELECT id FROM fee_structures WHERE name = $1`, [fee.name]);
    if (existing.length === 0) {
      await dataSource.query(
        `INSERT INTO fee_structures (uuid, name, category, amount, billing_cycle, is_optional, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [randomUUID(), fee.name, fee.category, fee.amount, fee.billing_cycle, fee.is_optional, fee.description]
      );
    }
  }

  // 2. Query sample student & class
  const students = await dataSource.query(`SELECT id FROM students LIMIT 5`);
  const feeList = await dataSource.query(`SELECT id, name, amount FROM fee_structures LIMIT 3`);

  if (students.length > 0) {
    const student1 = students[0];
    const student2 = students[1] || students[0];

    // Seed Payments
    const payments = [
      {
        number: 'INV-202608-0001',
        studentId: student1.id,
        classId: null,
        year: 2026,
        month: 8,
        subtotal: 195.0,
        discount: 10.0,
        total: 185.0,
        paid: 185.0,
        status: 'PAID',
        notes: 'Tuition and books for August',
      },
      {
        number: 'INV-202608-0002',
        studentId: student2.id,
        classId: null,
        year: 2026,
        month: 8,
        subtotal: 150.0,
        discount: 0.0,
        total: 150.0,
        paid: 0.0,
        status: 'UNPAID',
        notes: 'August Monthly Tuition',
      },
    ];

    for (const p of payments) {
      const existingPayment = await dataSource.query(
        `SELECT id FROM student_payments WHERE payment_number = $1 OR receipt_number = $1`,
        [p.number]
      );
      if (existingPayment.length === 0) {
        const result = await dataSource.query(
          `INSERT INTO student_payments (
             uuid, payment_number, receipt_number, student_id, class_id, billing_year, billing_month,
             issue_date, due_date, subtotal, discount_amount, total_amount, amount_due, amount_paid,
             discount_applied, status, notes
           )
           VALUES ($1, $2, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', $7, $8, $9, $9, $10, $8, $11, $12)
           RETURNING id`,
          [randomUUID(), p.number, p.studentId, p.classId, p.year, p.month, p.subtotal, p.discount, p.total, p.paid, p.status, p.notes]
        );
        const paymentId = result[0]?.id;

        if (paymentId && feeList.length > 0) {
          await dataSource.query(
            `INSERT INTO payment_items (uuid, payment_id, fee_structure_id, title, amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [randomUUID(), paymentId, feeList[0].id, feeList[0].name, feeList[0].amount]
          );
        }
      }
    }
  }

  // 3. Seed School Expenses
  const expenses = [
    { title: 'Campus High-Speed Internet Subscription', category: 'UTILITIES', amount: 120.0, date: '2026-08-01', vendor: 'ISP Telecom', method: 'BANK_TRANSFER', status: 'PAID', ref: 'EXP-801' },
    { title: 'Air Conditioner Repair & Servicing', category: 'MAINTENANCE', amount: 250.0, date: '2026-08-05', vendor: 'Cooling Tech Co.', method: 'CASH', status: 'APPROVED', ref: 'EXP-802' },
    { title: 'Whiteboard Markers & A4 Paper Supply', category: 'SUPPLIES', amount: 85.0, date: '2026-08-10', vendor: 'City Stationers', method: 'CASH', status: 'PENDING', ref: 'EXP-803' },
  ];

  for (const exp of expenses) {
    const existingExp = await dataSource.query(`SELECT id FROM school_expenses WHERE title = $1`, [exp.title]);
    if (existingExp.length === 0) {
      await dataSource.query(
        `INSERT INTO school_expenses (uuid, title, category, amount, expense_date, vendor, payment_method, status, receipt_ref)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [randomUUID(), exp.title, exp.category, exp.amount, exp.date, exp.vendor, exp.method, exp.status, exp.ref]
      );
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`DELETE FROM school_expenses WHERE title IN ('Campus High-Speed Internet Subscription', 'Air Conditioner Repair & Servicing', 'Whiteboard Markers & A4 Paper Supply');`);
  await dataSource.query(`DELETE FROM student_payments WHERE payment_number IN ('INV-202608-0001', 'INV-202608-0002');`);
  await dataSource.query(`DELETE FROM fee_structures WHERE name IN ('Grade 10 Tuition Fee', 'Annual Registration Fee', 'School Uniform - Size M', 'School Uniform - Size L', 'Textbooks & Study Kit', 'School Bus Route A', 'School Lunch Program');`);
};
