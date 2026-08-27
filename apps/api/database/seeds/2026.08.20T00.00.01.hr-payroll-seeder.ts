import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  try {
    await dataSource.query(`
      SELECT setval(pg_get_serial_sequence('staff', 'id'), COALESCE(MAX(id), 1)) FROM staff;
    `);
  } catch {}

  const staffFixtures = [
    {
      uuid: randomUUID(),
      staffCode: 'STF-2026-001',
      name: 'John Doe',
      nameKm: 'ចន ដូ',
      gender: 'MALE',
      dateOfBirth: '1988-04-12',
      phone: '012345678',
      email: 'john.doe@elc.edu.kh',
      department: 'ACADEMIC',
      designation: 'Teacher',
      specialization: 'Mathematics',
      bio: 'Senior Mathematics Instructor with 8 years of teaching experience.',
      employmentType: 'FULL_TIME',
      salaryType: 'HOURLY',
      baseSalary: 0.0,
      hourlyRate: 15.0,
      joiningDate: '2022-01-15',
      bankName: 'ABA Bank',
      bankAccountName: 'JOHN DOE',
      bankAccountNumber: '000123456',
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      staffCode: 'STF-2026-002',
      name: 'Sokha Chan',
      nameKm: 'សុខា ចាន់',
      gender: 'FEMALE',
      dateOfBirth: '1992-08-23',
      phone: '098765432',
      email: 'sokha.chan@elc.edu.kh',
      department: 'ACADEMIC',
      designation: 'Teacher',
      specialization: 'English Literature',
      bio: 'ESL and English Literature specialist.',
      employmentType: 'FULL_TIME',
      salaryType: 'MONTHLY',
      baseSalary: 650.0,
      hourlyRate: 0.0,
      joiningDate: '2023-03-01',
      bankName: 'ABA Bank',
      bankAccountName: 'SOKHA CHAN',
      bankAccountNumber: '000987654',
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      staffCode: 'STF-2026-003',
      name: 'Vannak Meas',
      nameKm: 'វណ្ណៈ មាស',
      gender: 'MALE',
      dateOfBirth: '1985-11-05',
      phone: '011223344',
      email: 'vannak.meas@elc.edu.kh',
      department: 'MANAGEMENT',
      designation: 'Branch Principal',
      specialization: null,
      bio: 'School Branch Principal and Operational Director.',
      employmentType: 'FULL_TIME',
      salaryType: 'MONTHLY',
      baseSalary: 1200.0,
      hourlyRate: 0.0,
      joiningDate: '2020-09-01',
      bankName: 'Canadia Bank',
      bankAccountName: 'VANNAK MEAS',
      bankAccountNumber: '010203040',
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      staffCode: 'STF-2026-004',
      name: 'Bopha Pich',
      nameKm: 'បុប្ផា ពេជ្រ',
      gender: 'FEMALE',
      dateOfBirth: '1995-02-18',
      phone: '077889900',
      email: 'bopha.pich@elc.edu.kh',
      department: 'FINANCE',
      designation: 'Chief Accountant',
      specialization: null,
      bio: 'Certified public accountant managing school ledger and fee collections.',
      employmentType: 'FULL_TIME',
      salaryType: 'MONTHLY',
      baseSalary: 800.0,
      hourlyRate: 0.0,
      joiningDate: '2021-06-15',
      bankName: 'ABA Bank',
      bankAccountName: 'BOPHA PICH',
      bankAccountNumber: '000554433',
      status: 'ACTIVE',
    },
    {
      uuid: randomUUID(),
      staffCode: 'STF-2026-005',
      name: 'Dara Keo',
      nameKm: 'ដារ៉ា កែវ',
      gender: 'MALE',
      dateOfBirth: '1998-07-30',
      phone: '088112233',
      email: 'dara.keo@elc.edu.kh',
      department: 'OPERATIONS',
      designation: 'Front Desk Receptionist',
      specialization: null,
      bio: 'Customer service, visitor management, and student check-ins.',
      employmentType: 'FULL_TIME',
      salaryType: 'MONTHLY',
      baseSalary: 400.0,
      hourlyRate: 0.0,
      joiningDate: '2024-01-10',
      bankName: 'ACLEDA Bank',
      bankAccountName: 'DARA KEO',
      bankAccountNumber: '12345678901',
      status: 'ACTIVE',
    },
  ];

  for (const s of staffFixtures) {
    await dataSource.query(
      `
      INSERT INTO staff (
        uuid, staff_code, name, name_km, gender, date_of_birth,
        phone, email, department, designation, specialization, bio,
        employment_type, salary_type, base_salary, hourly_rate,
        joining_date, bank_name, bank_account_name, bank_account_number,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
      )
      ON CONFLICT (staff_code) DO NOTHING
    `,
      [
        s.uuid,
        s.staffCode,
        s.name,
        s.nameKm,
        s.gender,
        s.dateOfBirth,
        s.phone,
        s.email,
        s.department,
        s.designation,
        s.specialization,
        s.bio,
        s.employmentType,
        s.salaryType,
        s.baseSalary,
        s.hourlyRate,
        s.joiningDate,
        s.bankName,
        s.bankAccountName,
        s.bankAccountNumber,
        s.status,
      ],
    );
  }

  // Fetch inserted staff to seed payrolls
  const allStaff: { id: number; staff_code: string; salary_type: string; base_salary: number; hourly_rate: number }[] =
    await dataSource.query(`SELECT id, staff_code, salary_type, base_salary, hourly_rate FROM staff`);

  const staffMap = new Map(allStaff.map((st) => [st.staff_code, st]));

  const john = staffMap.get('STF-2026-001');
  const sokha = staffMap.get('STF-2026-002');
  const vannak = staffMap.get('STF-2026-003');

  if (john) {
    const payrollUuid = randomUUID();
    const res = await dataSource.query(
      `
      INSERT INTO payrolls (
        uuid, payroll_number, staff_id, year, month, start_date, end_date,
        working_days, holiday_days, salary_type, base_salary, hourly_rate,
        total_hours_worked, calculated_base_amount, total_bonus, total_deduction,
        gross_salary, net_salary, status, payment_method, payment_date,
        payment_reference, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 2026, 8, '2026-08-01', '2026-08-31',
        22, 0, 'HOURLY', 0, 15.0,
        35.0, 525.0, 50.0, 20.0,
        575.0, 555.0, 'PAID', 'BANK_TRANSFER', '2026-08-31 16:30:00',
        'TRX-ABA-20260831-01', 'August 2026 Teaching Payroll', NOW(), NOW()
      )
      ON CONFLICT (payroll_number) DO NOTHING
      RETURNING id;
    `,
      [payrollUuid, 'PAY-202608-0001', john.id],
    );

    const pId = res[0]?.id;
    if (pId) {
      await dataSource.query(`
        INSERT INTO payroll_items (uuid, payroll_id, item_type, title, amount, description, created_at, updated_at)
        VALUES
          ('${randomUUID()}', ${pId}, 'BONUS', 'Performance Bonus', 50.00, 'Student retention and positive feedback', NOW(), NOW()),
          ('${randomUUID()}', ${pId}, 'DEDUCTION', 'Advance Salary Repayment', 20.00, 'Advance taken on 2026-08-10', NOW(), NOW())
      `);
    }
  }

  if (sokha) {
    const payrollUuid = randomUUID();
    const res = await dataSource.query(
      `
      INSERT INTO payrolls (
        uuid, payroll_number, staff_id, year, month, start_date, end_date,
        working_days, holiday_days, salary_type, base_salary, hourly_rate,
        total_hours_worked, calculated_base_amount, total_bonus, total_deduction,
        gross_salary, net_salary, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 2026, 8, '2026-08-01', '2026-08-31',
        22, 0, 'MONTHLY', 650.0, 0,
        0, 650.0, 30.0, 0.0,
        680.0, 680.0, 'DRAFT', 'August 2026 Monthly Salary Draft', NOW(), NOW()
      )
      ON CONFLICT (payroll_number) DO NOTHING
      RETURNING id;
    `,
      [payrollUuid, 'PAY-202608-0002', sokha.id],
    );

    const pId = res[0]?.id;
    if (pId) {
      await dataSource.query(`
        INSERT INTO payroll_items (uuid, payroll_id, item_type, title, amount, description, created_at, updated_at)
        VALUES
          ('${randomUUID()}', ${pId}, 'BONUS', 'Perfect Attendance Allowance', 30.00, 'Zero absences in August', NOW(), NOW())
      `);
    }
  }

  if (vannak) {
    const payrollUuid = randomUUID();
    const res = await dataSource.query(
      `
      INSERT INTO payrolls (
        uuid, payroll_number, staff_id, year, month, start_date, end_date,
        working_days, holiday_days, salary_type, base_salary, hourly_rate,
        total_hours_worked, calculated_base_amount, total_bonus, total_deduction,
        gross_salary, net_salary, status, payment_method, payment_date,
        payment_reference, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 2026, 8, '2026-08-01', '2026-08-31',
        22, 0, 'MONTHLY', 1200.0, 0,
        0, 1200.0, 100.0, 50.0,
        1300.0, 1250.0, 'PAID', 'BANK_TRANSFER', '2026-08-31 17:00:00',
        'TRX-CANADIA-20260831-01', 'Principal Management Compensation', NOW(), NOW()
      )
      ON CONFLICT (payroll_number) DO NOTHING
      RETURNING id;
    `,
      [payrollUuid, 'PAY-202608-0003', vannak.id],
    );

    const pId = res[0]?.id;
    if (pId) {
      await dataSource.query(`
        INSERT INTO payroll_items (uuid, payroll_id, item_type, title, amount, description, created_at, updated_at)
        VALUES
          ('${randomUUID()}', ${pId}, 'ALLOWANCE', 'Executive Responsibility Allowance', 100.00, 'Branch expansion leadership', NOW(), NOW()),
          ('${randomUUID()}', ${pId}, 'TAX', 'Salary Withholding Tax', 50.00, 'Standard salary tax tier', NOW(), NOW())
      `);
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);
  await dataSource.query(`
    DELETE FROM payroll_items WHERE payroll_id IN (SELECT id FROM payrolls WHERE payroll_number LIKE 'PAY-202608-%');
    DELETE FROM payrolls WHERE payroll_number LIKE 'PAY-202608-%';
    DELETE FROM staff WHERE staff_code LIKE 'STF-2026-%';
  `);
};
