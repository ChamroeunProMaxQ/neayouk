import { z } from "zod";
import { DefaultActions } from "./action.enum.js";
import { ResourceEnum } from "./resource.enum.js";
import { UserTypeEnum } from "./user-type.enum.js";
import { PaginationSchema } from "./pagination.dto.js";

export const PermissionSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  resource: z.string(),
  action: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type PermissionDto = z.infer<typeof PermissionSchema>;
export type PermissionAttribute = PermissionDto;

export const CreatePermissionSchema = z.object({
  resource: z.string().min(1, "resource is required"),
  action: z.string().min(1, "action is required"),
  description: z.string().optional(),
});

export type CreatePermissionDto = z.infer<typeof CreatePermissionSchema>;

export const UpdatePermissionSchema = z.object({
  resource: z.string().min(1, "resource is required").optional(),
  action: z.string().min(1, "action is required").optional(),
  description: z.string().optional(),
});

export type UpdatePermissionDto = z.infer<typeof UpdatePermissionSchema>;

export const FindPermissionsSchema = PaginationSchema.extend({
  sortBy: z.enum(['id', 'resource', 'action', 'updatedAt']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  resource: z.string().optional(),
  search: z.string().optional(),
});

export type FindPermissionsDto = z.infer<typeof FindPermissionsSchema>;

/**
 * Checks whether an array of permissions includes permission for the given action and resource.
 * Supports wildcard matching for 'manage' action and 'all' resource.
 */
export function hasPermission(
  permissions: PermissionDto[] | undefined | null,
  action: string,
  resource: string
): boolean {
  if (!permissions || permissions.length === 0) {
    return false;
  }

  return permissions.some((p) => {
    const isResourceMatch = p.resource === ResourceEnum.ALL || p.resource === resource || p.resource === "*";
    const isActionMatch = p.action === DefaultActions.manage || p.action === action || p.action === "*";
    return isResourceMatch && isActionMatch;
  });
}

/**
 * Checks whether a user possesses any of the specified roles.
 */
export function hasRole(
  userRoles: string[] | undefined | null,
  ...requiredRoles: string[]
): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  const roleSet = new Set(userRoles.map((r) => r.toLowerCase()));
  return requiredRoles.some((r) => roleSet.has(r.toLowerCase()));
}

/**
 * Checks whether a user type matches any of the allowed user types.
 */
export function isUserType(
  userType: UserTypeEnum | string | undefined | null,
  ...allowedTypes: (UserTypeEnum | string)[]
): boolean {
  if (!userType) return false;

  // If user is CUSTOMER and allowedTypes has PORTAL_USER (or vice-versa), treat as matched
  return allowedTypes.some((type) => {
    if (userType === type) return true;
    if (userType === UserTypeEnum.CUSTOMER && type === UserTypeEnum.PORTAL_USER) return true;
    if (userType === UserTypeEnum.PORTAL_USER && type === UserTypeEnum.CUSTOMER) return true;
    return false;
  });
}
