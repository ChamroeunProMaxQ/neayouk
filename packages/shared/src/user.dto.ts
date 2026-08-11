import { z } from "zod";
import { PaginationSchema } from "./pagination.dto.js";
import { UserStatusEnum } from "./user-status.enum.js";
import { UserTypeEnum } from "./user-type.enum.js";

export interface UserAttribute {
  id: number;

  uuid: string;

  username: string;

  password: string;

  userType: UserTypeEnum;

  status: UserStatusEnum;

  computedNameId: string;
}

export interface CreateUserAttribute extends Omit<
  UserAttribute,
  "id" | "userType" | "uuid" | "computedNameId" | "status"
> { }

export interface UpdateUserAttribute extends Partial<
  Omit<UserAttribute, "id" | "computedNameId">
> { }

export const CreateUserSchema = z.object({
  username: z.string({
    error: "username is requried",
  }),
  password: z
    .string({
      error: "password is required",
    })
    .min(6, {
      error: "password must be more than 6 charectors",
    }),
  userType: z.string()
}) satisfies z.ZodType<CreateUserAttribute>;

export const UpdateUserSchema = z.object({
  username: z
    .string({
      error: "username is requried",
    })
    .optional(),
  password: z
    .string({
      error: "password is required",
    })
    .min(6, {
      error: "password must be more than 6 charectors",
    })
    .optional(),
  status: z.enum(UserStatusEnum).optional(),
  userType: z.enum(UserTypeEnum),
}) satisfies z.ZodType<UpdateUserAttribute>;

export const FindUsersSchema = PaginationSchema.extend({
  name: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type FindUsersDto = z.infer<typeof FindUsersSchema>;
