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

  const isSuperAdmin = useMemo<boolean>(() => {
    if (userType === UserTypeEnum.SUPER_ADMIN || userType === "SUPER_ADMIN") return true;
    return roles.some((r) => r.toLowerCase() === "super_admin" || r.toLowerCase() === "superadmin");
  }, [userType, roles]);

  const isAdmin = useMemo<boolean>(() => {
    if (isSuperAdmin) return true;
    if (userType === UserTypeEnum.ADMIN || userType === "ADMIN") return true;
    return roles.some((r) => r.toLowerCase() === "admin");
  }, [isSuperAdmin, userType, roles]);

  const can = useCallback(
    (action: string, resource: string): boolean => {
      if (isSuperAdmin || isAdmin) return true;
      return checkHasPermission(permissions, action, resource);
    },
    [isSuperAdmin, isAdmin, permissions]
  );

  const hasRole = useCallback(
    (...requiredRoles: string[]): boolean => {
      if (isSuperAdmin || isAdmin) return true;
      return checkHasRole(roles, ...requiredRoles);
    },
    [isSuperAdmin, isAdmin, roles]
  );

  const isUserType = useCallback(
    (...allowedTypes: (UserTypeEnum | string)[]): boolean => {
      if (isSuperAdmin) return true;
      return checkIsUserType(userType, ...allowedTypes);
    },
    [isSuperAdmin, userType]
  );

  return {
    user,
    userType,
    roles,
    permissions,
    isSuperAdmin,
    isAdmin,
    can,
    hasRole,
    isUserType,
  };
}
