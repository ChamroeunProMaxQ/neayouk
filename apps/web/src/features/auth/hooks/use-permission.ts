import { useCallback, useMemo } from "react";
import {
  hasPermission as checkHasPermission,
  hasRole as checkHasRole,
  isUserType as checkIsUserType,
  UserTypeEnum,
  type PermissionDto,
} from "@repo/contracts";
import { useAuthUser } from "../stores/use-auth-store";

export function usePermission() {
  const user = useAuthUser();

  const userType = user?.userType ?? user?.type;

  const roles = useMemo<string[]>(() => {
    if (user?.roles && user.roles.length > 0) {
      return user.roles;
    }
    if (userType) {
      return [userType.toLowerCase()];
    }
    return [];
  }, [user?.roles, userType]);

  const permissions = useMemo<PermissionDto[]>(() => {
    return user?.permissions ?? [];
  }, [user?.permissions]);

  const isAdmin = useMemo<boolean>(() => {
    if (userType === UserTypeEnum.ADMIN || userType === "ADMIN") return true;
    return roles.some((r) => r.toLowerCase() === "admin");
  }, [userType, roles]);

  const can = useCallback(
    (action: string, resource: string): boolean => {
      if (isAdmin) return true;
      return checkHasPermission(permissions, action, resource);
    },
    [isAdmin, permissions]
  );

  const hasRole = useCallback(
    (...requiredRoles: string[]): boolean => {
      if (isAdmin) return true;
      return checkHasRole(roles, ...requiredRoles);
    },
    [isAdmin, roles]
  );

  const isUserType = useCallback(
    (...allowedTypes: (UserTypeEnum | string)[]): boolean => {
      return checkIsUserType(userType, ...allowedTypes);
    },
    [userType]
  );

  return {
    user,
    userType,
    roles,
    permissions,
    isAdmin,
    can,
    hasRole,
    isUserType,
  };
}
