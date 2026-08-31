import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import { SchoolExpense } from './entity/school-expense.entity.js';
import { ExpenseMapper } from './mapper/expense.mapper.js';
import type {
  CreateSchoolExpenseDto,
  UpdateSchoolExpenseDto,
  ApproveSchoolExpenseDto,
  FindSchoolExpensesDto,
} from './dto/fee.dto.js';
import {
  applyBranchScoping,
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(SchoolExpense)
    private readonly repo: Repository<SchoolExpense>,
  ) {}

  async findAll(query: FindSchoolExpensesDto, currentUser?: AuthContext) {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      status,
      startDate,
      endDate,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = query;

    const qb = this.repo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.recordedByUser', 'recordedByUser')
      .leftJoinAndSelect('expense.approvedByUser', 'approvedByUser');

    applyBranchScoping(qb, 'expense', currentUser, (query as any).branchId);

    if (search) {
      qb.andWhere(
        '(expense.title ILIKE :search OR expense.vendor ILIKE :search OR expense.receiptRef ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      qb.andWhere('expense.category = :category', { category });
    }

    if (status) {
      qb.andWhere('expense.status = :status', { status });
    }

    if (startDate) {
      qb.andWhere('expense.expenseDate >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('expense.expenseDate <= :endDate', { endDate });
    }

    qb.orderBy(`expense.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();
    return [ExpenseMapper.toDtoList(items), totalCount];
  }

  async findOne(id: number) {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['recordedByUser', 'approvedByUser'],
    });

    if (!entity) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return ExpenseMapper.toDto(entity);
  }

  async create(dto: CreateSchoolExpenseDto, currentUser?: AuthContext | number) {
    const auth = typeof currentUser === 'object' ? currentUser : undefined;
    const recordedBy = typeof currentUser === 'number' ? currentUser : (currentUser as any)?.sub ?? null;

    const entity = this.repo.create({
      ...dto,
      amount: Number(dto.amount),
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      status: dto.status ?? ExpenseStatusEnum.PENDING,
      paymentMethod: dto.paymentMethod ?? PaymentMethodEnum.CASH,
      recordedBy,
      branchId: resolveBranchId(auth, (dto as any).branchId),
    });

    const saved = await this.repo.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateSchoolExpenseDto) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    const merged = this.repo.merge(entity, {
      ...dto,
      amount: dto.amount !== undefined ? Number(dto.amount) : entity.amount,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : entity.expenseDate,
    });

    await this.repo.save(merged);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    await this.repo.remove(entity);
  }

  async approve(id: number, dto: ApproveSchoolExpenseDto, userId?: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    entity.status = dto.status as ExpenseStatusEnum;
    entity.approvedBy = userId ?? null;
    entity.approvedAt = new Date();
    if (dto.notes) {
      entity.notes = entity.notes ? `${entity.notes}\n[Approval Note]: ${dto.notes}` : `[Approval Note]: ${dto.notes}`;
    }

    await this.repo.save(entity);
    return this.findOne(id);
  }
}
