import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { UserSchema } from "./user.dto.js";

export enum StaffDepartmentEnum {
  ACADEMIC = "ACADEMIC",
  ADMINISTRATION = "ADMINISTRATION",
  FINANCE = "FINANCE",
  OPERATIONS = "OPERATIONS",
  MANAGEMENT = "MANAGEMENT",
  IT = "IT",
  LOGISTICS = "LOGISTICS",
  OTHER = "OTHER",
}

export enum StaffEmploymentTypeEnum {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERN = "INTERN",
}

export enum StaffSalaryTypeEnum {
  MONTHLY = "MONTHLY",
  HOURLY = "HOURLY",
}

export enum StaffStatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  TERMINATED = "TERMINATED",
  ARCHIVED = "ARCHIVED",
}

export enum StaffGenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export const StaffSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  branchId: z.number().nullable().optional(),
  userId: z.coerce.number().nullable().optional(),
  staffCode: z.string().nullable().optional(),
  name: z.string(),
  nameKm: z.string().nullable().optional(),
  gender: z.enum(StaffGenderEnum).default(StaffGenderEnum.MALE).optional(),
  dateOfBirth: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  department: z.enum(StaffDepartmentEnum).default(StaffDepartmentEnum.ACADEMIC),
  designation: z.string().default("Teacher"),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  employmentType: z.enum(StaffEmploymentTypeEnum).default(StaffEmploymentTypeEnum.FULL_TIME),
  salaryType: z.enum(StaffSalaryTypeEnum).default(StaffSalaryTypeEnum.MONTHLY),
  baseSalary: z.coerce.number().default(0),
  hourlyRate: z.coerce.number().default(0),
  joiningDate: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  status: z.enum(StaffStatusEnum).default(StaffStatusEnum.ACTIVE),
  notes: z.string().nullable().optional(),
  classCount: z.number().optional(),
  classes: z
    .array(
      z.object({
        id: z.number(),
        uuid: z.string(),
        name: z.string(),
        code: z.string().nullable().optional(),
        gradeLevel: z.string().nullable().optional(),
        section: z.string().nullable().optional(),
        shift: z.string().nullable().optional(),
        room: z.string().nullable().optional(),
        studentCount: z.number().optional(),
      })
    )
    .optional(),
  user: UserSchema.nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type StaffAttribute = z.infer<typeof StaffSchema>;

export const CreateStaffSchema = z.object({
  branchId: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  nameKm: z.string().optional(),
  staffCode: z.string().optional(),
  gender: z.enum(StaffGenderEnum).default(StaffGenderEnum.MALE).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  department: z.enum(StaffDepartmentEnum).default(StaffDepartmentEnum.ACADEMIC).optional(),
  designation: z.string().min(1, "Designation is required").default("Teacher"),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  employmentType: z.enum(StaffEmploymentTypeEnum).default(StaffEmploymentTypeEnum.FULL_TIME).optional(),
  salaryType: z.enum(StaffSalaryTypeEnum).default(StaffSalaryTypeEnum.MONTHLY).optional(),
  baseSalary: z.coerce
    .number()
    .min(0, "Base salary must be non-negative")
    .default(0)
    .optional(),
  hourlyRate: z.coerce
    .number()
    .min(0, "Hourly rate must be non-negative")
    .default(0)
    .optional(),
  joiningDate: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  status: z.enum(StaffStatusEnum).default(StaffStatusEnum.ACTIVE).optional(),
  notes: z.string().optional(),
  userId: z.coerce.number().optional(),
  createAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type CreateStaffAttribute = z.infer<typeof CreateStaffSchema>;
export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = z.object({
  branchId: z.number().nullable().optional(),
  name: z.string().min(1, "Name is required").optional(),
  nameKm: z.string().optional(),
  staffCode: z.string().optional(),
  gender: z.enum(StaffGenderEnum).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  department: z.enum(StaffDepartmentEnum).optional(),
  designation: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  employmentType: z.enum(StaffEmploymentTypeEnum).optional(),
  salaryType: z.enum(StaffSalaryTypeEnum).optional(),
  baseSalary: z.coerce
    .number()
    .min(0, "Base salary must be non-negative")
    .optional(),
  hourlyRate: z.coerce
    .number()
    .min(0, "Hourly rate must be non-negative")
    .optional(),
  joiningDate: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  status: z.enum(StaffStatusEnum).optional(),
  notes: z.string().optional(),
  userId: z.coerce.number().nullable().optional(),
  createAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  unbindUser: z.boolean().optional(),
});

export type UpdateStaffAttribute = z.infer<typeof UpdateStaffSchema>;
export type UpdateStaffDto = z.infer<typeof UpdateStaffSchema>;

const booleanParam = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "" || val === "false" || val === false) {
      return undefined;
    }
    return val === true || val === "true" || val === "1";
  });

export const FindStaffSchema = PaginationSchema.extend({
  ...createSortSchema(
    [
      "id",
      "name",
      "staffCode",
      "department",
      "designation",
      "salaryType",
      "baseSalary",
      "hourlyRate",
      "status",
      "createdAt",
    ],
    "id"
  ),
  search: z.string().optional(),
  branchId: z.coerce.number().optional(),
  name: z.string().optional(),
  department: z.enum(StaffDepartmentEnum).optional(),
  designation: z.string().optional(),
  salaryType: z.enum(StaffSalaryTypeEnum).optional(),
  status: z.enum(StaffStatusEnum).optional(),
  gender: z.enum(StaffGenderEnum).optional(),
  specialization: z.string().optional(),
  hasAccount: booleanParam,
  includeDeleted: booleanParam,
  onlyDeleted: booleanParam,
});

export type FindStaffDto = z.infer<typeof FindStaffSchema>;
