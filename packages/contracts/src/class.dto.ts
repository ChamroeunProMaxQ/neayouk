import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { SemesterEnum, ClassEnrollmentStatusEnum } from "./semester.enum.js";

export const ClassSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  code: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  monthlyFee: z.coerce.number().default(0),
  teacherId: z.coerce.number().nullable().optional(),
  academicYear: z.string().nullable().optional(),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1).optional(),
  capacity: z.coerce.number().default(30),
  status: z.string().default('ACTIVE'),
  studentCount: z.number().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type ClassAttribute = z.infer<typeof ClassSchema>;

export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  code: z.string().optional(),
  gradeLevel: z.string().optional(),
  program: z.string().optional(),
  section: z.string().optional(),
  monthlyFee: z.coerce.number().min(0, "Monthly fee must be positive or zero").default(0),
  teacherId: z.coerce.number().optional(),
  academicYear: z.string().optional(),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1).optional(),
  capacity: z.coerce.number().int().positive().default(30),
  status: z.string().default('ACTIVE').optional(),
});

export type CreateClassAttribute = z.infer<typeof CreateClassSchema>;
export type CreateClassDto = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = CreateClassSchema.partial();

export type UpdateClassAttribute = z.infer<typeof UpdateClassSchema>;
export type UpdateClassDto = z.infer<typeof UpdateClassSchema>;

export const FindClassesSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'name', 'code', 'gradeLevel', 'academicYear', 'updatedAt'], 'id'),
  search: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.enum(SemesterEnum).optional(),
  status: z.string().optional(),
});

export type FindClassesDto = z.infer<typeof FindClassesSchema>;

export const StudentClassEnrollmentSchema = z.object({
  id: z.number().optional(),
  studentId: z.number(),
  classId: z.number(),
  class: ClassSchema.optional(),
  academicYear: z.string(),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  isPrimary: z.boolean().default(true),
  status: z.enum(ClassEnrollmentStatusEnum).default(ClassEnrollmentStatusEnum.ENROLLED),
  enrolledAt: z.date().or(z.string()),
  completedAt: z.date().or(z.string()).nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type StudentClassEnrollmentAttribute = z.infer<typeof StudentClassEnrollmentSchema>;

export const AssignStudentClassesSchema = z.object({
  studentId: z.coerce.number(),
  classIds: z.array(z.coerce.number()).min(1, "At least one class must be selected"),
  primaryClassId: z.coerce.number().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
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
  studentIds: z.array(z.coerce.number()).min(1, "At least one student must be selected"),
  fromClassId: z.coerce.number(),
  toClassId: z.coerce.number(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(SemesterEnum).default(SemesterEnum.SEMESTER_1),
  completePreviousEnrollment: z.boolean().default(true),
  remarks: z.string().optional(),
});

export type BatchPromoteStudentsDto = z.infer<typeof BatchPromoteStudentsSchema>;
