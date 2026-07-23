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
> {}

export const CreateUserSchema: z.ZodType<CreateUserAttribute> = z.object({
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
});

export const FindUsersSchema = PaginationSchema.extend({
  name: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type FindUsersDto = z.infer<typeof FindUsersSchema>;
