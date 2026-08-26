import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentStatusEnum,
  PaymentMethodEnum,
  ClassEnrollmentStatusEnum,
  type StudentPaymentSummary,
  type UnpaidMonthItem,
} from '@repo/contracts';
import { StudentPayment } from './entity/student-payment.entity.js';
import { PaymentItem } from './entity/payment-item.entity.js';
import { Student } from './entity/student.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { StudentClass } from './entity/student-class.entity.js';
import { StudentPaymentMapper } from './mapper/student-payment.mapper.js';
import type {
  RecordPaymentDto,
  BatchRecordPaymentDto,
  FindStudentPaymentsDto,
} from './dto/student-payment.dto.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class StudentPaymentService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,

    @InjectRepository(PaymentItem)
    private readonly itemRepo: Repository<PaymentItem>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,
  ) {}

  async findPayments(studentId: number, dto: FindStudentPaymentsDto) {
    const {
      billingYear,
      billingMonth,
      status,
      sortBy = 'billingYear',
      sortOrder = 'DESC',
    } = dto;
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.class', 'class')
      .leftJoinAndSelect('payment.items', 'items')
      .where('payment.studentId = :studentId', { studentId });

    if (billingYear) {
      query.andWhere('payment.billingYear = :billingYear', { billingYear });
    }

    if (billingMonth) {
      query.andWhere('payment.billingMonth = :billingMonth', { billingMonth });
    }

    if (status) {
      query.andWhere('payment.status = :status', { status });
    }

    query.orderBy(`payment.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [StudentPaymentMapper.toDtoList(entities), total];
  }

  async recordPayment(dto: RecordPaymentDto, currentUserId?: number) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: ['enrollments', 'enrollments.class'],
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    let payment = await this.paymentRepo.findOne({
      where: {
        studentId: dto.studentId,
        billingYear: dto.billingYear,
        billingMonth: dto.billingMonth,
      },
    });

    let defaultClassId = dto.classId;
    if (
      !defaultClassId &&
      student.enrollments &&
      student.enrollments.length > 0
    ) {
      const primary = student.enrollments.find(
        (e) =>
          Boolean(e.isPrimary) &&
          e.status === ClassEnrollmentStatusEnum.ENROLLED,
      );
      defaultClassId = primary
        ? primary.classId
        : student.enrollments[0].classId;
    }

    const targetClass = defaultClassId
      ? await this.classRepo.findOne({ where: { id: defaultClassId } })
      : null;

    const baseFee = targetClass ? Number(targetClass.monthlyFee) : 50;
    const discount = Number(dto.discountApplied ?? student.discount ?? 0);
    const amountDue =
      dto.amountDue !== undefined
        ? dto.amountDue
        : Math.max(0, baseFee - discount);
    const amountPaid = dto.amountPaid;
    const status =
      dto.status ??
      (amountPaid >= amountDue
        ? PaymentStatusEnum.PAID
        : amountPaid > 0
          ? PaymentStatusEnum.PARTIAL
          : PaymentStatusEnum.UNPAID);

    const receiptNo =
      dto.receiptNumber ||
      `REC-${dto.billingYear}${String(dto.billingMonth).padStart(2, '0')}-${String(dto.studentId).padStart(4, '0')}`;

    if (!payment) {
      payment = this.paymentRepo.create({
        paymentNumber: receiptNo,
        receiptNumber: receiptNo,
        studentId: dto.studentId,
        classId: defaultClassId,
        billingYear: dto.billingYear,
        billingMonth: dto.billingMonth,
        subtotal: baseFee,
        discountAmount: discount,
        totalAmount: amountDue,
        amountDue,
        amountPaid,
        discountApplied: discount,
        status,
        paymentMethod: dto.paymentMethod ?? PaymentMethodEnum.CASH,
        notes: dto.notes,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        recordedBy: currentUserId,
      });
    } else {
      payment.subtotal = baseFee;
      payment.discountAmount = discount;
      payment.totalAmount = amountDue;
      payment.amountDue = amountDue;
      payment.amountPaid = amountPaid;
      payment.discountApplied = discount;
      payment.status = status;
      if (dto.paymentMethod) payment.paymentMethod = dto.paymentMethod;
      payment.receiptNumber = receiptNo;
      payment.paymentNumber = receiptNo;
      if (dto.notes) payment.notes = dto.notes;
      if (dto.paidAt) payment.paidAt = new Date(dto.paidAt);
      if (currentUserId) payment.recordedBy = currentUserId;
      if (defaultClassId) payment.classId = defaultClassId;

      await this.itemRepo.delete({ paymentId: payment.id });
    }

    const saved = await this.paymentRepo.save(payment);

    const itemTitle = targetClass
      ? `Tuition Fee - ${targetClass.name}`
      : `Tuition Fee (${MONTH_NAMES[dto.billingMonth - 1]} ${dto.billingYear})`;

    const lineItem = this.itemRepo.create({
      paymentId: saved.id,
      feeStructureId: null,
      title: itemTitle,
      amount: baseFee,
    });
    await this.itemRepo.save(lineItem);

    const savedWithRelations = await this.paymentRepo.findOne({
      where: { id: saved.id },
      relations: ['student', 'class', 'items'],
    });

    return StudentPaymentMapper.toDto(savedWithRelations ?? saved);
  }

  async recordBatchPayment(dto: BatchRecordPaymentDto, currentUserId?: number) {
    const results = [];
    for (const item of dto.months) {
      const res = await this.recordPayment(
        {
          studentId: dto.studentId,
          classId: dto.classId,
          billingYear: item.billingYear,
          billingMonth: item.billingMonth,
          amountPaid: item.amountPaid,
          discountApplied: item.discountApplied,
          paymentMethod: dto.paymentMethod,
          receiptNumber: dto.receiptNumber,
          notes: dto.notes,
          paidAt: dto.paidAt,
        },
        currentUserId,
      );
      results.push(res);
    }
    return results;
  }

  async getStudentPaymentSummary(
    studentOrId: number | Student,
  ): Promise<StudentPaymentSummary> {
    let student: Student | null;

    if (typeof studentOrId === 'number') {
      student = await this.studentRepo.findOne({
        where: { id: studentOrId },
        withDeleted: true,
        relations: [
          'enrollments',
          'enrollments.class',
          'payments',
          'payments.items',
          'payments.class',
        ],
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentOrId} not found`);
      }
    } else {
      student = studentOrId;
    }

    const payments = student.payments ?? [];
    const activeEnrollments = student.enrollments
      ? student.enrollments.filter(
          (e) => e.status === ClassEnrollmentStatusEnum.ENROLLED,
        )
      : [];
    const primaryEnrollment =
      activeEnrollments.find((e) => e.isPrimary) || activeEnrollments[0];
    const baseFee = primaryEnrollment?.class
      ? Number(primaryEnrollment.class.monthlyFee)
      : 0;
    const discount = Number(student.discount || 0);
    const monthlyNetDue = Math.max(0, baseFee - discount);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const regDate = student.registeredAt ? new Date(student.registeredAt) : now;
    const startYear = regDate.getFullYear();
    const startMonth = regDate.getMonth() + 1;

    const unpaidMonthsList: UnpaidMonthItem[] = [];
    let totalPaidAmount = 0;
    let lastPaymentDate: Date | null = null;

    for (const p of payments) {
      totalPaidAmount += Number(p.amountPaid || 0);
      if (p.paidAt) {
        const pDate = new Date(p.paidAt);
        if (!lastPaymentDate || pDate > lastPaymentDate) {
          lastPaymentDate = pDate;
        }
      }
    }

    // Map existing payments by "year-month"
    const paymentMap = new Map<string, StudentPayment>();
    for (const p of payments) {
      paymentMap.set(`${p.billingYear}-${p.billingMonth}`, p);
    }

    // Generate active timeline from startYear/startMonth to currentYear/currentMonth
    let iterYear = startYear;
    let iterMonth = startMonth;

    while (
      iterYear < currentYear ||
      (iterYear === currentYear && iterMonth <= currentMonth)
    ) {
      const key = `${iterYear}-${iterMonth}`;
      const existing = paymentMap.get(key);

      if (!existing || existing.status !== PaymentStatusEnum.PAID) {
        const due = existing
          ? Math.max(
              0,
              Number(existing.amountDue) - Number(existing.amountPaid),
            )
          : monthlyNetDue;
        if (due > 0) {
          unpaidMonthsList.push({
            year: iterYear,
            month: iterMonth,
            monthName: `${MONTH_NAMES[iterMonth - 1]} ${iterYear}`,
            amountDue: due,
            status: existing ? existing.status : PaymentStatusEnum.UNPAID,
          });
        }
      }

      iterMonth++;
      if (iterMonth > 12) {
        iterMonth = 1;
        iterYear++;
      }
    }

    const totalOutstandingAmount = unpaidMonthsList.reduce(
      (sum, item) => sum + item.amountDue,
      0,
    );

    return {
      studentId: student.id,
      totalPaidAmount,
      totalUnpaidMonths: unpaidMonthsList.length,
      unpaidMonthsList,
      totalOutstandingAmount,
      lastPaymentDate,
      payments: StudentPaymentMapper.toDtoList(payments),
    };
  }
}
