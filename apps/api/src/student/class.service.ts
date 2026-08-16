import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { Class } from './entity/class.entity.js';
import type { CreateClassDto, UpdateClassDto, FindClassesDto } from './dto/class.dto.js';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  async findAll(dto: FindClassesDto) {
    const { search, academicYear, semester, status, sortBy = 'id', sortOrder = 'DESC' } = dto;
    const query = this.classRepo
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.enrollments', 'enrollments');

    if (search) {
      query.andWhere(
        '(class.name LIKE :search OR class.code LIKE :search OR class.program LIKE :search OR class.gradeLevel LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (academicYear) {
      query.andWhere('class.academicYear = :academicYear', { academicYear });
    }

    if (semester) {
      query.andWhere('class.semester = :semester', { semester });
    }

    if (status) {
      query.andWhere('class.status = :status', { status });
    }

    query.orderBy(`class.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    return await query.getManyAndCount();
  }

  async findOne(id: number) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['enrollments', 'enrollments.student'],
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return cls;
  }

  async create(dto: CreateClassDto) {
    const cls = this.classRepo.create({
      ...dto,
      monthlyFee: dto.monthlyFee ?? 0,
      capacity: dto.capacity ?? 30,
      status: dto.status ?? 'ACTIVE',
    });
    return await this.classRepo.save(cls);
  }

  async update(id: number, dto: UpdateClassDto) {
    const cls = await this.findOne(id);
    Object.assign(cls, dto);
    return await this.classRepo.save(cls);
  }

  async delete(id: number) {
    await this.findOne(id);
    await this.classRepo.softDelete(id);
    return { id, success: true };
  }
}
