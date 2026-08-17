import type { StudentPaymentAttribute } from '@repo/contracts';
import { StudentPayment } from '../entity/student-payment.entity.js';

export class StudentPaymentMapper {
  static toDto(entity: StudentPayment): StudentPaymentAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      studentId: entity.studentId,
      classId: entity.classId,
      billingYear: entity.billingYear,
      billingMonth: entity.billingMonth,
      amountDue: Number(entity.amountDue || 0),
      amountPaid: Number(entity.amountPaid || 0),
      discountApplied: Number(entity.discountApplied || 0),
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      receiptNumber: entity.receiptNumber,
      paidAt: entity.paidAt,
      notes: entity.notes,
      recordedBy: entity.recordedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDtoList(entities: StudentPayment[]): StudentPaymentAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
