import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  type LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import {
  AttendanceStatusEnum,
  type RecordStudentAttendanceDto,
  type BatchRecordStudentAttendanceDto,
  type FindStudentAttendanceDto,
  type StudentAttendanceAttribute,
  type StudentAttendanceMatrixDto,
  type StudentAttendanceMatrixRow,
  type ClassAttendanceSummaryDto,
  ClassEnrollmentStatusEnum,
} from '@repo/contracts';
import { StudentAttendance } from './entity/student-attendance.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { AttendanceMapper } from './mapper/attendance.mapper.js';

@Injectable()
export class StudentAttendanceService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly attendanceRepo: Repository<StudentAttendance>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) { }

  async recordAttendance(
    dto: RecordStudentAttendanceDto,
    recordedBy?: number,
  ): Promise<StudentAttendanceAttribute> {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${dto.classId} not found`);
    }

    const dateStr = typeof dto.date === 'string' ? dto.date : String(dto.date);

    // Look for existing record
    let record = await this.attendanceRepo.findOne({
      where: {
        studentId: dto.studentId,
        classId: dto.classId,
        date: dateStr,
        sessionSlotId: dto.sessionSlotId ? dto.sessionSlotId : undefined,
      },
      relations: ['student', 'class', 'recorder'],
    });

    if (record) {
      this.attendanceRepo.merge(record, {
        status: dto.status,
        remarks: dto.remarks !== undefined ? dto.remarks : record.remarks,
        recordedBy: recordedBy ?? record.recordedBy,
      });
    } else {
      record = this.attendanceRepo.create({
        studentId: dto.studentId,
        classId: dto.classId,
        date: dateStr,
        status: dto.status,
        sessionSlotId: dto.sessionSlotId ?? null,
        remarks: dto.remarks ?? null,
        recordedBy: recordedBy ?? null,
      });
    }

    const saved = await this.attendanceRepo.save(record);
    const reloaded = await this.attendanceRepo.findOne({
      where: { id: saved.id },
      relations: ['student', 'class', 'recorder'],
    });

    return AttendanceMapper.toStudentAttendanceDto(reloaded ?? saved);
  }

  async batchRecordAttendance(
    dto: BatchRecordStudentAttendanceDto,
    recordedBy?: number,
  ): Promise<StudentAttendanceAttribute[]> {
    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${dto.classId} not found`);
    }

    const dateStr = typeof dto.date === 'string' ? dto.date : String(dto.date);
    const results: StudentAttendanceAttribute[] = [];

    for (const item of dto.records) {
      const record = await this.recordAttendance(
        {
          studentId: item.studentId,
          classId: dto.classId,
          date: dateStr,
          status: item.status,
          sessionSlotId: item.sessionSlotId,
          remarks: item.remarks,
        },
        recordedBy,
      );
      results.push(record);
    }

    return results;
  }

  async findAll(
    query: FindStudentAttendanceDto,
  ): Promise<{ data: StudentAttendanceAttribute[]; pagination: { totalCount: number; page: number; pageSize: number; pageCount: number } }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.class', 'class')
      .leftJoinAndSelect('att.recorder', 'recorder');

    if (query.classId) {
      qb.andWhere('att.class_id = :classId', { classId: query.classId });
    }
    if (query.studentId) {
      qb.andWhere('att.student_id = :studentId', { studentId: query.studentId });
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
    qb.orderBy(`att.${sortBy === 'id' ? 'id' : sortBy === 'status' ? 'status' : 'date'}`, sortOrder);

    const [items, totalCount] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      data: AttendanceMapper.toStudentAttendanceDtoList(items),
      pagination: {
        totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async getMatrix(
    classId: number,
    startDateStr: string,
    endDateStr: string,
  ): Promise<StudentAttendanceMatrixDto> {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // Get all enrolled students in the class
    const enrollments = await this.studentClassRepo.find({
      where: { classId, status: ClassEnrollmentStatusEnum.ENROLLED },
      relations: ['student'],
    });

    const enrolledStudents = enrollments.map((e) => e.student).filter(Boolean);

    // Generate list of dates in the range (inclusive)
    const dates: string[] = [];
    const curr = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (curr > end) {
      throw new BadRequestException('End date must be greater than or equal to start date');
    }

    while (curr <= end) {
      dates.push(curr.toISOString().slice(0, 10));
      curr.setDate(curr.getDate() + 1);
    }

    // Fetch all attendance records for this class in date range
    const records = await this.attendanceRepo.find({
      where: {
        classId,
        date: Between(startDateStr, endDateStr),
      },
    });

    // Group records by studentId and date
    const recordMap = new Map<number, Map<string, StudentAttendance>>();
    for (const r of records) {
      if (!recordMap.has(r.studentId)) {
        recordMap.set(r.studentId, new Map());
      }
      const d = typeof r.date === 'string' ? r.date : (r.date as any)?.toISOString?.()?.slice(0, 10);
      recordMap.get(r.studentId)!.set(d, r);
    }

    // Build matrix rows
    const rows: StudentAttendanceMatrixRow[] = enrolledStudents.map((stu) => {
      const stuRecords = recordMap.get(stu.id) || new Map<string, StudentAttendance>();
      const attendances: Record<string, { id?: number; status: AttendanceStatusEnum; remarks?: string | null }> = {};

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalExcused = 0;
      let totalHalfDay = 0;

      for (const d of dates) {
        const rec = stuRecords.get(d);
        if (!rec) continue;
        attendances[d] = {
          id: rec.id,
          status: rec.status,
          remarks: rec.remarks ?? null,
        };
        if (rec.status === AttendanceStatusEnum.PRESENT) totalPresent++;
        else if (rec.status === AttendanceStatusEnum.ABSENT) totalAbsent++;
        else if (rec.status === AttendanceStatusEnum.LATE) totalLate++;
        else if (rec.status === AttendanceStatusEnum.EXCUSED || rec.status === AttendanceStatusEnum.ON_LEAVE) totalExcused++;
        else if (rec.status === AttendanceStatusEnum.HALF_DAY) totalHalfDay++;

      }

      const totalRecorded = totalPresent + totalAbsent + totalLate + totalExcused + totalHalfDay;
      const attendanceRate =
        totalRecorded > 0
          ? Math.round(((totalPresent + totalLate * 0.5 + totalHalfDay * 0.5) / totalRecorded) * 100)
          : 100;

      return {
        studentId: stu.id,
        studentCode: stu.studentCode ?? null,
        firstName: stu.firstName,
        lastName: stu.lastName,
        firstNameKm: stu.firstNameKm ?? null,
        lastNameKm: stu.lastNameKm ?? null,
        gender: stu.gender || 'MALE',
        attendances,
        totalPresent,
        totalAbsent,
        totalLate,
        totalExcused,
        totalHalfDay,
        attendanceRate,
      };
    });

    return {
      classId: cls.id,
      className: cls.name,
      startDate: startDateStr,
      endDate: endDateStr,
      dates,
      totalStudents: enrolledStudents.length,
      rows,
    };
  }

  async getClassSummary(classId: number, dateStr: string): Promise<ClassAttendanceSummaryDto> {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const totalEnrolled = await this.studentClassRepo.count({
      where: { classId, status: ClassEnrollmentStatusEnum.ENROLLED },
    });

    const records = await this.attendanceRepo.find({
      where: { classId, date: dateStr },
    });

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let halfDayCount = 0;

    for (const r of records) {
      if (r.status === AttendanceStatusEnum.PRESENT) presentCount++;
      else if (r.status === AttendanceStatusEnum.ABSENT) absentCount++;
      else if (r.status === AttendanceStatusEnum.LATE) lateCount++;
      else if (r.status === AttendanceStatusEnum.EXCUSED || r.status === AttendanceStatusEnum.ON_LEAVE) excusedCount++;
      else if (r.status === AttendanceStatusEnum.HALF_DAY) halfDayCount++;
    }

    const totalRecorded = presentCount + absentCount + lateCount + excusedCount + halfDayCount;
    const attendanceRate =
      totalRecorded > 0
        ? Math.round(((presentCount + lateCount * 0.5 + halfDayCount * 0.5) / totalRecorded) * 100)
        : totalEnrolled > 0
          ? 0
          : 100;

    return {
      classId: cls.id,
      className: cls.name,
      totalEnrolled,
      date: dateStr,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      halfDayCount,
      attendanceRate,
    };
  }
}
