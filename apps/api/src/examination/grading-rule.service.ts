import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  type GradingRuleAttribute,
  type CreateGradingRuleDto,
  type UpdateGradingRuleDto,
  type FindGradingRulesDto,
  UserTypeEnum,
} from '@repo/contracts';
import { GradingRule } from './entity/grading-rule.entity.js';
import { StudentScore } from './entity/student-score.entity.js';
import { GradingRuleMapper } from './mapper/grading-rule.mapper.js';
import { GradebookMapper } from './mapper/gradebook.mapper.js';

import {
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class GradingRuleService {
  constructor(
    @InjectRepository(GradingRule)
    private readonly gradingRuleRepo: Repository<GradingRule>,
    @Optional()
    @InjectRepository(StudentScore)
    private readonly scoreRepo?: Repository<StudentScore>,
  ) {}

  private validateComponentWeights(components: { weight: number }[]) {
    const totalWeight = components.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException('Component weights must sum to exactly 100%');
    }
  }

  async create(
    dto: CreateGradingRuleDto,
    currentUser?: AuthContext,
  ): Promise<GradingRuleAttribute> {
    this.validateComponentWeights(dto.components);

    const existing = await this.gradingRuleRepo.findOne({
      where: { code: dto.code, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(`Grading rule with code '${dto.code}' already exists`);
    }

    const branchId = resolveBranchId(currentUser, dto.branchId);

    if (dto.isDefault) {
      if (branchId) {
        await this.gradingRuleRepo.update(
          { isDefault: true, branchId, deletedAt: IsNull() },
          { isDefault: false },
        );
      } else {
        await this.gradingRuleRepo.update(
          { isDefault: true, branchId: IsNull(), deletedAt: IsNull() },
          { isDefault: false },
        );
      }
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
      branchId,
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
      if (entity.branchId) {
        await this.gradingRuleRepo.update(
          { isDefault: true, branchId: entity.branchId, deletedAt: IsNull() },
          { isDefault: false },
        );
      } else {
        await this.gradingRuleRepo.update(
          { isDefault: true, branchId: IsNull(), deletedAt: IsNull() },
          { isDefault: false },
        );
      }
    }

    this.gradingRuleRepo.merge(entity, dto);
    const saved = await this.gradingRuleRepo.save(entity);

    // If components or grade scale changed, sync and recalculate existing scores in student_scores
    if ((dto.components || dto.gradeScale) && this.scoreRepo) {
      const qb = this.scoreRepo.createQueryBuilder('score').where('score.deleted_at IS NULL');
      if (saved.branchId) {
        qb.andWhere('score.branch_id = :branchId', { branchId: saved.branchId });
      }
      const existingScores = await qb.getMany();
      if (existingScores.length > 0) {
        for (const sc of existingScores) {
          const calc = GradebookMapper.calculateScores(
            sc.scores ?? {},
            saved.components,
            saved.gradeScale,
          );
          sc.totalRawScore = calc.totalRawScore;
          sc.totalWeightedScore = calc.totalWeightedScore;
          sc.percentage = calc.percentage;
          sc.gradeLetter = calc.gradeLetter;
        }
        await this.scoreRepo.save(existingScores);
      }
    }

    return GradingRuleMapper.toDto(saved);
  }

  async findAll(filter: FindGradingRulesDto, currentUser?: AuthContext) {
    const page = Number(filter.page) || 1;
    const pageSize = Number(filter.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const qb = this.gradingRuleRepo
      .createQueryBuilder('gr')
      .where('gr.deletedAt IS NULL');

    if (
      currentUser &&
      currentUser.userType !== UserTypeEnum.SUPER_ADMIN &&
      currentUser.userType !== 'SUPER_ADMIN' &&
      currentUser.branchId
    ) {
      qb.andWhere('(gr.branch_id IS NULL OR gr.branch_id = :scopedBranchId)', {
        scopedBranchId: currentUser.branchId,
      });
    } else if (filter.branchId) {
      qb.andWhere('(gr.branch_id IS NULL OR gr.branch_id = :explicitBranchId)', {
        explicitBranchId: filter.branchId,
      });
    }

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

    return [GradingRuleMapper.toDtoList(items), totalCount] as const;
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

  async findDefault(branchId?: number | null): Promise<GradingRuleAttribute> {
    let entity: GradingRule | null = null;

    // 1. Branch-specific default active rule
    if (branchId) {
      entity = await this.gradingRuleRepo.findOne({
        where: { isDefault: true, branchId, status: 'ACTIVE', deletedAt: IsNull() },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
      });
    }

    // 2. Global default active rule (branch_id IS NULL and isDefault = true)
    if (!entity) {
      entity = await this.gradingRuleRepo.findOne({
        where: { isDefault: true, branchId: IsNull(), status: 'ACTIVE', deletedAt: IsNull() },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
      });
    }

    // 3. Global any active rule (branch_id IS NULL)
    if (!entity) {
      entity = await this.gradingRuleRepo.findOne({
        where: { branchId: IsNull(), status: 'ACTIVE', deletedAt: IsNull() },
        order: { isDefault: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
      });
    }

    // 4. Fallback: If branch has any active rule (even if not explicitly marked default)
    if (!entity && branchId) {
      entity = await this.gradingRuleRepo.findOne({
        where: { branchId, status: 'ACTIVE', deletedAt: IsNull() },
        order: { isDefault: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
      });
    }

    // 5. Fallback to any active default rule
    if (!entity) {
      entity = await this.gradingRuleRepo.findOne({
        where: { isDefault: true, status: 'ACTIVE', deletedAt: IsNull() },
        order: { updatedAt: 'DESC', createdAt: 'DESC' },
      });
    }

    // 6. Fallback to any active rule
    if (!entity) {
      entity = await this.gradingRuleRepo.findOne({
        where: { status: 'ACTIVE', deletedAt: IsNull() },
        order: { isDefault: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
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
