import type { JwtPayload } from "@src/auth/dto/jwt-payload.dto.js";
import { UserTypeEnum, type PermissionDto } from "@repo/contracts";
import type { Request } from "express";
import { CaslModule, type AuthorizableUser } from "nest-casl";

export interface AppAuthorizableUser extends AuthorizableUser<string, number> {
  id: number;
  roles: string[];
  userType?: UserTypeEnum;
  permissions?: PermissionDto[];
}

export const caslConfig = CaslModule.forRoot<string, AppAuthorizableUser>({
  superuserRole: UserTypeEnum.ADMIN,
  getUserFromRequest: (request) => {
    const user = (request as unknown as Request).user as JwtPayload | undefined;
    if (!user) return undefined;
    const userType = user.userType ?? user.type;
    const roles: string[] = [];

    if (userType) {
      roles.push(userType);
      roles.push(userType.toUpperCase());
    }

    if (user.roles && user.roles.length > 0) {
      for (const r of user.roles) {
        roles.push(r);
        roles.push(r.toLowerCase());
        roles.push(r.toUpperCase());
      }
    }

    return {
      id: Number(user.sub),
      roles: Array.from(new Set(roles)),
      userType,
      permissions: user.permissions ?? [],
    };
  },
});