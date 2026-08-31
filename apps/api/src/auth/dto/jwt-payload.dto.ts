import type { PermissionDto, UserTypeEnum } from '@repo/contracts';

export interface JwtPayload {
  sub: number;
  username: string;
  type?: UserTypeEnum;
  userType?: UserTypeEnum;
  branchId?: number | null;
  roles?: string[];
  permissions?: PermissionDto[];
  iat?: number;
  exp?: number;
}
