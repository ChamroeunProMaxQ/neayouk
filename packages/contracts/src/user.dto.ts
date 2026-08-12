import { z } from "zod";
import { PaginationSchema } from "./pagination.dto.js";
import { UserStatusEnum } from "./user-status.enum.js";
import { UserTypeEnum } from "./user-type.enum.js";

export const UserSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  username: z.string(),
  password: z.string(),
  userType: z.nativeEnum(UserTypeEnum),
  status: z.nativeEnum(UserStatusEnum),
  computedNameId: z.string(),
});

export type UserAttribute = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(6, "password must be at least 6 characters"),
});

export type CreateUserAttribute = z.infer<typeof CreateUserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().min(1, "username is required").optional(),
  password: z.string().min(6, "password must be at least 6 characters").optional(),
  status: z.nativeEnum(UserStatusEnum).optional(),
  userType: z.nativeEnum(UserTypeEnum).optional(),
});

export type UpdateUserAttribute = z.infer<typeof UpdateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const FindUsersSchema = PaginationSchema.extend({
  name: z.string().optional(),
});

export type FindUsersDto = z.infer<typeof FindUsersSchema>;
