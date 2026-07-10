import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string({
    error: "name is requried",
  }),
  email: z.email({
    error: "email is required",
  }),
  password: z
    .string({
      error: "password is required",
    })
    .min(6, {
      error: "password must be more than 6 charectors",
    }),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
