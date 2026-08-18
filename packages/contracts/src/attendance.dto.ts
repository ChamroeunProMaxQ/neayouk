import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { AttendanceStatusEnum } from "./attendance-status.enum.js";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const StudentAttendanceSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  studentId: z.number(),
  studentName: z.string().optional(),
  studentCode: z.string().nullable().optional(),
  studentGender: z.string().optional(),
  classId: z.number(),
  className: z.string().optional(),
  date: z.string(),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  sessionSlotId: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  recordedBy: z.number().nullable().optional(),
  recorderName: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type StudentAttendanceAttribute = z.infer<typeof StudentAttendanceSchema>;

export const RecordStudentAttendanceSchema = z.object({
  studentId: z.coerce.number(),
  classId: z.coerce.number(),
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  sessionSlotId: z.coerce.number().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type RecordStudentAttendanceDto = z.infer<typeof RecordStudentAttendanceSchema>;

export const BatchRecordStudentAttendanceItemSchema = z.object({
  studentId: z.coerce.number(),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  remarks: z.string().optional().nullable(),
  sessionSlotId: z.coerce.number().optional().nullable(),
});

export const BatchRecordStudentAttendanceSchema = z.object({
  classId: z.coerce.number(),
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  records: z.array(BatchRecordStudentAttendanceItemSchema),
});

export type BatchRecordStudentAttendanceDto = z.infer<typeof BatchRecordStudentAttendanceSchema>;

export const FindStudentAttendanceSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'date', 'status', 'createdAt'], 'date'),
  classId: z.coerce.number().optional(),
  studentId: z.coerce.number().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.nativeEnum(AttendanceStatusEnum).optional(),
});

export type FindStudentAttendanceDto = z.infer<typeof FindStudentAttendanceSchema>;

export const StudentAttendanceCellSchema = z.object({
  id: z.number().optional(),
  status: z.nativeEnum(AttendanceStatusEnum),
  remarks: z.string().nullable().optional(),
  sessionSlotId: z.number().nullable().optional(),
});

export const StudentAttendanceMatrixRowSchema = z.object({
  studentId: z.number(),
  studentCode: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  firstNameKm: z.string().nullable().optional(),
  lastNameKm: z.string().nullable().optional(),
  gender: z.string().default('MALE'),
  attendances: z.record(z.string(), StudentAttendanceCellSchema),
  totalPresent: z.number().default(0),
  totalAbsent: z.number().default(0),
  totalLate: z.number().default(0),
  totalExcused: z.number().default(0),
  totalHalfDay: z.number().default(0),
  attendanceRate: z.number().default(100),
});

export type StudentAttendanceMatrixRow = z.infer<typeof StudentAttendanceMatrixRowSchema>;

export const StudentAttendanceMatrixSchema = z.object({
  classId: z.number(),
  className: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  dates: z.array(z.string()),
  totalStudents: z.number(),
  rows: z.array(StudentAttendanceMatrixRowSchema),
});

export type StudentAttendanceMatrixDto = z.infer<typeof StudentAttendanceMatrixSchema>;

export const ClassAttendanceSummarySchema = z.object({
  classId: z.number(),
  className: z.string(),
  totalEnrolled: z.number(),
  date: z.string(),
  presentCount: z.number(),
  absentCount: z.number(),
  lateCount: z.number(),
  excusedCount: z.number(),
  halfDayCount: z.number(),
  attendanceRate: z.number(),
});

export type ClassAttendanceSummaryDto = z.infer<typeof ClassAttendanceSummarySchema>;

// ==================== TEACHER ATTENDANCE DTOs ====================

export const TeacherAttendanceSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  teacherId: z.number(),
  teacherName: z.string().optional(),
  teacherCode: z.string().nullable().optional(),
  date: z.string(),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  hoursWorked: z.coerce.number().default(0),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  remarks: z.string().nullable().optional(),
  verifiedBy: z.number().nullable().optional(),
  verifierName: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type TeacherAttendanceAttribute = z.infer<typeof TeacherAttendanceSchema>;

export const RecordTeacherAttendanceSchema = z.object({
  teacherId: z.coerce.number(),
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  hoursWorked: z.coerce.number().min(0, "Hours worked cannot be negative").default(0).optional(),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  remarks: z.string().optional().nullable(),
});

export type RecordTeacherAttendanceDto = z.infer<typeof RecordTeacherAttendanceSchema>;

export const BatchRecordTeacherAttendanceItemSchema = z.object({
  teacherId: z.coerce.number(),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  hoursWorked: z.coerce.number().min(0).default(0).optional(),
  status: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PRESENT),
  remarks: z.string().optional().nullable(),
});

export const BatchRecordTeacherAttendanceSchema = z.object({
  date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
  records: z.array(BatchRecordTeacherAttendanceItemSchema),
});

export type BatchRecordTeacherAttendanceDto = z.infer<typeof BatchRecordTeacherAttendanceSchema>;

export const FindTeacherAttendanceSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'date', 'status', 'hoursWorked', 'createdAt'], 'date'),
  teacherId: z.coerce.number().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.nativeEnum(AttendanceStatusEnum).optional(),
});

export type FindTeacherAttendanceDto = z.infer<typeof FindTeacherAttendanceSchema>;

export const TeacherAttendanceSummarySchema = z.object({
  teacherId: z.number(),
  teacherName: z.string(),
  teacherCode: z.string().nullable().optional(),
  salaryInHour: z.coerce.number().default(0),
  totalHoursWorked: z.number().default(0),
  estimatedSalary: z.number().default(0),
  daysPresent: z.number().default(0),
  daysAbsent: z.number().default(0),
  daysLate: z.number().default(0),
  daysOnLeave: z.number().default(0),
  month: z.string(),
});

export type TeacherAttendanceSummaryDto = z.infer<typeof TeacherAttendanceSummarySchema>;
