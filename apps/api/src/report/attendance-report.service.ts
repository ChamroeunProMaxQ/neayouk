import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttendanceStatusEnum,
  type AttendanceReportQueryDto,
  type AttendanceReportSummaryDto,
} from '@repo/contracts';
import { StudentAttendance } from '@src/attendance/entity/student-attendance.entity.js';
import { TeacherAttendance } from '@src/attendance/entity/teacher-attendance.entity.js';
import { LeaveRequest } from '@src/attendance/entity/leave-request.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { Student } from '@src/student/entity/student.entity.js';
import { StudentClass } from '@src/student/entity/student-class.entity.js';
import { resolveDateRange } from './helper/report-date.helper.js';

@Injectable()
export class AttendanceReportService {
  constructor(
    @InjectRepository(StudentAttendance)
    private readonly studentAttRepo: Repository<StudentAttendance>,

    @InjectRepository(TeacherAttendance)
    private readonly teacherAttRepo: Repository<TeacherAttendance>,

    @InjectRepository(LeaveRequest)
    private readonly leaveRepo: Repository<LeaveRequest>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,
  ) {}

  async getSummary(query: AttendanceReportQueryDto): Promise<AttendanceReportSummaryDto> {
    const range = resolveDateRange(query.preset, query.startDate, query.endDate);

    // 1. Fetch student attendance records
    const studentAttQb = this.studentAttRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.class', 'class')
      .where('att.date >= :startDate AND att.date <= :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      });

    if (query.classId) {
      studentAttQb.andWhere('att.class_id = :classId', { classId: query.classId });
    }

    const studentRecords = await studentAttQb.getMany();

    // 2. Fetch teacher attendance records
    const teacherAttQb = this.teacherAttRepo
      .createQueryBuilder('tatt')
      .where('tatt.date >= :startDate AND tatt.date <= :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      });

    const teacherRecords = await teacherAttQb.getMany();

    // 3. Overall Student Attendance Rate
    let stuPresent = 0;
    let stuAbsent = 0;
    let stuLate = 0;
    let stuExcused = 0;
    let stuHalfDay = 0;

    studentRecords.forEach((r) => {
      if (r.status === AttendanceStatusEnum.PRESENT) stuPresent += 1;
      else if (r.status === AttendanceStatusEnum.ABSENT) stuAbsent += 1;
      else if (r.status === AttendanceStatusEnum.LATE) stuLate += 1;
      else if (r.status === AttendanceStatusEnum.EXCUSED || r.status === AttendanceStatusEnum.ON_LEAVE) stuExcused += 1;
      else if (r.status === AttendanceStatusEnum.HALF_DAY) stuHalfDay += 1;
    });

    const totalSessionsRecorded = studentRecords.length;
    const studentAttendanceRate =
      totalSessionsRecorded > 0
        ? Number((((stuPresent + stuLate * 0.5 + stuHalfDay * 0.5) / totalSessionsRecorded) * 100).toFixed(1))
        : 100;

    // 4. Overall Teacher Attendance Rate
    let teaPresent = 0;
    let teaLate = 0;
    let teaAbsent = 0;
    teacherRecords.forEach((r) => {
      if (r.status === AttendanceStatusEnum.PRESENT) teaPresent += 1;
      else if (r.status === AttendanceStatusEnum.LATE) teaLate += 1;
      else if (r.status === AttendanceStatusEnum.ABSENT) teaAbsent += 1;
    });

    const totalTeacherSessions = teacherRecords.length;
    const teacherAttendanceRate =
      totalTeacherSessions > 0
        ? Number((((teaPresent + teaLate * 0.5) / totalTeacherSessions) * 100).toFixed(1))
        : 100;

    // 5. Average Daily Absences
    const distinctDates = new Set(studentRecords.map((r) => (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10))));
    const averageDailyAbsences =
      distinctDates.size > 0 ? Number((stuAbsent / distinctDates.size).toFixed(1)) : 0;

    // 6. Approved Leaves Count & Breakdown
    const leaveQb = this.leaveRepo
      .createQueryBuilder('leave')
      .where('leave.created_at >= :start AND leave.created_at <= :end', {
        start: `${range.startDate} 00:00:00`,
        end: `${range.endDate} 23:59:59`,
      })
      .andWhere('leave.status = :status', { status: 'APPROVED' });

    const leaves = await leaveQb.getMany();
    const totalApprovedLeaves = leaves.length;

    const leaveCatMap = new Map<string, number>();
    leaves.forEach((l) => {
      const type = l.leaveType || 'PERSONAL';
      leaveCatMap.set(type, (leaveCatMap.get(type) || 0) + 1);
    });

    const leaveTypeBreakdown = Array.from(leaveCatMap.entries()).map(([leaveType, count]) => ({
      leaveType,
      count,
      percentage: totalApprovedLeaves > 0 ? Number(((count / totalApprovedLeaves) * 100).toFixed(1)) : 0,
    }));

    // 7. Daily Trends
    const dailyMap = new Map<string, { present: number; absent: number; late: number; excused: number; halfDay: number }>();
    studentRecords.forEach((r) => {
      const d = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10);
      const curr = dailyMap.get(d) || { present: 0, absent: 0, late: 0, excused: 0, halfDay: 0 };
      if (r.status === AttendanceStatusEnum.PRESENT) curr.present += 1;
      else if (r.status === AttendanceStatusEnum.ABSENT) curr.absent += 1;
      else if (r.status === AttendanceStatusEnum.LATE) curr.late += 1;
      else if (r.status === AttendanceStatusEnum.EXCUSED || r.status === AttendanceStatusEnum.ON_LEAVE) curr.excused += 1;
      else if (r.status === AttendanceStatusEnum.HALF_DAY) curr.halfDay += 1;
      dailyMap.set(d, curr);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();
    const dailyTrends = sortedDates.map((date) => {
      const d = dailyMap.get(date)!;
      const total = d.present + d.absent + d.late + d.excused + d.halfDay;
      const rate = total > 0 ? Number((((d.present + d.late * 0.5 + d.halfDay * 0.5) / total) * 100).toFixed(1)) : 100;
      return {
        date,
        present: d.present,
        absent: d.absent,
        late: d.late,
        excused: d.excused,
        halfDay: d.halfDay,
        attendanceRate: rate,
      };
    });

    // 8. Class Attendance List
    const classGroups = new Map<number, { classEntity: Class; records: StudentAttendance[] }>();
    studentRecords.forEach((r) => {
      if (r.class) {
        if (!classGroups.has(r.classId)) {
          classGroups.set(r.classId, { classEntity: r.class, records: [] });
        }
        classGroups.get(r.classId)!.records.push(r);
      }
    });

    const classAttendanceList = Array.from(classGroups.values()).map(({ classEntity, records: classRecs }) => {
      let p = 0;
      let a = 0;
      let l = 0;
      let e = 0;
      let hd = 0;
      classRecs.forEach((cr) => {
        if (cr.status === AttendanceStatusEnum.PRESENT) p += 1;
        else if (cr.status === AttendanceStatusEnum.ABSENT) a += 1;
        else if (cr.status === AttendanceStatusEnum.LATE) l += 1;
        else if (cr.status === AttendanceStatusEnum.EXCUSED || cr.status === AttendanceStatusEnum.ON_LEAVE) e += 1;
        else if (cr.status === AttendanceStatusEnum.HALF_DAY) hd += 1;
      });
      const tot = p + a + l + e + hd;
      const rate = tot > 0 ? Number((((p + l * 0.5 + hd * 0.5) / tot) * 100).toFixed(1)) : 100;
      return {
        classId: classEntity.id,
        className: classEntity.name,
        enrolledCount: classRecs.length,
        attendanceRate: rate,
        presentCount: p,
        absentCount: a,
        lateCount: l,
        excusedCount: e,
      };
    });

    // 9. Weekday Absence Patterns (Monday=1, Tuesday=2, ...)
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayMap = new Map<number, { absenceCount: number; totalSessions: number }>();
    for (let i = 1; i <= 5; i++) {
      weekdayMap.set(i, { absenceCount: 0, totalSessions: 0 });
    }

    studentRecords.forEach((r) => {
      const dateObj = new Date(r.date);
      const dayIdx = dateObj.getDay(); // 0 is Sun, 1 is Mon
      if (dayIdx >= 1 && dayIdx <= 5) {
        const curr = weekdayMap.get(dayIdx) || { absenceCount: 0, totalSessions: 0 };
        curr.totalSessions += 1;
        if (r.status === AttendanceStatusEnum.ABSENT) {
          curr.absenceCount += 1;
        }
        weekdayMap.set(dayIdx, curr);
      }
    });

    const weekdayAbsencePatterns = [1, 2, 3, 4, 5].map((dayIndex) => {
      const item = weekdayMap.get(dayIndex) || { absenceCount: 0, totalSessions: 0 };
      const avgRate = item.totalSessions > 0 ? Number(((item.absenceCount / item.totalSessions) * 100).toFixed(1)) : 0;
      return {
        dayOfWeek: weekdayNames[dayIndex],
        dayIndex,
        absenceCount: item.absenceCount,
        averageAbsenceRate: avgRate,
      };
    });

    // 10. Chronic Absenteeism List (> 10% absent and >= 2 absences)
    const studentGroupMap = new Map<number, { student: Student; class?: Class; records: StudentAttendance[] }>();
    studentRecords.forEach((r) => {
      if (r.student) {
        if (!studentGroupMap.has(r.studentId)) {
          studentGroupMap.set(r.studentId, { student: r.student, class: r.class, records: [] });
        }
        studentGroupMap.get(r.studentId)!.records.push(r);
      }
    });

    const chronicAbsenteeismList = Array.from(studentGroupMap.values())
      .map(({ student, class: studentClass, records }) => {
        let absentDays = 0;
        let unexcused = 0;
        let p = 0;
        let l = 0;
        let hd = 0;
        records.forEach((rec) => {
          if (rec.status === AttendanceStatusEnum.ABSENT) {
            absentDays += 1;
            unexcused += 1;
          } else if (rec.status === AttendanceStatusEnum.PRESENT) p += 1;
          else if (rec.status === AttendanceStatusEnum.LATE) l += 1;
          else if (rec.status === AttendanceStatusEnum.HALF_DAY) hd += 1;
        });

        const totalRec = records.length;
        const rate = totalRec > 0 ? Number((((p + l * 0.5 + hd * 0.5) / totalRec) * 100).toFixed(1)) : 100;
        return {
          studentId: student.id,
          studentCode: student.studentCode ?? null,
          studentName: `${student.lastName} ${student.firstName}`,
          studentNameKm: student.firstNameKm && student.lastNameKm ? `${student.lastNameKm} ${student.firstNameKm}` : null,
          className: studentClass?.name || 'Class',
          totalRecorded: totalRec,
          absentDays,
          unexcusedAbsences: unexcused,
          attendanceRate: rate,
          parentPhone: student.guardianPhone || student.contact || null,
        };
      })
      .filter((s) => s.absentDays >= 2 || s.attendanceRate < 90)
      .sort((a, b) => b.absentDays - a.absentDays);

    const chronicAbsenteeismCount = chronicAbsenteeismList.length;

    return {
      studentAttendanceRate,
      teacherAttendanceRate,
      averageDailyAbsences,
      chronicAbsenteeismCount,
      totalApprovedLeaves,
      totalSessionsRecorded,
      dailyTrends,
      classAttendanceList,
      weekdayAbsencePatterns,
      leaveTypeBreakdown,
      chronicAbsenteeismList,
    };
  }

  async exportCsv(query: AttendanceReportQueryDto): Promise<string> {
    const range = resolveDateRange(query.preset, query.startDate, query.endDate);

    const qb = this.studentAttRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.student', 'student')
      .leftJoinAndSelect('att.class', 'class')
      .where('att.date >= :startDate AND att.date <= :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .orderBy('att.date', 'DESC');

    if (query.classId) {
      qb.andWhere('att.class_id = :classId', { classId: query.classId });
    }

    const records = await qb.getMany();

    const headers = [
      'Date',
      'Class',
      'Student Code',
      'Student Name (EN)',
      'Student Name (KM)',
      'Gender',
      'Status',
      'Remarks',
    ];

    const rows = records.map((r) => [
      typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10),
      r.class?.name || '',
      r.student?.studentCode || `STU-${r.studentId}`,
      r.student ? `${r.student.lastName} ${r.student.firstName}` : '',
      r.student?.firstNameKm && r.student?.lastNameKm ? `${r.student.lastNameKm} ${r.student.firstNameKm}` : '',
      r.student?.gender || 'MALE',
      r.status || 'PRESENT',
      r.remarks || '',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
