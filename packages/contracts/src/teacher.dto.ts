import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { UserSchema } from "./user.dto.js";

export enum TeacherStatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  ARCHIVED = "ARCHIVED",
}

export enum TeacherGenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export const TeacherSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  userId: z.coerce.number().nullable().optional(),
  teacherCode: z.string().nullable().optional(),
  name: z.string(),
  nameKm: z.string().nullable().optional(),
  gender: z.enum(TeacherGenderEnum).default(TeacherGenderEnum.MALE).optional(),
  dateOfBirth: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  salaryInHour: z.coerce.number().default(0),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  status: z.string().default("ACTIVE"),
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

export type TeacherAttribute = z.infer<typeof TeacherSchema>;

export const CreateTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameKm: z.string().optional(),
  teacherCode: z.string().optional(),
  gender: z.enum(TeacherGenderEnum).default(TeacherGenderEnum.MALE).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  salaryInHour: z.coerce
    .number()
    .min(0, "Hourly salary must be non-negative")
    .default(0)
    .optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  status: z.string().default("ACTIVE").optional(),
  userId: z.coerce.number().optional(),
  createAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type CreateTeacherAttribute = z.infer<typeof CreateTeacherSchema>;
export type CreateTeacherDto = z.infer<typeof CreateTeacherSchema>;

export const UpdateTeacherSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  nameKm: z.string().optional(),
  teacherCode: z.string().optional(),
  gender: z.enum(TeacherGenderEnum).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  salaryInHour: z.coerce
    .number()
    .min(0, "Hourly salary must be non-negative")
    .optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  status: z.string().optional(),
  userId: z.coerce.number().nullable().optional(),
  createAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  unbindUser: z.boolean().optional(),
});

export type UpdateTeacherAttribute = z.infer<typeof UpdateTeacherSchema>;
export type UpdateTeacherDto = z.infer<typeof UpdateTeacherSchema>;

const booleanParam = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "" || val === "false" || val === false) {
      return undefined;
    }
    return val === true || val === "true" || val === "1";
  });

export const FindTeachersSchema = PaginationSchema.extend({
  ...createSortSchema(["id", "name", "teacherCode", "salaryInHour", "status", "createdAt"], "id"),
  search: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  gender: z.enum(TeacherGenderEnum).optional(),
  specialization: z.string().optional(),
  hasAccount: booleanParam,
  includeDeleted: booleanParam,
  onlyDeleted: booleanParam,
});

export type FindTeachersDto = z.infer<typeof FindTeachersSchema>;
