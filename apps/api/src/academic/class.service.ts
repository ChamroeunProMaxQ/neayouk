import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEnrollmentStatusEnum } from '@repo/contracts';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { Class } from './entity/class.entity.js';
import { ClassTimetable } from './entity/class-timetable.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { ClassMapper, ClassTimetableMapper } from './mapper/class.mapper.js';
import { StudentClassMapper } from '@src/student/mapper/student.mapper.js';
import type {
  CreateClassDto,
  UpdateClassDto,
  FindClassesDto,
  CreateClassTimetableDto,
  UpdateClassTimetableDto,
  FindClassTimetablesDto,
} from './dto/class.dto.js';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(ClassTimetable)
    private readonly timetableRepo: Repository<ClassTimetable>,
    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,
  ) { }

  async findAll(dto: FindClassesDto) {
    const {
      search,
      academicYear,
      semester,
      shift,
      gradeLevel,
      programId,
      program,
      status,
      teacherId,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = dto;

    const query = this.classRepo
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.enrollments', 'enrollments')
      .leftJoinAndSelect('class.timetables', 'timetables')
      .leftJoinAndSelect('class.program', 'program')
      .leftJoinAndSelect('class.teacher', 'teacher');

    if (search) {
      query.andWhere(
        '(class.name LIKE :search OR class.code LIKE :search OR program.name LIKE :search OR class.gradeLevel LIKE :search OR class.room LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (academicYear) {
      query.andWhere('class.academicYear = :academicYear', { academicYear });
    }

    if (semester) {
      query.andWhere('class.semester = :semester', { semester });
    }

    if (shift) {
      query.andWhere('class.shift = :shift', { shift });
    }

    if (gradeLevel) {
      query.andWhere('class.gradeLevel = :gradeLevel', { gradeLevel });
    }

    if (programId) {
      query.andWhere('class.programId = :programId', { programId });
    }

    if (teacherId) {
      query.andWhere('teacher.id = :teacherId', { teacherId });
    }

    if (program) {
      query.andWhere('(program.name = :program OR class.programId = :programId)', {
        program,
        programId: Number(program) || null,
      });
    }

    if (status) {
      query.andWhere('class.status = :status', { status });
    }

    query.orderBy(`class.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [ClassMapper.toDtoList(entities), total];
  }

  async findOne(id: number) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['enrollments', 'timetables', 'program', 'teacher'],
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return ClassMapper.toDto(cls);
  }

  async create(dto: CreateClassDto) {
    if (dto.code) {
      const existing = await this.classRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Class with code "${dto.code}" already exists`);
      }
    }

    const { program: _program, ...data } = dto;
    const cls = this.classRepo.create({
      ...data,
      monthlyFee: dto.monthlyFee ?? 0,
      status: dto.status ?? 'ACTIVE',
    });
    const saved = await this.classRepo.save(cls);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateClassDto) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['enrollments', 'timetables', 'program', 'teacher'],
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    if (dto.code && dto.code !== cls.code) {
      const existing = await this.classRepo.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Class with code "${dto.code}" already exists`);
      }
    }

    const { program: _program, ...data } = dto;

    this.classRepo.merge(cls, data);

    const saved = await this.classRepo.save(cls);
    return ClassMapper.toDto(saved);
  }

  async delete(id: number) {
    const cls = await this.classRepo.findOne({ where: { id } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    await this.classRepo.softDelete(id);
    return { id, success: true };
  }

  async getStudents(id: number) {
    const cls = await this.classRepo.findOne({ where: { id } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    const enrollments = await this.studentClassRepo.find({
      where: { classId: id },
      relations: ['student'],
      order: { enrolledAt: 'DESC' },
    });
    return StudentClassMapper.toDtoList(enrollments);
  }

  // Timetable Operations
  async getTimetable(classId: number, dto?: FindClassTimetablesDto) {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const query = this.timetableRepo
      .createQueryBuilder('timetable')
      .where('timetable.classId = :classId', { classId });

    if (dto?.dayOfWeek) {
      query.andWhere('timetable.dayOfWeek = :dayOfWeek', { dayOfWeek: dto.dayOfWeek });
    }

    if (dto?.teacherId) {
      query.andWhere('timetable.teacherId = :teacherId', { teacherId: dto.teacherId });
    }

    if (dto?.room) {
      query.andWhere('timetable.room LIKE :room', { room: `%${dto.room}%` });
    }

    query.orderBy('timetable.dayOfWeek', 'ASC').addOrderBy('timetable.startTime', 'ASC');

    const slots = await query.getMany();
    return ClassTimetableMapper.toDtoList(slots);
  }

  async createTimetableSlot(classId: number, dto: CreateClassTimetableDto) {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.checkTimetableConflicts(
      classId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.teacherId,
      dto.room,
    );

    const slot = this.timetableRepo.create({
      ...dto,
      classId,
    });

    const saved = await this.timetableRepo.save(slot);
    return ClassTimetableMapper.toDto(saved);
  }

  async updateTimetableSlot(slotId: number, dto: UpdateClassTimetableDto) {
    const slot = await this.timetableRepo.findOne({
      where: { id: slotId },
      relations: ['class'],
    });

    if (!slot) {
      throw new NotFoundException(`Timetable slot with ID ${slotId} not found`);
    }

    const nextDay = dto.dayOfWeek ?? slot.dayOfWeek;
    const nextStart = dto.startTime ?? slot.startTime;
    const nextEnd = dto.endTime ?? slot.endTime;
    const nextTeacher = dto.teacherId !== undefined ? dto.teacherId : slot.teacherId;
    const nextRoom = dto.room !== undefined ? dto.room : slot.room;

    if (nextStart >= nextEnd) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.checkTimetableConflicts(
      slot.classId,
      nextDay,
      nextStart,
      nextEnd,
      nextTeacher,
      nextRoom,
      slotId,
    );

    Object.assign(slot, dto);
    const saved = await this.timetableRepo.save(slot);
    return ClassTimetableMapper.toDto(saved);
  }

  async deleteTimetableSlot(slotId: number) {
    const slot = await this.timetableRepo.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException(`Timetable slot with ID ${slotId} not found`);
    }
    await this.timetableRepo.delete(slotId);
    return { id: slotId, success: true };
  }

  private async checkTimetableConflicts(
    classId: number,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    teacherId?: number | null,
    room?: string | null,
    excludeSlotId?: number,
  ) {
    // 1. Same Class overlap check
    const classConflictQuery = this.timetableRepo
      .createQueryBuilder('slot')
      .where('slot.classId = :classId', { classId })
      .andWhere('slot.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('slot.startTime < :endTime', { endTime })
      .andWhere('slot.endTime > :startTime', { startTime });

    if (excludeSlotId) {
      classConflictQuery.andWhere('slot.id != :excludeSlotId', { excludeSlotId });
    }

    const classConflict = await classConflictQuery.getOne();
    if (classConflict) {
      throw new ConflictException(
        `Time slot conflict: Class already has '${classConflict.subject}' scheduled on ${dayOfWeek} from ${classConflict.startTime} to ${classConflict.endTime}`,
      );
    }

    // 2. Teacher overlap check
    if (teacherId) {
      const teacherConflictQuery = this.timetableRepo
        .createQueryBuilder('slot')
        .innerJoinAndSelect('slot.class', 'class')
        .where('slot.teacherId = :teacherId', { teacherId })
        .andWhere('slot.dayOfWeek = :dayOfWeek', { dayOfWeek })
        .andWhere('slot.startTime < :endTime', { endTime })
        .andWhere('slot.endTime > :startTime', { startTime });

      if (excludeSlotId) {
        teacherConflictQuery.andWhere('slot.id != :excludeSlotId', { excludeSlotId });
      }

      const teacherConflict = await teacherConflictQuery.getOne();
      if (teacherConflict && teacherConflict.classId !== classId) {
        throw new ConflictException(
          `Teacher conflict: Teacher is already assigned to class '${teacherConflict.class?.name ?? teacherConflict.classId}' on ${dayOfWeek} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`,
        );
      }
    }
  }

  async getAcademicYearsSummary() {
    const raw: Array<{
      academicYear: string;
      semester: string;
      classCount: string | number;
      studentCount: string | number;
    }> = await this.classRepo
      .createQueryBuilder('class')
      .select('COALESCE(class.academicYear, "2025-2026")', 'academicYear')
      .addSelect('COALESCE(class.semester, "SEMESTER_1")', 'semester')
      .addSelect('COUNT(DISTINCT class.id)', 'classCount')
      .leftJoin(
        'class.enrollments',
        'enrollment',
        'enrollment.status = :enrolledStatus',
        { enrolledStatus: ClassEnrollmentStatusEnum.ENROLLED },
      )
      .addSelect('COUNT(DISTINCT enrollment.studentId)', 'studentCount')
      .groupBy('class.academicYear')
      .addGroupBy('class.semester')
      .orderBy('academicYear', 'DESC')
      .getRawMany();

    return raw.map((r) => ({
      academicYear: r.academicYear || '2025-2026',
      semester: r.semester || 'SEMESTER_1',
      classCount: Number(r.classCount) || 0,
      studentCount: Number(r.studentCount) || 0,
    }));
  }
}
