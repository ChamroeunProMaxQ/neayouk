import { type FC, type ReactNode } from "react";
import { usePermission } from "@/features/auth";
import { ForbiddenPage } from "./forbidden-page";
import type { UserTypeEnum } from "@repo/contracts";

interface PermissionRouteProps {
  action?: string;
  resource?: string;
  requiredUserType?: UserTypeEnum | string;
  children: ReactNode;
}

export const PermissionRoute: FC<PermissionRouteProps> = ({
  action,
  resource,
  requiredUserType,
  children,
}) => {
  const { can, isUserType } = usePermission();

  if (requiredUserType && !isUserType(requiredUserType)) {
    return <ForbiddenPage />;
  }

  if (action && resource && !can(action, resource)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};
