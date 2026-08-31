import type { INestApplication } from '@nestjs/common';
import { ExpenseStatusEnum, UserTypeEnum } from '@repo/contracts';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2eApp, teardownE2eApp } from './utils/e2e-test.utils.js';

describe('Multi-Branch Cross-Domain Scoping & Isolation (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let superAdminToken: string;
  let branch1AdminToken: string;
  let branch2AdminToken: string;
  let branch2Id: number;

  beforeAll(async () => {
    const ctx = await setupE2eApp();
    app = ctx.app;
    server = ctx.server;

    superAdminToken = ctx.createToken({
      sub: 1,
      username: 'superadmin',
      type: UserTypeEnum.SUPER_ADMIN,
      userType: UserTypeEnum.SUPER_ADMIN,
      branchId: null,
    });

    // 1. Provision Branch 2
    const branch2Res = await request(server)
      .post('/api/v1/superadmin/branches')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        branchName: 'South Campus Domain',
        code: 'SCDOMAIN',
        adminUsername: 'south_domain_admin',
        adminPassword: 'password123',
        adminName: 'South Domain Admin',
      })
      .expect(201);

    branch2Id = branch2Res.body.data.branch.id;

    branch1AdminToken = ctx.createToken({
      sub: 10,
      username: 'branch1_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
    });

    branch2AdminToken = ctx.createToken({
      sub: branch2Res.body.data.adminUser.id,
      username: 'south_domain_admin',
      type: UserTypeEnum.ADMIN,
      userType: UserTypeEnum.ADMIN,
      branchId: branch2Id,
    });
  });

  afterAll(async () => {
    await teardownE2eApp(app);
  });

  it('Students: Branch 1 Admin creates student -> Branch 2 Admin cannot see it in list', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/students')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        firstName: 'Branch1',
        lastName: 'Student',
        gender: 'MALE',
        dateOfBirth: '2010-01-01',
      });

    if (createRes.status !== 201) {
      console.log('STUDENT CREATE ERROR:', createRes.status, JSON.stringify(createRes.body));
    }
    expect(createRes.status).toBe(201);

    expect(createRes.body.data.branchId).toBe(1);

    // Branch 2 Admin list
    const listRes = await request(server)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const names = listRes.body.data.map((s: any) => `${s.firstName} ${s.lastName}`);
    expect(names).not.toContain('Branch1 Student');
  });

  it('Classes: Branch 1 Admin creates class -> Branch 2 Admin cannot see it in list', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/classes')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: 'Branch1 Grade 1A',
        code: `B1-G1A-${Date.now()}`,
        academicYear: '2026-2027',
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    // Branch 2 Admin list
    const listRes = await request(server)
      .get('/api/v1/admin/classes')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const classNames = listRes.body.data.map((c: any) => c.name);
    expect(classNames).not.toContain('Branch1 Grade 1A');
  });

  it('Programs: Branch 1 Admin creates program -> Branch 2 Admin cannot see it in list', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/programs')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: 'Branch1 English Program',
        code: `B1-ENG-${Date.now()}`,
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    const listRes = await request(server)
      .get('/api/v1/admin/programs')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const programNames = listRes.body.data.map((p: any) => p.name);
    expect(programNames).not.toContain('Branch1 English Program');
  });

  it('Teachers: Branch 1 Admin creates teacher -> Branch 2 Admin cannot see it in list', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: 'Branch1 Teacher Bob',
        gender: 'MALE',
        salaryInHour: 15,
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    const listRes = await request(server)
      .get('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const teacherNames = listRes.body.data.map((t: any) => t.name);
    expect(teacherNames).not.toContain('Branch1 Teacher Bob');
  });

  it('Fee Structures: Branch 1 Admin creates fee structure -> Branch 2 Admin cannot see it', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/fees/structures')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        name: 'Branch1 Tuition Fee',
        category: 'TUITION',
        amount: 250,
        billingCycle: 'MONTHLY',
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    const listRes = await request(server)
      .get('/api/v1/admin/fees/structures')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const feeNames = listRes.body.data.map((f: any) => f.name);
    expect(feeNames).not.toContain('Branch1 Tuition Fee');
  });

  it('Expenses: Branch 1 Admin creates expense -> Branch 2 Admin cannot see it', async () => {
    const createRes = await request(server)
      .post('/api/v1/admin/fees/expenses')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        title: 'Branch1 Classroom Aircon',
        category: 'MAINTENANCE',
        amount: 400,
        expenseDate: '2026-08-20',
        paymentMethod: 'CASH',
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    // Approve the expense so it is reflected in financial reports
    await request(server)
      .post(`/api/v1/admin/fees/expenses/${createRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        status: ExpenseStatusEnum.APPROVED,
      })
      .expect(201);

    const listRes = await request(server)
      .get('/api/v1/admin/fees/expenses')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const titles = listRes.body.data.map((e: any) => e.title);
    expect(titles).not.toContain('Branch1 Classroom Aircon');
  });

  it('Invoices / Payments: Branch 1 Admin creates invoice -> Branch 2 Admin cannot see it', async () => {
    // 1. Get a student from Branch 1
    const studentRes = await request(server)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    const branch1StudentId = studentRes.body.data[0].id;

    // 2. Create invoice for Branch 1
    const createRes = await request(server)
      .post('/api/v1/admin/fees/invoices')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .send({
        studentId: branch1StudentId,
        billingYear: 2026,
        billingMonth: 9,
        items: [
          { title: 'Branch 1 Unique Special Fee', amount: 350 },
        ],
      })
      .expect(201);

    expect(createRes.body.data.branchId).toBe(1);

    // 3. Branch 2 Admin queries invoices
    const listRes = await request(server)
      .get('/api/v1/admin/fees/invoices')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    const invoiceNumbers = listRes.body.data.map((i: any) => i.paymentNumber);
    expect(invoiceNumbers).not.toContain(createRes.body.data.paymentNumber);
  });

  it('Fee Summary Dashboard: Isolated per branch', async () => {
    const b1Summary = await request(server)
      .get('/api/v1/admin/fees/summary')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    const b2Summary = await request(server)
      .get('/api/v1/admin/fees/summary')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    // Branch 1 has the approved $400 expense
    expect(b1Summary.body.data.totalApprovedExpenses).toBeGreaterThanOrEqual(400);
    // Branch 2 has no approved expenses
    expect(b2Summary.body.data.totalApprovedExpenses).toBe(0);
  });

  it('Reports: Financial Summary is isolated by branch', async () => {
    const b1Report = await request(server)
      .get('/api/v1/admin/reports/financial/summary?preset=THIS_MONTH')
      .set('Authorization', `Bearer ${branch1AdminToken}`)
      .expect(200);

    const b2Report = await request(server)
      .get('/api/v1/admin/reports/financial/summary?preset=THIS_MONTH')
      .set('Authorization', `Bearer ${branch2AdminToken}`)
      .expect(200);

    // Branch 1 has the $400 expense we created & approved above; Branch 2 should have 0
    expect(b1Report.body.data.totalExpenses).toBeGreaterThanOrEqual(400);
    expect(b2Report.body.data.totalExpenses).toBe(0);
  });

  it('Reports: SuperAdmin can see aggregated totals across all branches in overview', async () => {
    const superReport = await request(server)
      .get('/api/v1/admin/reports/financial/summary?preset=THIS_MONTH')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(superReport.body.data.totalExpenses).toBeGreaterThanOrEqual(400);
  });

  it('SuperAdmin can see all records across both branches', async () => {
    const studentsRes = await request(server)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(studentsRes.body.data.some((s: any) => s.branchId === 1)).toBe(true);

    const classesRes = await request(server)
      .get('/api/v1/admin/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(classesRes.body.data.some((c: any) => c.branchId === 1)).toBe(true);
  });
});
