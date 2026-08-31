import type { StudentInvoiceAttribute, InvoiceItemAttribute } from '@repo/contracts';
import type { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import type { PaymentItem } from '@src/student/entity/payment-item.entity.js';

export class InvoiceMapper {
  static toItemDto(item: PaymentItem): InvoiceItemAttribute {
    return {
      id: item.id,
      paymentId: item.paymentId,
      feeStructureId: item.feeStructureId ?? null,
      title: item.title,
      amount: Number(item.amount ?? 0),
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
    };
  }

  static toDto(entity: StudentPayment): StudentInvoiceAttribute {
    const total = Number(entity.totalAmount || entity.amountDue || 0);
    const paid = Number(entity.amountPaid || 0);

    return {
      id: entity.id,
      uuid: entity.uuid,
      branchId: entity.branchId ?? null,
      invoiceNumber: entity.paymentNumber || entity.receiptNumber || `INV-${entity.id}`,
      studentId: entity.studentId,
      classId: entity.classId ?? null,
      billingYear: entity.billingYear,
      billingMonth: entity.billingMonth,
      issueDate: entity.issueDate ? String(entity.issueDate) : String(entity.createdAt).split('T')[0],
      dueDate: entity.dueDate ? String(entity.dueDate) : undefined,
      subtotal: Number(entity.subtotal || total),
      discountAmount: Number(entity.discountAmount || entity.discountApplied || 0),
      totalAmount: total,
      amountPaid: paid,
      status: entity.status,
      notes: entity.notes ?? null,
      items: entity.items ? entity.items.map((i) => this.toItemDto(i)) : undefined,
      studentName: entity.student ? `${entity.student.firstName ?? ''} ${entity.student.lastName ?? ''}`.trim() : undefined,
      studentCode: entity.student?.studentCode ?? undefined,
      className: entity.class?.name ?? undefined,
      createdAt: entity.createdAt ? new Date(entity.createdAt).toISOString() : undefined,
      updatedAt: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : undefined,
    };
  }

  static toDtoList(entities: StudentPayment[]): StudentInvoiceAttribute[] {
    return entities.map((e) => this.toDto(e));
  }
}
