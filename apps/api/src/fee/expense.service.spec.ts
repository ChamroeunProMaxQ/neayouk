import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ExpenseCategoryEnum, ExpenseStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import { ExpenseService } from './expense.service.js';

describe('ExpenseService (Unit)', () => {
  let service: ExpenseService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 1, uuid: 'exp-uuid-1' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id ?? 1 })),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
      remove: vi.fn(async () => true),
    };

    service = new ExpenseService(mockRepo);
  });

  it('should find all expenses with pagination', async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            uuid: 'exp-uuid-1',
            title: 'Internet Bill',
            category: ExpenseCategoryEnum.UTILITIES,
            amount: 100,
            status: ExpenseStatusEnum.PENDING,
            expenseDate: new Date(),
          },
        ],
        1,
      ]),
    };
    mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const res = await service.findAll({ page: 1, pageSize: 10 });
    expect(res[0].length).toBe(1);
    expect(res[0][0].title).toBe('Internet Bill');
  });

  it('should create an expense with PENDING status default', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: 1,
      title: 'AC Maintenance',
      category: ExpenseCategoryEnum.MAINTENANCE,
      amount: 200,
      status: ExpenseStatusEnum.PENDING,
      expenseDate: '2026-08-15',
    });

    const dto = {
      title: 'AC Maintenance',
      category: ExpenseCategoryEnum.MAINTENANCE,
      amount: 200,
    };

    const res = await service.create(dto, 5);
    expect(res.title).toBe('AC Maintenance');
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'AC Maintenance',
        status: ExpenseStatusEnum.PENDING,
      }),
    );
  });

  it('should perform 2-step approval on an expense', async () => {
    mockRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        title: 'AC Maintenance',
        status: ExpenseStatusEnum.PENDING,
      })
      .mockResolvedValueOnce({
        id: 1,
        title: 'AC Maintenance',
        status: ExpenseStatusEnum.APPROVED,
        approvedBy: 2,
        approvedAt: new Date(),
      });

    const approveDto = {
      status: ExpenseStatusEnum.APPROVED,
      notes: 'Approved by Principal',
    };

    const res = await service.approve(1, approveDto, 2);
    expect(res.status).toBe(ExpenseStatusEnum.APPROVED);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
