import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  type LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ExpenseCategoryEnum,
  ExpenseStatusEnum,
  PaymentMethodEnum,
  PayrollItemTypeEnum,
} from '@repo/contracts';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { calculateWorkingDaysInMonth } from '@src/common/helper/holiday.helper.js';
import { Payroll } from './entity/payroll.entity.js';
import { PayrollItem } from './entity/payroll-item.entity.js';
import { Staff } from './entity/staff.entity.js';
import { TeacherAttendance } from '@src/attendance/entity/teacher-attendance.entity.js';
import { SchoolExpense } from '@src/fee/entity/school-expense.entity.js';
import { PayrollMapper } from './mapper/payroll.mapper.js';
import type {
  CreatePayrollDto,
  FindPayrollsDto,
  ProcessPayrollPaymentDto,
  UpdatePayrollDto,
} from './dto/payroll.dto.js';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrollRepo: Repository<Payroll>,

    @InjectRepository(PayrollItem)
    private readonly payrollItemRepo: Repository<PayrollItem>,

    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,

    @InjectRepository(TeacherAttendance)
    private readonly teacherAttendanceRepo: Repository<TeacherAttendance>,

    @InjectRepository(SchoolExpense)
    private readonly schoolExpenseRepo: Repository<SchoolExpense>,

    private readonly dataSource: DataSource,

    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async findAll({
    search,
    staffId,
    department,
    year,
    month,
    salaryType,
    status,
    sortBy = 'id',
    sortOrder = 'DESC',
    ...dto
  }: FindPayrollsDto) {
    const query = this.payrollRepo
      .createQueryBuilder('payroll')
      .leftJoinAndSelect('payroll.staff', 'staff')
      .leftJoinAndSelect('payroll.items', 'items')
      .leftJoinAndSelect('payroll.processedByUser', 'processedByUser');

    if (staffId) {
      query.andWhere('payroll.staff_id = :staffId', { staffId });
    }

    if (department) {
      query.andWhere('staff.department = :department', { department });
    }

    if (year) {
      query.andWhere('payroll.year = :year', { year });
    }

    if (month) {
      query.andWhere('payroll.month = :month', { month });
    }

    if (salaryType) {
      query.andWhere('payroll.salary_type = :salaryType', { salaryType });
    }

    if (status) {
      query.andWhere('payroll.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(payroll.payroll_number LIKE :search OR staff.name LIKE :search OR staff.name_km LIKE :search OR staff.staff_code LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const sortColumnMap: Record<string, string> = {
      id: 'payroll.id',
      payrollNumber: 'payroll.payroll_number',
      year: 'payroll.year',
      month: 'payroll.month',
      salaryType: 'payroll.salary_type',
      calculatedBaseAmount: 'payroll.calculated_base_amount',
      grossSalary: 'payroll.gross_salary',
      netSalary: 'payroll.net_salary',
      status: 'payroll.status',
      paymentDate: 'payroll.payment_date',
      createdAt: 'payroll.created_at',
    };

    const orderCol = sortColumnMap[sortBy] || 'payroll.id';
    query.orderBy(orderCol, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [PayrollMapper.toDtoList(entities), total] as const;
  }

  async findOne(id: number) {
    const payroll = await this.payrollRepo.findOne({
      where: { id },
      relations: ['staff', 'items', 'processedByUser'],
    });

    if (!payroll) {
      throw new NotFoundException('payroll not found');
    }

    return PayrollMapper.toDto(payroll);
  }

  async create(dto: CreatePayrollDto, userId?: number) {
    const staff = await this.staffRepo.findOne({
      where: { id: dto.staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // Check duplicate
    const existing = await this.payrollRepo.findOne({
      where: {
        staffId: dto.staffId,
        year: dto.year,
        month: dto.month,
      },
    });

    if (existing && existing.status !== 'CANCELLED') {
      throw new ConflictException(
        `Payroll record for this staff for ${dto.year}-${String(dto.month).padStart(2, '0')} already exists`,
      );
    }

    const { netWorkingDays, holidaysCount } = calculateWorkingDaysInMonth(
      dto.year,
      dto.month,
    );

    const totalDaysInMonth = new Date(dto.year, dto.month, 0).getDate();
    const startDate =
      dto.startDate ||
      `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const endDate =
      dto.endDate ||
      `${dto.year}-${String(dto.month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

    const salaryType = dto.salaryType || staff.salaryType || 'MONTHLY';
    const baseSalary =
      dto.baseSalary !== undefined
        ? dto.baseSalary
        : Number(staff.baseSalary || 0);
    const hourlyRate =
      dto.hourlyRate !== undefined
        ? dto.hourlyRate
        : Number(staff.hourlyRate || 0);

    let totalHoursWorked = dto.totalHoursWorked;

    if (totalHoursWorked === undefined) {
      if (salaryType === 'HOURLY') {
        // Query attendance records in date range
        const attendances = await this.teacherAttendanceRepo
          .createQueryBuilder('att')
          .where('att.teacher_id = :staffId', { staffId: staff.id })
          .andWhere('att.date BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          })
          .getMany();

        totalHoursWorked = attendances.reduce(
          (sum, a) => sum + Number(a.hoursWorked || 0),
          0,
        );
      } else {
        totalHoursWorked = 0;
      }
    }

    const calculatedBaseAmount =
      salaryType === 'HOURLY' ? totalHoursWorked * hourlyRate : baseSalary;

    let totalBonus = 0;
    let totalDeduction = 0;

    const itemsToCreate: Partial<PayrollItem>[] = [];

    if (dto.items && dto.items.length > 0) {
      for (const itemDto of dto.items) {
        const itemType = itemDto.itemType || 'BONUS';
        const amount = Number(itemDto.amount || 0);

        if (
          itemType === PayrollItemTypeEnum.BONUS ||
          itemType === PayrollItemTypeEnum.ALLOWANCE ||
          itemType === PayrollItemTypeEnum.OVERTIME
        ) {
          totalBonus += amount;
        } else {
          totalDeduction += amount;
        }

        itemsToCreate.push({
          itemType,
          title: itemDto.title,
          amount,
          description: itemDto.description || null,
        });
      }
    }

    const grossSalary = calculatedBaseAmount + totalBonus;
    const netSalary = Math.max(0, grossSalary - totalDeduction);

    const count = await this.payrollRepo.count();
    const payrollNumber = `PAY-${dto.year}${String(dto.month).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payroll = this.payrollRepo.create({
        payrollNumber,
        staffId: staff.id,
        year: dto.year,
        month: dto.month,
        startDate,
        endDate,
        workingDays: netWorkingDays,
        holidayDays: holidaysCount,
        salaryType,
        baseSalary,
        hourlyRate,
        totalHoursWorked,
        calculatedBaseAmount,
        totalBonus,
        totalDeduction,
        grossSalary,
        netSalary,
        status: 'DRAFT',
        notes: dto.notes ?? null,
        processedBy: userId ?? null,
      });

      const savedPayroll = await queryRunner.manager.save(payroll);

      if (itemsToCreate.length > 0) {
        const items = itemsToCreate.map((item) =>
          this.payrollItemRepo.create({
            ...item,
            payrollId: savedPayroll.id,
          }),
        );
        await queryRunner.manager.save(items);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedPayroll.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdatePayrollDto, _userId?: number) {
    const payroll = await this.payrollRepo.findOne({
      where: { id },
      relations: ['items', 'staff'],
    });

    if (!payroll) {
      throw new NotFoundException('payroll not found');
    }

    if (payroll.status === 'PAID') {
      throw new ConflictException(
        'Cannot edit a paid payroll record. To make changes, delete and re-issue or cancel.',
      );
    }

    if (dto.baseSalary !== undefined) {
      payroll.baseSalary = dto.baseSalary;
    }
    if (dto.hourlyRate !== undefined) {
      payroll.hourlyRate = dto.hourlyRate;
    }
    if (dto.totalHoursWorked !== undefined) {
      payroll.totalHoursWorked = dto.totalHoursWorked;
    }
    if (dto.notes !== undefined) {
      payroll.notes = dto.notes;
    }

    payroll.calculatedBaseAmount =
      payroll.salaryType === 'HOURLY'
        ? Number(payroll.totalHoursWorked) * Number(payroll.hourlyRate)
        : Number(payroll.baseSalary);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.items !== undefined) {
        // Remove existing items and replace
        await queryRunner.manager.delete(PayrollItem, { payrollId: id });

        let totalBonus = 0;
        let totalDeduction = 0;

        const newItems = dto.items.map((itemDto) => {
          const itemType = itemDto.itemType || 'BONUS';
          const amount = Number(itemDto.amount || 0);

          if (
            itemType === PayrollItemTypeEnum.BONUS ||
            itemType === PayrollItemTypeEnum.ALLOWANCE ||
            itemType === PayrollItemTypeEnum.OVERTIME
          ) {
            totalBonus += amount;
          } else {
            totalDeduction += amount;
          }

          return this.payrollItemRepo.create({
            payrollId: id,
            itemType,
            title: itemDto.title,
            amount,
            description: itemDto.description || null,
          });
        });

        payroll.totalBonus = totalBonus;
        payroll.totalDeduction = totalDeduction;
        payroll.items = newItems;

        if (newItems.length > 0) {
          await queryRunner.manager.save(newItems);
        }
      }

      payroll.grossSalary =
        Number(payroll.calculatedBaseAmount) + Number(payroll.totalBonus);
      payroll.netSalary = Math.max(
        0,
        Number(payroll.grossSalary) - Number(payroll.totalDeduction),
      );

      await queryRunner.manager.save(payroll);
      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async processPayment(
    id: number,
    dto: ProcessPayrollPaymentDto,
    userId?: number,
  ) {
    const payroll = await this.payrollRepo.findOne({
      where: { id },
      relations: ['staff', 'items'],
    });

    if (!payroll) {
      throw new NotFoundException('payroll not found');
    }

    if (payroll.status === 'PAID') {
      throw new ConflictException('Payroll is already marked as PAID');
    }

    const paymentDate = dto.paymentDate
      ? new Date(dto.paymentDate)
      : new Date();
    const paymentMethod = dto.paymentMethod || PaymentMethodEnum.BANK_TRANSFER;

    payroll.status = 'PAID';
    payroll.paymentMethod = paymentMethod;
    payroll.paymentDate = paymentDate;
    payroll.paymentReference = dto.paymentReference || null;
    if (dto.notes) {
      payroll.notes = dto.notes;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(payroll);

      // Always create operational expense in school_expenses
      const staffName = payroll.staff?.name || 'Staff Member';
      const expense = this.schoolExpenseRepo.create({
        title: `Staff Salary: ${staffName} (${payroll.month}/${payroll.year})`,
        category: ExpenseCategoryEnum.SALARY,
        amount: Number(payroll.netSalary),
        expenseDate: paymentDate,
        vendor: staffName,
        paymentMethod: paymentMethod as PaymentMethodEnum,
        status: ExpenseStatusEnum.APPROVED,
        receiptRef: payroll.payrollNumber,
        notes: `Disbursed payroll voucher ${payroll.payrollNumber}`,
        recordedBy: userId ?? null,
        approvedBy: userId ?? null,
        approvedAt: paymentDate,
      });

      await queryRunner.manager.save(expense);
      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const payroll = await this.payrollRepo.findOne({ where: { id } });
    if (!payroll) {
      throw new NotFoundException('payroll not found');
    }

    if (payroll.status === 'PAID') {
      throw new ConflictException(
        'Cannot delete a paid payroll record. To void, update status to CANCELLED.',
      );
    }

    await this.payrollRepo.delete(id);
    return PayrollMapper.toDto(payroll);
  }

  async getSummary(year?: number, month?: number) {
    const query = this.payrollRepo
      .createQueryBuilder('payroll')
      .where('payroll.status != :cancelled', { cancelled: 'CANCELLED' });

    if (year) {
      query.andWhere('payroll.year = :year', { year });
    }
    if (month) {
      query.andWhere('payroll.month = :month', { month });
    }

    const payrolls = await query.getMany();

    const totalPayrollSpend = payrolls.reduce(
      (sum, p) => sum + Number(p.netSalary || 0),
      0,
    );
    const totalPaid = payrolls
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
    const totalDraft = payrolls
      .filter((p) => p.status === 'DRAFT')
      .reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
    const paidCount = payrolls.filter((p) => p.status === 'PAID').length;
    const draftCount = payrolls.filter((p) => p.status === 'DRAFT').length;

    const monthlySpend = payrolls
      .filter((p) => p.salaryType === 'MONTHLY')
      .reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
    const hourlySpend = payrolls
      .filter((p) => p.salaryType === 'HOURLY')
      .reduce((sum, p) => sum + Number(p.netSalary || 0), 0);

    const totalStaffCount = await this.staffRepo.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalPayrollSpend,
      totalPaid,
      totalDraft,
      paidCount,
      draftCount,
      totalStaffCount,
      monthlySpend,
      hourlySpend,
    };
  }
}
