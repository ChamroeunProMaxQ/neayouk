import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  type LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import {
  LeaveStatusEnum,
  AttendanceStatusEnum,
  type CreateLeaveRequestDto,
  type UpdateLeaveRequestDto,
  type ReviewLeaveRequestDto,
  type FindLeaveRequestsDto,
  type LeaveRequestAttribute,
} from '@repo/contracts';
import { LeaveRequest } from './entity/leave-request.entity.js';
import { Staff } from '@src/hr/entity/staff.entity.js';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { AttendanceMapper } from './mapper/attendance.mapper.js';

import {
  applyBranchScoping,
  resolveBranchId,
  type AuthContext,
} from '@src/common/helper/branch-scoping.helper.js';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepo: Repository<LeaveRequest>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(TeacherAttendance)
    private readonly teacherAttendanceRepo: Repository<TeacherAttendance>,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async create(
    dto: CreateLeaveRequestDto,
    currentUser?: AuthContext | number,
  ): Promise<LeaveRequestAttribute> {
    const auth = typeof currentUser === 'object' ? currentUser : undefined;
    const userId = typeof currentUser === 'number' ? currentUser : (currentUser as any)?.sub ?? null;

    if (dto.endDate < dto.startDate) {
      throw new BadRequestException(
        'End date must be greater than or equal to start date',
      );
    }

    const teacher = await this.staffRepo.findOne({
      where: { id: dto.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${dto.teacherId} not found`);
    }

    const leave = this.leaveRequestRepo.create({
      teacherId: dto.teacherId,
      userId: userId ?? null,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      branchId: teacher.branchId ?? resolveBranchId(auth, (dto as any).branchId),
      totalDays: dto.totalDays ?? 1.0,
      reason: dto.reason,
      attachmentUrl: dto.attachmentUrl ?? null,
      status: LeaveStatusEnum.PENDING,
    });

    const saved = await this.leaveRequestRepo.save(leave);
    const reloaded = await this.findOne(saved.id);
    return AttendanceMapper.toLeaveRequestDto(reloaded!);
  }

  async update(
    id: number,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestAttribute> {
    const leave = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['teacher', 'user', 'reviewer'],
    });
    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leave.status !== LeaveStatusEnum.PENDING) {
      throw new BadRequestException(
        'Cannot edit a leave request that has already been reviewed',
      );
    }

    const startDate = dto.startDate ?? leave.startDate;
    const endDate = dto.endDate ?? leave.endDate;
    if (endDate < startDate) {
      throw new BadRequestException(
        'End date must be greater than or equal to start date',
      );
    }

    if (dto.teacherId) {
      const teacher = await this.teacherRepo.findOne({
        where: { id: dto.teacherId },
      });
      if (!teacher) {
        throw new NotFoundException(
          `Teacher with ID ${dto.teacherId} not found`,
        );
      }
    }

    this.leaveRequestRepo.merge(leave, {
      teacherId: dto.teacherId ?? leave.teacherId,
      leaveType: dto.leaveType ?? leave.leaveType,
      startDate: dto.startDate ?? leave.startDate,
      endDate: dto.endDate ?? leave.endDate,
      totalDays: dto.totalDays ?? leave.totalDays,
      reason: dto.reason ?? leave.reason,
      attachmentUrl:
        dto.attachmentUrl !== undefined
          ? dto.attachmentUrl
          : leave.attachmentUrl,
    });

    const saved = await this.leaveRequestRepo.save(leave);
    const reloaded = await this.findOne(saved.id);
    return AttendanceMapper.toLeaveRequestDto(reloaded!);
  }

  async findOne(id: number): Promise<LeaveRequest | null> {
    return this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['teacher', 'user', 'reviewer'],
    });
  }

  async findAll(query: FindLeaveRequestsDto, currentUser?: AuthContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const qb = this.leaveRequestRepo
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.teacher', 'teacher')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('leave.reviewer', 'reviewer');

    applyBranchScoping(qb, 'leave', currentUser, (query as any).branchId);

    if (query.teacherId) {
      qb.andWhere('leave.teacher_id = :teacherId', {
        teacherId: query.teacherId,
      });
    }
    if (query.leaveType) {
      qb.andWhere('leave.leave_type = :leaveType', {
        leaveType: query.leaveType,
      });
    }
    if (query.status) {
      qb.andWhere('leave.status = :status', { status: query.status });
    }
    if (query.startDate && query.endDate) {
      qb.andWhere(
        'leave.start_date <= :endDate AND leave.end_date >= :startDate',
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      );
    } else if (query.startDate) {
      qb.andWhere('leave.end_date >= :startDate', {
        startDate: query.startDate,
      });
    } else if (query.endDate) {
      qb.andWhere('leave.start_date <= :endDate', { endDate: query.endDate });
    }
    if (query.search) {
      qb.andWhere('(teacher.name LIKE :search OR leave.reason LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const sortBy = query.sortBy || 'id';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(
      `leave.${sortBy === 'status' ? 'status' : sortBy === 'startDate' ? 'startDate' : sortBy === 'endDate' ? 'endDate' : sortBy === 'totalDays' ? 'totalDays' : 'id'}`,
      sortOrder,
    );

    const [items, totalCount] = await qb
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return [AttendanceMapper.toLeaveRequestDtoList(items), totalCount] as const;
  }

  async review(
    id: number,
    dto: ReviewLeaveRequestDto,
    reviewerId?: number,
  ): Promise<LeaveRequestAttribute> {
    const leave = await this.leaveRequestRepo.findOne({
      where: { id },
      relations: ['teacher', 'user', 'reviewer'],
    });
    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    leave.status = dto.status;
    leave.reviewerId = reviewerId ?? null;
    leave.reviewedAt = new Date();
    leave.rejectionReason = dto.rejectionReason ?? null;

    const saved = await this.leaveRequestRepo.save(leave);

    // Auto-sync attendance if approved
    if (
      dto.status === LeaveStatusEnum.APPROVED &&
      dto.syncAttendance !== false
    ) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      while (start <= end) {
        const dateStr = start.toISOString().slice(0, 10);
        let attRecord = await this.teacherAttendanceRepo.findOne({
          where: { teacherId: leave.teacherId, date: dateStr },
        });

        if (attRecord) {
          attRecord.status = AttendanceStatusEnum.ON_LEAVE;
          attRecord.remarks = `Approved Leave (${leave.leaveType}): ${leave.reason}`;
          attRecord.verifiedBy = reviewerId ?? attRecord.verifiedBy;
        } else {
          attRecord = this.teacherAttendanceRepo.create({
            teacherId: leave.teacherId,
            date: dateStr,
            hoursWorked: 0,
            status: AttendanceStatusEnum.ON_LEAVE,
            remarks: `Approved Leave (${leave.leaveType}): ${leave.reason}`,
            verifiedBy: reviewerId ?? null,
            branchId: leave.branchId ?? leave.teacher?.branchId ?? null,
          });
        }

        await this.teacherAttendanceRepo.save(attRecord);
        start.setDate(start.getDate() + 1);
      }
    }

    const reloaded = await this.findOne(saved.id);
    return AttendanceMapper.toLeaveRequestDto(reloaded!);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const leave = await this.leaveRequestRepo.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
    await this.leaveRequestRepo.softDelete(id);
    return { success: true };
  }
}
