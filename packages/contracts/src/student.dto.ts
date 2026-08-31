import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { StudentStatusEnum } from "./student-status.enum.js";
import { ClassSchema, StudentClassEnrollmentSchema } from "./class.dto.js";
import { StudentPaymentSummarySchema } from "./student-payment.dto.js";
import { PaymentStatusEnum } from "./payment-status.enum.js";

const booleanParam = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "" || val === "false" || val === false) {
      return undefined;
    }
    return val === true || val === "true" || val === "1";
  });

export const StudentSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  branchId: z.number().nullable().optional(),
  studentCode: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  firstNameKm: z.string().nullable().optional(),
  lastNameKm: z.string().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  dateOfBirth: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianPhone: z.string().nullable().optional(),
  payableDate: z.coerce.number().min(1).max(31).default(1).optional(),
  registeredAt: z.date().or(z.string()).optional(),
  discount: z.coerce.number().default(0),
  status: z.nativeEnum(StudentStatusEnum).default(StudentStatusEnum.ACTIVE),
  enrollments: z.array(StudentClassEnrollmentSchema).optional(),
  classes: z.array(ClassSchema).optional(),
  primaryClass: ClassSchema.nullable().optional(),
  paymentSummary: StudentPaymentSummarySchema.optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type StudentAttribute = z.infer<typeof StudentSchema>;

export const CreateStudentSchema = z.object({
  branchId: z.number().optional(),
  studentCode: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  firstNameKm: z.string().optional(),
  lastNameKm: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  dateOfBirth: z.string().optional(),
  contact: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  payableDate: z.coerce.number().int().min(1).max(31).default(1).optional(),
  registeredAt: z.date().or(z.string()).optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0).optional(),
  status: z.nativeEnum(StudentStatusEnum).default(StudentStatusEnum.ACTIVE).optional(),
  classIds: z.array(z.coerce.number()).optional(),
  primaryClassId: z.coerce.number().optional(),
});

export type CreateStudentAttribute = z.infer<typeof CreateStudentSchema>;
export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = CreateStudentSchema.partial();

export type UpdateStudentAttribute = z.infer<typeof UpdateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;

export const FindStudentsSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'studentCode', 'firstName', 'lastName', 'discount', 'status', 'registeredAt', 'updatedAt'], 'id'),
  search: z.string().optional(),
  branchId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  status: z.enum(StudentStatusEnum).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  paymentStatus: z.enum(PaymentStatusEnum).optional(),
  billingYear: z.coerce.number().optional(),
  billingMonth: z.coerce.number().optional(),
  includeDeleted: booleanParam,
  onlyDeleted: booleanParam,
});

export type FindStudentsDto = z.infer<typeof FindStudentsSchema>;

export const StudentWithSummarySchema = StudentSchema.extend({
  summary: StudentPaymentSummarySchema.optional(),
});

export type StudentWithSummary = z.infer<typeof StudentWithSummarySchema>;
