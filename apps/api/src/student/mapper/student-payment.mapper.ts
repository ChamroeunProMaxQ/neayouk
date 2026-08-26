import type { StudentPaymentAttribute } from '@repo/contracts';
import type { StudentPayment } from '../entity/student-payment.entity.js';

export class StudentPaymentMapper {
  static toDto(entity: StudentPayment): StudentPaymentAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      studentId: entity.studentId,
      classId: entity.classId ?? null,
      billingYear: entity.billingYear,
      billingMonth: entity.billingMonth,
      amountDue: Number(entity.amountDue ?? entity.totalAmount ?? 0),
      amountPaid: Number(entity.amountPaid ?? 0),
      discountApplied: Number(entity.discountApplied ?? entity.discountAmount ?? 0),
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      receiptNumber: entity.receiptNumber ?? entity.paymentNumber ?? null,
      paidAt: entity.paidAt ?? null,
      notes: entity.notes ?? null,
      recordedBy: entity.recordedBy ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDtoList(entities: StudentPayment[]): StudentPaymentAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

