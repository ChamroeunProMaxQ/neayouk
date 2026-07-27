import { TokenStatusEnum, TokenTypeEnum } from "./token.enum.js";

export interface UserTokenAttribute {
  id: number;
  token: string;
  tokenType: TokenTypeEnum;
  expDate: Date;
  status: TokenStatusEnum;
  userId: number;
}

export interface CreateUserTokenDto extends Omit<UserTokenAttribute, "id"> {}
