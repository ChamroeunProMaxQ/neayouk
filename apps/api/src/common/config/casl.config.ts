import type { JwtPayload } from "@src/auth/dto/jwt-payload.dto.js";
import { UserTypeEnum } from "@repo/contracts";
import type { Request } from "express";
import { CaslModule, type AuthorizableUser } from "nest-casl";

export interface AppAuthorizableUser extends AuthorizableUser<string, number> {
  id: number;
  roles: string[];
}

export const caslConfig = CaslModule.forRoot<string, AppAuthorizableUser>({
  superuserRole: UserTypeEnum.ADMIN,
  getUserFromRequest: (request) => {
    const user = (request as unknown as Request).user as JwtPayload | undefined;
    if (!user) return undefined;
    const userType = user.userType ?? user.type;
    const roles: string[] = [];

    if (userType === UserTypeEnum.ADMIN) {
      roles.push(UserTypeEnum.ADMIN);
      roles.push('admin');
    }

    if (user.roles && user.roles.length > 0) {
      for (const r of user.roles) {
        roles.push(r);
        roles.push(r.toLowerCase());
        roles.push(r.toUpperCase());
      }
    } else if (userType) {
      roles.push(userType);
      roles.push(userType.toLowerCase());
      roles.push(userType.toUpperCase());
    }

    return {
      id: Number(user.sub),
      roles: Array.from(new Set(roles)),
    };
  },
});