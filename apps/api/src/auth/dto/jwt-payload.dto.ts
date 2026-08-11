import type { UserTypeEnum } from '@repo/shared';

export interface JwtPayload {
  sub: number;
  username: string;
  type: UserTypeEnum;
}
