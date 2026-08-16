import { type FC, type ReactNode } from "react";
import type { UserTypeEnum } from "@repo/contracts";
import { usePermission } from "../hooks/use-permission";

export interface PermissionGateProps {
  action?: string;
  resource?: string;
  role?: string | string[];
  userType?: UserTypeEnum | UserTypeEnum[] | string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate: FC<PermissionGateProps> = ({
  action,
  resource,
  role,
  userType,
  fallback = null,
  children,
}) => {
  const { can, hasRole, isUserType } = usePermission();

  if (action && resource && !can(action, resource)) {
    return <>{fallback}</>;
  }

  if (role) {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    if (!hasRole(...rolesToCheck)) {
      return <>{fallback}</>;
    }
  }

  if (userType) {
    const typesToCheck = Array.isArray(userType) ? userType : [userType];
    if (!isUserType(...typesToCheck)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
