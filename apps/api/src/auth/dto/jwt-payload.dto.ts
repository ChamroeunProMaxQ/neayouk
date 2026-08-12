import type { UserTypeEnum } from '@repo/contracts';

export interface JwtPayload {
  sub: number;
  username: string;
  type: UserTypeEnum;
}
