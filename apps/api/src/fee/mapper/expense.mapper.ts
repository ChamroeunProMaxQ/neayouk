import type { SchoolExpenseAttribute } from '@repo/contracts';
import type { SchoolExpense } from '../entity/school-expense.entity.js';

export class ExpenseMapper {
  static toDto(entity: SchoolExpense): SchoolExpenseAttribute {
    return {
      id: entity.id,
      uuid: entity.uuid,
      title: entity.title,
      category: entity.category,
      amount: Number(entity.amount ?? 0),
      expenseDate: entity.expenseDate ? new Date(entity.expenseDate).toISOString().split('T')[0] : '',
      vendor: entity.vendor ?? null,
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      receiptRef: entity.receiptRef ?? null,
      notes: entity.notes ?? null,
      recordedBy: entity.recordedBy ?? null,
      approvedBy: entity.approvedBy ?? null,
      approvedAt: entity.approvedAt ? new Date(entity.approvedAt).toISOString() : null,
      recordedByName: entity.recordedByUser ? `${entity.recordedByUser.firstName ?? ''} ${entity.recordedByUser.lastName ?? ''}`.trim() : undefined,
      approvedByName: entity.approvedByUser ? `${entity.approvedByUser.firstName ?? ''} ${entity.approvedByUser.lastName ?? ''}`.trim() : undefined,
      branchId: entity.branchId,
      createdAt: entity.createdAt ? new Date(entity.createdAt).toISOString() : undefined,
      updatedAt: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : undefined,
    };
  }

  static toDtoList(entities: SchoolExpense[]): SchoolExpenseAttribute[] {
    return entities.map((e) => this.toDto(e));
  }
}
