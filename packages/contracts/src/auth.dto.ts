import { z } from "zod";
import { UserTypeEnum } from "./user-type.enum.js";
import { PermissionSchema } from "./permission.dto.js";

export const LogInSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const LogInResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthUserSchema = z.object({
  id: z.number().optional(),
  sub: z.number().optional(),
  username: z.string(),
  userType: z.nativeEnum(UserTypeEnum).optional(),
  type: z.nativeEnum(UserTypeEnum).optional(),
  roles: z.array(z.string()).default([]),
  permissions: z.array(PermissionSchema).default([]),
});

export type LogInAttribute = z.infer<typeof LogInSchema>;
export type LogInDto = z.infer<typeof LogInSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type LogInResponseDto = z.infer<typeof LogInResponseSchema>;
export type AuthUserDto = z.infer<typeof AuthUserSchema>;
