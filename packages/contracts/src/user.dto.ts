import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { UserStatusEnum } from "./user-status.enum.js";
import { UserTypeEnum } from "./user-type.enum.js";

export const UserSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  username: z.string(),
  password: z.string(),
  userType: z.enum(UserTypeEnum),
  status: z.enum(UserStatusEnum),
  computedNameId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type UserAttribute = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(6, "password must be at least 6 characters"),
  status: z.enum(UserStatusEnum).optional(),
  userType: z.enum(UserTypeEnum).optional(),
});

export type CreateUserAttribute = z.infer<typeof CreateUserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().min(1, "username is required").optional(),
  password: z.string().min(6, "password must be at least 6 characters").optional(),
  status: z.enum(UserStatusEnum).optional(),
  userType: z.enum(UserTypeEnum).optional(),
});

export type UpdateUserAttribute = z.infer<typeof UpdateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

const booleanParam = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "" || val === "false" || val === false) {
      return undefined;
    }
    return val === true || val === "true" || val === "1";
  });

export const FindUsersSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'updatedAt', 'username'], 'id'),
  search: z.string().optional(),
  userType: z.enum(UserTypeEnum).optional(),
  includeDeleted: booleanParam,
  onlyDeleted: booleanParam
});

export type FindUsersDto = z.infer<typeof FindUsersSchema>;
