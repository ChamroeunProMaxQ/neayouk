import z from "zod";

export interface LogInAttribute {
  username: string;
  password: string;
}

export const RefreshTokenSchema = z.object({
  refreshToken: z.string({
    error: "refreshToken is require",
  }),
});

export const LogInSchema: z.ZodType<LogInAttribute> = z.object({
  username: z.string({
    error: "username is require",
  }),
  password: z.string({
    error: "password is require",
  }),
});

export type LogInDto = z.infer<typeof LogInSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
