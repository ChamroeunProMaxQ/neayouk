import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import {
  SemesterEnum,
  ClassEnrollmentStatusEnum,
  ShiftEnum,
  DayOfWeekEnum,
} from "./semester.enum.js";
import { ProgramSchema } from "./program.dto.js";

export const ClassSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  programId: z.coerce.number().nullable().optional(),
  programName: z.string().nullable().optional(),
  program: z.string().or(ProgramSchema).nullable().optional(),
  section: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  shift: z.enum(ShiftEnum).default(ShiftEnum.MORNING).optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  startDate: z.string().or(z.date()).nullable().optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  monthlyFee: z.coerce.number().default(0),
  teacherId: z.coerce.number().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  teacher: z
    .object({
      id: z.number(),
      name: z.string(),
      teacherCode: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  academicYear: z.string().nullable().optional(),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1).optional(),
  status: z.string().default("ACTIVE"),
  studentCount: z.number().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type ClassAttribute = z.infer<typeof ClassSchema>;

export const CreateClassSchema = z
  .object({
    name: z.string().min(1, "Class name is required"),
    code: z.string().optional(),
    gradeLevel: z.string().optional(),
    programId: z.coerce.number().optional(),
    program: z.string().optional(),
    section: z.string().optional(),
    room: z.string().optional(),
    shift: z.enum(ShiftEnum).default(ShiftEnum.MORNING).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    monthlyFee: z.coerce
      .number()
      .min(0, "Monthly fee must be positive or zero")
      .default(0),
    teacherId: z.coerce.number().optional(),
    academicYear: z.string().optional(),
    semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1).optional(),
    status: z.string().default("ACTIVE").optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

export type CreateClassAttribute = z.infer<typeof CreateClassSchema>;
export type CreateClassDto = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = z
  .object({
    name: z.string().min(1, "Class name is required").optional(),
    code: z.string().optional(),
    gradeLevel: z.string().optional(),
    programId: z.coerce.number().optional(),
    program: z.string().optional(),
    section: z.string().optional(),
    room: z.string().optional(),
    shift: z.enum(ShiftEnum).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    monthlyFee: z.coerce
      .number()
      .min(0, "Monthly fee must be positive or zero")
      .optional(),
    teacherId: z.coerce.number().optional(),
    academicYear: z.string().optional(),
    semester: z.enum(SemesterEnum).optional(),
    status: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

export type UpdateClassAttribute = z.infer<typeof UpdateClassSchema>;
export type UpdateClassDto = z.infer<typeof UpdateClassSchema>;

export const FindClassesSchema = PaginationSchema.extend({
  ...createSortSchema(
    [
      "id",
      "name",
      "code",
      "gradeLevel",
      "program",
      "shift",
      "academicYear",
      "semester",
      "updatedAt",
    ],
    "id",
  ),
  search: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.enum(SemesterEnum).optional(),
  shift: z.enum(ShiftEnum).optional(),
  gradeLevel: z.string().optional(),
  programId: z.coerce.number().optional(),
  program: z.string().optional(),
  status: z.string().optional(),
  teacherId: z.coerce.number().optional(),
});

export type FindClassesDto = z.infer<typeof FindClassesSchema>;

export const StudentClassEnrollmentSchema = z.object({
  id: z.number().optional(),
  studentId: z.number(),
  classId: z.number(),
  class: ClassSchema.optional(),
  student: z
    .object({
      id: z.number().optional(),
      uuid: z.string().optional(),
      studentCode: z.string().nullable().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      firstNameKm: z.string().nullable().optional(),
      lastNameKm: z.string().nullable().optional(),
      gender: z.string().optional(),
      status: z.string().optional(),
    })
    .passthrough()
    .optional(),
  academicYear: z.string(),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  isPrimary: z.boolean().default(true),
  status: z
    .enum(ClassEnrollmentStatusEnum)
    .default(ClassEnrollmentStatusEnum.ENROLLED),
  enrolledAt: z.date().or(z.string()),
  completedAt: z.date().or(z.string()).nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type StudentClassEnrollmentAttribute = z.infer<
  typeof StudentClassEnrollmentSchema
>;

export const AssignStudentClassesSchema = z.object({
  studentId: z.coerce.number(),
  classIds: z.array(z.coerce.number()).min(1, "At least one class must be selected"),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  primaryClassId: z.coerce.number().optional(),
  isPrimaryIndex: z.number().default(0).optional(),
});

export type AssignStudentClassesDto = z.infer<typeof AssignStudentClassesSchema>;

export const PromoteStudentSchema = z.object({
  studentId: z.coerce.number(),
  fromClassId: z.coerce.number(),
  toClassId: z.coerce.number(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  completePreviousEnrollment: z.boolean().default(true),
  remarks: z.string().optional(),
});

export type PromoteStudentDto = z.infer<typeof PromoteStudentSchema>;

export const BatchPromoteStudentsSchema = z.object({
  studentIds: z
    .array(z.coerce.number())
    .min(1, "At least one student must be selected"),
  fromClassId: z.coerce.number(),
  toClassId: z.coerce.number(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  completePreviousEnrollment: z.boolean().default(true),
  remarks: z.string().optional(),
});

export type BatchPromoteStudentsDto = z.infer<typeof BatchPromoteStudentsSchema>;

// Timetable Schemas
export const ClassTimetableSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  classId: z.number(),
  dayOfWeek: z.enum(DayOfWeekEnum),
  subject: z.string(),
  subjectCode: z.string().nullable().optional(),
  teacherId: z.coerce.number().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  startTime: z.string(),
  endTime: z.string(),
  colorTag: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type ClassTimetableAttribute = z.infer<typeof ClassTimetableSchema>;

export const CreateClassTimetableSchema = z
  .object({
    classId: z.coerce.number().optional(),
    dayOfWeek: z.enum(DayOfWeekEnum),
    subject: z.string().min(1, "Subject name is required"),
    subjectCode: z.string().optional(),
    teacherId: z.coerce.number().optional(),
    teacherName: z.string().optional(),
    room: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    colorTag: z.string().default("#45AC5E").optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateClassTimetableDto = z.infer<typeof CreateClassTimetableSchema>;

export const UpdateClassTimetableSchema = z
  .object({
    dayOfWeek: z.enum(DayOfWeekEnum).optional(),
    subject: z.string().min(1, "Subject name is required").optional(),
    subjectCode: z.string().optional(),
    teacherId: z.coerce.number().optional(),
    teacherName: z.string().optional(),
    room: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    colorTag: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type UpdateClassTimetableDto = z.infer<typeof UpdateClassTimetableSchema>;

export const FindClassTimetablesSchema = z.object({
  classId: z.coerce.number().optional(),
  dayOfWeek: z.enum(DayOfWeekEnum).optional(),
  teacherId: z.coerce.number().optional(),
  room: z.string().optional(),
});

export type FindClassTimetablesDto = z.infer<typeof FindClassTimetablesSchema>;

export const AcademicYearSummaryItemSchema = z.object({
  academicYear: z.string(),
  semester: z.string(),
  classCount: z.number(),
  studentCount: z.number(),
});

export type AcademicYearSummaryItem = z.infer<typeof AcademicYearSummaryItemSchema>;

