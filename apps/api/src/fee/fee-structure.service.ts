import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FeeStructureAttribute } from '@repo/contracts';
import { FeeStructure } from './entity/fee-structure.entity.js';
import { FeeStructureMapper } from './mapper/fee-structure.mapper.js';
import type { CreateFeeStructureDto, UpdateFeeStructureDto, FindFeeStructuresDto } from './dto/fee.dto.js';

import {
  applyBranchScoping,
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class FeeStructureService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly repo: Repository<FeeStructure>,
  ) {}

  async findAll(query: FindFeeStructuresDto, currentUser?: AuthContext) {
    const {
      page = 1,
      pageSize = 20,
      search,
      category,
      billingCycle,
      isActive,
      programId,
      branchId,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = query;

    const qb = this.repo.createQueryBuilder('fee');

    applyBranchScoping(qb, 'fee', currentUser, branchId);

    if (search) {
      qb.andWhere('fee.name ILIKE :search OR fee.description ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (category) {
      qb.andWhere('fee.category = :category', { category });
    }

    if (billingCycle) {
      qb.andWhere('fee.billingCycle = :billingCycle', { billingCycle });
    }

    if (isActive !== undefined) {
      qb.andWhere('fee.isActive = :isActive', { isActive });
    }

    if (programId) {
      qb.andWhere('fee.programId = :programId', { programId });
    }

    qb.orderBy(`fee.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();
    return [FeeStructureMapper.toDtoList(items), totalCount];
  }

  async findOne(id: number): Promise<FeeStructureAttribute> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }
    return FeeStructureMapper.toDto(entity);
  }

  async create(
    dto: CreateFeeStructureDto,
    currentUser?: AuthContext,
  ): Promise<FeeStructureAttribute> {
    const entity = this.repo.create({
      ...dto,
      isOptional: dto.isOptional ?? false,
      isActive: dto.isActive ?? true,
      branchId: resolveBranchId(currentUser, dto.branchId),
    });
    const saved = await this.repo.save(entity);
    return FeeStructureMapper.toDto(saved);
  }

  async update(id: number, dto: UpdateFeeStructureDto): Promise<FeeStructureAttribute> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }
    const merged = this.repo.merge(entity, dto);
    const updated = await this.repo.save(merged);
    return FeeStructureMapper.toDto(updated);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }
    await this.repo.remove(entity);
  }
}
