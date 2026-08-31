import type {
  PaymentMethodEnum,
  PayrollAttribute,
  PayrollItemAttribute,
  PayrollItemTypeEnum,
  PayrollStatusEnum,
  StaffSalaryTypeEnum,
} from '@repo/contracts';
import { Payroll } from '../entity/payroll.entity.js';
import { PayrollItem } from '../entity/payroll-item.entity.js';
import { StaffMapper } from './staff.mapper.js';
import { UserMapper } from '@src/user/mapper/user.mapper.js';

export class PayrollMapper {
  static toItemDto(item: PayrollItem): PayrollItemAttribute {
    return {
      id: item.id,
      uuid: item.uuid,
      payrollId: item.payrollId,
      itemType: (item.itemType as PayrollItemTypeEnum) || 'BONUS',
      title: item.title,
      amount: Number(item.amount || 0),
      description: item.description ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static toDto(entity: Payroll): PayrollAttribute {
    const itemsList = entity.items
      ? entity.items.map((i) => this.toItemDto(i))
      : undefined;

    return {
      id: entity.id,
      uuid: entity.uuid,
      payrollNumber: entity.payrollNumber,
      staffId: entity.staffId,
      staff: entity.staff ? StaffMapper.toDto(entity.staff) : undefined,
      year: entity.year,
      month: entity.month,
      startDate: String(entity.startDate),
      endDate: String(entity.endDate),
      workingDays: entity.workingDays,
      holidayDays: entity.holidayDays,
      salaryType: (entity.salaryType as StaffSalaryTypeEnum) || 'MONTHLY',
      baseSalary: Number(entity.baseSalary || 0),
      hourlyRate: Number(entity.hourlyRate || 0),
      totalHoursWorked: Number(entity.totalHoursWorked || 0),
      calculatedBaseAmount: Number(entity.calculatedBaseAmount || 0),
      totalBonus: Number(entity.totalBonus || 0),
      totalDeduction: Number(entity.totalDeduction || 0),
      grossSalary: Number(entity.grossSalary || 0),
      netSalary: Number(entity.netSalary || 0),
      status: (entity.status as PayrollStatusEnum) || 'DRAFT',
      paymentMethod: (entity.paymentMethod as PaymentMethodEnum) ?? null,
      paymentDate: entity.paymentDate ? entity.paymentDate.toISOString() : null,
      paymentReference: entity.paymentReference ?? null,
      notes: entity.notes ?? null,
      branchId: entity.branchId,
      processedBy: entity.processedBy ? Number(entity.processedBy) : null,
      processedByUser: entity.processedByUser
        ? UserMapper.toDto(entity.processedByUser)
        : null,
      items: itemsList,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDtoList(entities: Payroll[]): PayrollAttribute[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
