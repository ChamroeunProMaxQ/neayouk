import type { PermissionDto, UserTypeEnum } from '@repo/contracts';

declare global {
  namespace Express {
    interface User {
      sub: number;
      id: number;
      username: string;
      type?: UserTypeEnum;
      userType?: UserTypeEnum;
      roles: string[];
      permissions: PermissionDto[];
    }
  }
}

export {};
