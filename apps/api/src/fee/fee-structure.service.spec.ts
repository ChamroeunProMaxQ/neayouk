import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { FeeCategoryEnum, BillingCycleEnum } from '@repo/contracts';
import { FeeStructureService } from './fee-structure.service.js';

describe('FeeStructureService (Unit)', () => {
  let service: FeeStructureService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ ...dto, id: 1, uuid: 'fee-uuid-123' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id ?? 1 })),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
      remove: vi.fn(async () => true),
    };

    service = new FeeStructureService(mockRepo);
  });

  it('should find all fee structures with pagination', async () => {
    const mockQueryBuilder = {
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            uuid: 'uuid-1',
            name: 'Grade 10 Tuition',
            category: FeeCategoryEnum.TUITION,
            amount: 150,
            billingCycle: BillingCycleEnum.MONTHLY,
            isActive: true,
            createdAt: new Date(),
          },
        ],
        1,
      ]),
    };
    mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await service.findAll({ page: 1, pageSize: 10 });
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe('Grade 10 Tuition');
    expect(result[1]).toBe(1);
  });

  it('should create a new fee structure', async () => {
    const dto = {
      name: 'School Uniform - M',
      category: FeeCategoryEnum.OTHER,
      amount: 15,
      billingCycle: BillingCycleEnum.ONE_TIME,
    };

    const result = await service.create(dto);
    expect(result.name).toBe('School Uniform - M');
    expect(result.amount).toBe(15);
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should update an existing fee structure', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: 1,
      uuid: 'uuid-1',
      name: 'Old Name',
      category: FeeCategoryEnum.TUITION,
      amount: 100,
      billingCycle: BillingCycleEnum.MONTHLY,
    });

    const result = await service.update(1, { name: 'Updated Tuition', amount: 120 });
    expect(result.name).toBe('Updated Tuition');
    expect(result.amount).toBe(120);
  });

  it('should throw NotFoundException when updating non-existent fee structure', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.update(999, { name: 'Test' })).rejects.toThrow(NotFoundException);
  });

  it('should remove a fee structure', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1, name: 'Fee to Delete' });
    await service.remove(1);
    expect(mockRepo.remove).toHaveBeenCalled();
  });
});
