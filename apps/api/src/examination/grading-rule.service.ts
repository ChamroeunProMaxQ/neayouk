import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import type {
  GradingRuleAttribute,
  CreateGradingRuleDto,
  UpdateGradingRuleDto,
  FindGradingRulesDto,
} from '@repo/contracts';
import { GradingRule } from './entity/grading-rule.entity.js';
import { GradingRuleMapper } from './mapper/grading-rule.mapper.js';

@Injectable()
export class GradingRuleService {
  constructor(
    @InjectRepository(GradingRule)
    private readonly gradingRuleRepo: Repository<GradingRule>,
  ) {}

  private validateComponentWeights(components: { weight: number }[]) {
    const totalWeight = components.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException('Component weights must sum to exactly 100%');
    }
  }

  async create(dto: CreateGradingRuleDto): Promise<GradingRuleAttribute> {
    this.validateComponentWeights(dto.components);

    const existing = await this.gradingRuleRepo.findOne({
      where: { code: dto.code, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(`Grading rule with code '${dto.code}' already exists`);
    }

    if (dto.isDefault) {
      await this.gradingRuleRepo.update(
        { isDefault: true, deletedAt: IsNull() },
        { isDefault: false },
      );
    }

    const entity = this.gradingRuleRepo.create({
      name: dto.name,
      code: dto.code,
      academicYear: dto.academicYear ?? null,
      semester: dto.semester ?? null,
      components: dto.components,
      gradeScale: dto.gradeScale,
      isDefault: dto.isDefault ?? true,
      status: dto.status ?? 'ACTIVE',
    });

    const saved = await this.gradingRuleRepo.save(entity);
    return GradingRuleMapper.toDto(saved);
  }

  async update(id: number, dto: UpdateGradingRuleDto): Promise<GradingRuleAttribute> {
    const entity = await this.gradingRuleRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!entity) {
      throw new NotFoundException(`Grading rule with ID ${id} not found`);
    }

    if (dto.code && dto.code !== entity.code) {
      const existing = await this.gradingRuleRepo.findOne({
        where: { code: dto.code, deletedAt: IsNull() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Grading rule with code '${dto.code}' already exists`);
      }
    }

    if (dto.components) {
      this.validateComponentWeights(dto.components);
    }

    if (dto.isDefault) {
      await this.gradingRuleRepo.update(
        { isDefault: true, deletedAt: IsNull() },
        { isDefault: false },
      );
    }

    this.gradingRuleRepo.merge(entity, dto);
    const saved = await this.gradingRuleRepo.save(entity);
    return GradingRuleMapper.toDto(saved);
  }

  async findAll(filter: FindGradingRulesDto) {
    const page = Number(filter.page) || 1;
    const pageSize = Number(filter.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const qb = this.gradingRuleRepo
      .createQueryBuilder('gr')
      .where('gr.deletedAt IS NULL');

    if (filter.search) {
      qb.andWhere('(gr.name ILIKE :search OR gr.code ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.status) {
      qb.andWhere('gr.status = :status', { status: filter.status });
    }

    if (filter.academicYear) {
      qb.andWhere('gr.academicYear = :academicYear', {
        academicYear: filter.academicYear,
      });
    }

    const sortField = filter.sortBy ? `gr.${filter.sortBy}` : 'gr.createdAt';
    const sortOrder = filter.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, sortOrder as 'ASC' | 'DESC');

    const [items, totalCount] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      data: GradingRuleMapper.toDtoList(items),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async findById(id: number): Promise<GradingRuleAttribute> {
    const entity = await this.gradingRuleRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!entity) {
      throw new NotFoundException(`Grading rule with ID ${id} not found`);
    }
    return GradingRuleMapper.toDto(entity);
  }

  async findDefault(): Promise<GradingRuleAttribute> {
    let entity = await this.gradingRuleRepo.findOne({
      where: { isDefault: true, status: 'ACTIVE', deletedAt: IsNull() },
    });

    if (!entity) {
      entity = await this.gradingRuleRepo.findOne({
        where: { status: 'ACTIVE', deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });
    }

    if (!entity) {
      throw new NotFoundException('No active grading rule found');
    }

    return GradingRuleMapper.toDto(entity);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const entity = await this.gradingRuleRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!entity) {
      throw new NotFoundException(`Grading rule with ID ${id} not found`);
    }
    await this.gradingRuleRepo.softDelete(id);
    return { success: true };
  }
}
