import {
  Inject,
  Injectable,
  NotFoundException,
  type LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import {
  AttendanceStatusEnum,
  type RecordTeacherAttendanceDto,
  type BatchRecordTeacherAttendanceDto,
  type FindTeacherAttendanceDto,
  type TeacherAttendanceAttribute,
  type TeacherAttendanceSummaryDto,
} from '@repo/contracts';
import { TeacherAttendance } from './entity/teacher-attendance.entity.js';
import { Staff } from '@src/hr/entity/staff.entity.js';
import { AttendanceMapper } from './mapper/attendance.mapper.js';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    @InjectRepository(TeacherAttendance)
    private readonly attendanceRepo: Repository<TeacherAttendance>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  private calculateHours(
    checkIn?: string | null,
    checkOut?: string | null,
  ): number {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
    const diffMinutes = outH * 60 + outM - (inH * 60 + inM);
    if (diffMinutes <= 0) return 0;
    return Math.round((diffMinutes / 60) * 100) / 100;
  }

  async recordAttendance(
    dto: RecordTeacherAttendanceDto,
    verifiedBy?: number,
  ): Promise<TeacherAttendanceAttribute> {
    const teacher = await this.staffRepo.findOne({
      where: { id: dto.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${dto.teacherId} not found`);
    }

    const dateStr = typeof dto.date === 'string' ? dto.date : String(dto.date);

    let hours = dto.hoursWorked;
    if (
      hours === undefined ||
      hours === null ||
      (hours === 0 && Boolean(dto.checkInTime && dto.checkOutTime))
    ) {
      if (dto.checkInTime && dto.checkOutTime) {
        hours = this.calculateHours(dto.checkInTime, dto.checkOutTime);
      } else {
        hours = 0;
      }
    }

    let record = await this.attendanceRepo.findOne({
      where: { teacherId: dto.teacherId, date: dateStr },
      relations: ['teacher', 'verifier'],
    });

    if (record) {
      this.attendanceRepo.merge(record, {
        checkInTime:
          dto.checkInTime !== undefined ? dto.checkInTime : record.checkInTime,
        checkOutTime:
          dto.checkOutTime !== undefined
            ? dto.checkOutTime
            : record.checkOutTime,
        hoursWorked: hours,
        status: dto.status,
        remarks: dto.remarks !== undefined ? dto.remarks : record.remarks,
        verifiedBy: verifiedBy ?? record.verifiedBy,
      });
    } else {
      record = this.attendanceRepo.create({
        teacherId: dto.teacherId,
        date: dateStr,
        checkInTime: dto.checkInTime ?? null,
        checkOutTime: dto.checkOutTime ?? null,
        hoursWorked: hours,
        status: dto.status,
        remarks: dto.remarks ?? null,
        verifiedBy: verifiedBy ?? null,
      });
    }

    const saved = await this.attendanceRepo.save(record);
    const reloaded = await this.attendanceRepo.findOne({
      where: { id: saved.id },
      relations: ['teacher', 'verifier'],
    });

    return AttendanceMapper.toTeacherAttendanceDto(reloaded ?? saved);
  }

  async batchRecordAttendance(
    dto: BatchRecordTeacherAttendanceDto,
    verifiedBy?: number,
  ): Promise<TeacherAttendanceAttribute[]> {
    const dateStr = typeof dto.date === 'string' ? dto.date : String(dto.date);
    const results: TeacherAttendanceAttribute[] = [];

    for (const item of dto.records) {
      const record = await this.recordAttendance(
        {
          teacherId: item.teacherId,
          date: dateStr,
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          hoursWorked: item.hoursWorked,
          status: item.status,
          remarks: item.remarks,
        },
        verifiedBy,
      );
      results.push(record);
    }

    return results;
  }

  async findAll(query: FindTeacherAttendanceDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.teacher', 'teacher')
      .leftJoinAndSelect('att.verifier', 'verifier');

    if (query.teacherId) {
      qb.andWhere('att.teacher_id = :teacherId', {
        teacherId: query.teacherId,
      });
    }
    if (query.date) {
      qb.andWhere('att.date = :date', { date: query.date });
    }
    if (query.startDate && query.endDate) {
      qb.andWhere('att.date BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } else if (query.startDate) {
      qb.andWhere('att.date >= :startDate', { startDate: query.startDate });
    } else if (query.endDate) {
      qb.andWhere('att.date <= :endDate', { endDate: query.endDate });
    }
    if (query.status) {
      qb.andWhere('att.status = :status', { status: query.status });
    }

    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(
      `att.${sortBy === 'id' ? 'id' : sortBy === 'status' ? 'status' : sortBy === 'hoursWorked' ? 'hours_worked' : 'date'}`,
      sortOrder,
    );

    const [items, totalCount] = await qb
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return [
      AttendanceMapper.toTeacherAttendanceDtoList(items),
      totalCount,
    ] as const;
  }

  async getTeacherMonthlySummary(
    teacherId: number,
    monthStr: string,
  ): Promise<TeacherAttendanceSummaryDto> {
    const teacher = await this.staffRepo.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Format: YYYY-MM
    const startDate = `${monthStr}-01`;
    // Find last day of month
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

    const records = await this.attendanceRepo.find({
      where: {
        teacherId,
        date: Between(startDate, endDate),
      },
    });

    let totalHoursWorked = 0;
    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;
    let daysOnLeave = 0;

    for (const r of records) {
      totalHoursWorked += Number(r.hoursWorked || 0);
      if (r.status === AttendanceStatusEnum.PRESENT) daysPresent++;
      else if (r.status === AttendanceStatusEnum.ABSENT) daysAbsent++;
      else if (r.status === AttendanceStatusEnum.LATE) daysLate++;
      else if (
        r.status === AttendanceStatusEnum.ON_LEAVE ||
        r.status === AttendanceStatusEnum.EXCUSED
      )
        daysOnLeave++;
    }

    const salaryRate = Number(teacher.hourlyRate || teacher.baseSalary || 0);
    const estimatedSalary =
      Math.round(totalHoursWorked * salaryRate * 100) / 100;

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherCode: teacher.staffCode ?? null,
      salaryInHour: salaryRate,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      estimatedSalary,
      daysPresent,
      daysAbsent,
      daysLate,
      daysOnLeave,
      month: monthStr,
    };
  }
}
