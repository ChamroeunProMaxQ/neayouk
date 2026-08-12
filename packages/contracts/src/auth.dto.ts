import z from "zod";

export const LogInSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export type LogInAttribute = z.infer<typeof LogInSchema>;
export type LogInDto = z.infer<typeof LogInSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
