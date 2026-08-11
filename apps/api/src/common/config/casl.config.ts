import type { JwtPayload } from "@app/src/auth/dto/jwt-payload.dto.js";
import { UserTypeEnum } from "@repo/shared";
import type { Request } from "express";
import { CaslModule, type AuthorizableUser } from "nest-casl";

export const caslConfig = CaslModule.forRoot<UserTypeEnum, AuthorizableUser<UserTypeEnum, number>>({
    superuserRole: UserTypeEnum.ADMIN,
    getUserFromRequest: (request) => {
        const user = (request as unknown as Request).user as JwtPayload | undefined;
        if (!user) return undefined;
        return {
            id: Number(user.sub),
            roles: [user.type as UserTypeEnum],
        };
    },
});