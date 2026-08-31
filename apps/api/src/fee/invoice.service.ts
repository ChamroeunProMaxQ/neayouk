import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaymentStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import { PaymentItem } from '@src/student/entity/payment-item.entity.js';
import { FeeStructure } from './entity/fee-structure.entity.js';
import { PaymentRefund } from './entity/payment-refund.entity.js';
import { PaymentReminder } from './entity/payment-reminder.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { InvoiceMapper } from './mapper/invoice.mapper.js';
import {
  applyBranchScoping,
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';
import type {
  CreateInvoiceDto,
  GenerateBatchInvoicesDto,
  RecordInvoicePaymentDto,
  RefundPaymentDto,
  PaymentReminderDto,
  FindInvoicesDto,
} from './dto/fee.dto.js';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(StudentPayment)
    private readonly paymentRepo: Repository<StudentPayment>,
    @InjectRepository(PaymentItem)
    private readonly itemRepo: Repository<PaymentItem>,
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepo: Repository<FeeStructure>,
    @InjectRepository(PaymentRefund)
    private readonly refundRepo: Repository<PaymentRefund>,
    @InjectRepository(PaymentReminder)
    private readonly reminderRepo: Repository<PaymentReminder>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async findAll(query: FindInvoicesDto, currentUser?: AuthContext) {
    const {
      page = 1,
      pageSize = 20,
      search,
      studentId,
      classId,
      billingYear,
      billingMonth,
      status,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = query;

    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 'student')
      .leftJoinAndSelect('p.class', 'class')
      .leftJoinAndSelect('p.items', 'items');

    applyBranchScoping(qb, 'p', currentUser, (query as any).branchId);

    if (search) {
      qb.andWhere(
        '(p.paymentNumber ILIKE :search OR p.receiptNumber ILIKE :search OR student.firstName ILIKE :search OR student.lastName ILIKE :search OR student.studentCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (studentId) {
      qb.andWhere('p.studentId = :studentId', { studentId });
    }

    if (classId) {
      qb.andWhere('p.classId = :classId', { classId });
    }

    if (billingYear) {
      qb.andWhere('p.billingYear = :billingYear', { billingYear });
    }

    if (billingMonth) {
      qb.andWhere('p.billingMonth = :billingMonth', { billingMonth });
    }

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    qb.orderBy(`p.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();
    return [InvoiceMapper.toDtoList(items), totalCount];
  }

  async findOne(id: number) {
    const entity = await this.paymentRepo.findOne({
      where: { id },
      relations: ['student', 'class', 'items'],
    });

    if (!entity) {
      throw new NotFoundException(`Invoice/Payment with ID ${id} not found`);
    }

    return InvoiceMapper.toDto(entity);
  }

  async create(dto: CreateInvoiceDto, currentUser?: AuthContext) {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    const subtotal = dto.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const discountAmount = Number(dto.discountAmount ?? 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const paymentNumber = await this.generateInvoiceNumber(dto.billingYear, dto.billingMonth);

    const payment = this.paymentRepo.create({
      paymentNumber,
      receiptNumber: paymentNumber,
      branchId: student.branchId ?? resolveBranchId(currentUser, (dto as any).branchId),
      studentId: dto.studentId,
      classId: dto.classId ?? null,
      billingYear: dto.billingYear,
      billingMonth: dto.billingMonth,
      subtotal,
      discountAmount,
      discountApplied: discountAmount,
      totalAmount,
      amountDue: totalAmount,
      amountPaid: 0,
      status: PaymentStatusEnum.UNPAID,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      notes: dto.notes ?? null,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    const items = dto.items.map((item) =>
      this.itemRepo.create({
        paymentId: savedPayment.id,
        feeStructureId: item.feeStructureId ?? null,
        title: item.title,
        amount: Number(item.amount),
      }),
    );

    await this.itemRepo.save(items);

    return this.findOne(savedPayment.id);
  }

  async generateBatch(dto: GenerateBatchInvoicesDto, currentUser?: AuthContext) {
    let students: Student[] = [];

    if (dto.studentIds && dto.studentIds.length > 0) {
      students = await this.studentRepo.findBy({ id: In(dto.studentIds) });
    } else if (dto.classId) {
      const classEntities = await this.studentRepo
        .createQueryBuilder('student')
        .innerJoin('student.enrollments', 'enrollment')
        .where('enrollment.classId = :classId', { classId: dto.classId })
        .getMany();
      students = classEntities;
    }

    if (students.length === 0) {
      throw new NotFoundException('No matching students found for batch payment generation');
    }

    let feeStructures: FeeStructure[] = [];
    if (dto.feeStructureIds && dto.feeStructureIds.length > 0) {
      feeStructures = await this.feeStructureRepo.findBy({ id: In(dto.feeStructureIds) });
    }

    const createdPaymentIds: number[] = [];

    for (const student of students) {
      const itemsToInsert: { feeStructureId?: number | null; title: string; amount: number }[] = [];

      feeStructures.forEach((fee) => {
        itemsToInsert.push({
          feeStructureId: fee.id,
          title: fee.name,
          amount: Number(fee.amount),
        });
      });

      if (dto.customItems) {
        dto.customItems.forEach((cItem) => {
          itemsToInsert.push({
            feeStructureId: cItem.feeStructureId ?? null,
            title: cItem.title,
            amount: Number(cItem.amount),
          });
        });
      }

      if (itemsToInsert.length === 0) {
        throw new BadRequestException('At least one fee structure or custom line item must be selected');
      }

      const subtotal = itemsToInsert.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = Number(dto.discountAmount ?? 0);
      const totalAmount = Math.max(0, subtotal - discountAmount);
      const paymentNumber = await this.generateInvoiceNumber(dto.billingYear, dto.billingMonth);

      const payment = this.paymentRepo.create({
        paymentNumber,
        receiptNumber: paymentNumber,
        branchId: student.branchId ?? resolveBranchId(currentUser, (dto as any).branchId),
        studentId: student.id,
        classId: dto.classId ?? null,
        billingYear: dto.billingYear,
        billingMonth: dto.billingMonth,
        subtotal,
        discountAmount,
        discountApplied: discountAmount,
        totalAmount,
        amountDue: totalAmount,
        amountPaid: 0,
        status: PaymentStatusEnum.UNPAID,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes ?? null,
      });

      const savedPayment = await this.paymentRepo.save(payment);

      const items = itemsToInsert.map((item) =>
        this.itemRepo.create({
          paymentId: savedPayment.id,
          feeStructureId: item.feeStructureId ?? null,
          title: item.title,
          amount: item.amount,
        }),
      );

      await this.itemRepo.save(items);
      createdPaymentIds.push(savedPayment.id);
    }

    return {
      message: `Successfully generated ${createdPaymentIds.length} payments`,
      invoiceIds: createdPaymentIds,
    };
  }

  async recordPayment(dto: RecordInvoicePaymentDto, userId?: number) {
    const targetId = dto.invoiceId;
    if (!targetId) {
      throw new BadRequestException('Payment ID is required');
    }

    const payment = await this.paymentRepo.findOne({ where: { id: targetId } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${targetId} not found`);
    }

    const newAmountPaid = Number(payment.amountPaid ?? 0) + Number(dto.amountPaid);
    const receiptNumber =
      dto.receiptNumber || (await this.generateReceiptNumber(payment.billingYear, payment.billingMonth));

    payment.amountPaid = newAmountPaid;
    const targetTotal = Number(payment.totalAmount || payment.amountDue || 0);

    if (newAmountPaid >= targetTotal) {
      payment.status = PaymentStatusEnum.PAID;
    } else if (newAmountPaid > 0) {
      payment.status = PaymentStatusEnum.PARTIAL;
    }

    payment.receiptNumber = receiptNumber;
    payment.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    payment.paymentMethod = dto.paymentMethod ?? PaymentMethodEnum.CASH;
    if (userId) payment.recordedBy = userId;
    if (dto.notes) payment.notes = dto.notes;

    await this.paymentRepo.save(payment);

    return {
      invoice: await this.findOne(payment.id),
      receiptNumber,
      amountPaid: dto.amountPaid,
    };
  }

  async refund(dto: RefundPaymentDto, userId?: number) {
    const targetId = dto.invoiceId;
    if (!targetId) {
      throw new BadRequestException('Payment ID is required');
    }

    const payment = await this.paymentRepo.findOne({ where: { id: targetId } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${targetId} not found`);
    }

    if (Number(dto.amount) > Number(payment.amountPaid)) {
      throw new BadRequestException('Refund amount cannot exceed amount paid');
    }

    const refund = this.refundRepo.create({
      invoiceId: payment.id,
      amount: Number(dto.amount),
      reason: dto.reason,
      paymentMethod: dto.paymentMethod ?? PaymentMethodEnum.CASH,
      processedBy: userId ?? null,
      refundedAt: new Date(),
    });

    await this.refundRepo.save(refund);

    payment.amountPaid = Math.max(0, Number(payment.amountPaid) - Number(dto.amount));
    const targetTotal = Number(payment.totalAmount || payment.amountDue || 0);

    if (payment.amountPaid < targetTotal) {
      payment.status = payment.amountPaid > 0 ? PaymentStatusEnum.PARTIAL : PaymentStatusEnum.UNPAID;
    }

    await this.paymentRepo.save(payment);

    return {
      message: 'Refund processed successfully',
      refundId: refund.id,
      invoice: await this.findOne(payment.id),
    };
  }

  async sendReminder(dto: PaymentReminderDto, userId?: number) {
    const targetId = dto.invoiceId;
    if (!targetId) {
      throw new BadRequestException('Payment ID is required');
    }

    const payment = await this.paymentRepo.findOne({ where: { id: targetId } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${targetId} not found`);
    }

    const reminder = this.reminderRepo.create({
      invoiceId: payment.id,
      studentId: payment.studentId,
      channel: dto.channel ?? 'IN_APP',
      sentBy: userId ?? null,
      reminderDate: new Date(),
      notes: dto.notes ?? null,
    });

    await this.reminderRepo.save(reminder);

    return {
      message: 'Payment reminder sent successfully',
      reminderId: reminder.id,
    };
  }

  private async generateInvoiceNumber(year: number, month: number): Promise<string> {
    const monthStr = String(month).padStart(2, '0');
    const count = await this.paymentRepo.count({
      where: { billingYear: year, billingMonth: month },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${year}${monthStr}-${seq}`;
  }

  private async generateReceiptNumber(year: number, month: number): Promise<string> {
    const monthStr = String(month).padStart(2, '0');
    const count = await this.paymentRepo.count({
      where: { billingYear: year, billingMonth: month },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `REC-${year}${monthStr}-${seq}`;
  }
}
