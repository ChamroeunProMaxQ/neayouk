import { z } from "zod";
import { TokenStatusEnum, TokenTypeEnum } from "./token.enum.js";

export const UserTokenSchema = z.object({
  id: z.number(),
  token: z.string(),
  tokenType: z.nativeEnum(TokenTypeEnum),
  expDate: z.date(),
  status: z.nativeEnum(TokenStatusEnum),
  userId: z.number(),
});

export type UserTokenAttribute = z.infer<typeof UserTokenSchema>;

export const CreateUserTokenSchema = UserTokenSchema.omit({ id: true });
export type CreateUserTokenDto = z.infer<typeof CreateUserTokenSchema>;
