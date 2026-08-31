import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { Program } from './entity/program.entity.js';
import { ProgramMapper } from './mapper/program.mapper.js';
import type { ProgramAttribute } from '@repo/contracts';
import type {
  CreateProgramDto,
  UpdateProgramDto,
  FindProgramsDto,
} from './dto/program.dto.js';

import {
  applyBranchScoping,
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
  ) {}

  async findAll(dto: FindProgramsDto, currentUser?: AuthContext) {
    const { search, status, sortBy = 'id', sortOrder = 'DESC' } = dto;

    const query = this.programRepo
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.classes', 'classes');

    applyBranchScoping(query, 'program', currentUser, dto.branchId);

    if (search) {
      query.andWhere(
        '(program.name LIKE :search OR program.code LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('program.status = :status', { status });
    }

    query.orderBy(`program.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [ProgramMapper.toDtoList(entities), total] as [
      ProgramAttribute[],
      number,
    ];
  }

  async findOne(id: number) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['classes'],
    });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return ProgramMapper.toDto(program);
  }

  async create(dto: CreateProgramDto, currentUser?: AuthContext) {
    const existing = await this.programRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Program with code "${dto.code}" already exists`,
      );
    }

    const program = this.programRepo.create({
      ...dto,
      status: dto.status ?? 'ACTIVE',
      books: dto.books ?? [],
      gradeLevels: dto.gradeLevels ?? [],
      branchId: resolveBranchId(currentUser, dto.branchId),
    });
    const saved = await this.programRepo.save(program);
    return ProgramMapper.toDto(saved);
  }

  async update(id: number, dto: UpdateProgramDto) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['classes'],
    });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    if (dto.code && dto.code !== program.code) {
      const existing = await this.programRepo.findOne({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Program with code "${dto.code}" already exists`,
        );
      }
    }

    Object.assign(program, dto);
    const saved = await this.programRepo.save(program);
    return ProgramMapper.toDto(saved);
  }

  async delete(id: number) {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    await this.programRepo.softDelete(id);
    return { id, success: true };
  }
}
