import { z } from "zod";
import { PermissionSchema } from "./permission.dto.js";
import { PaginationSchema } from "./pagination.dto.js";

export const RolePermissionInputSchema = z.object({
  resource: z.string().min(1, "resource is required"),
  action: z.string().min(1, "action is required"),
  description: z.string().optional().nullable(),
});

export type RolePermissionInputDto = z.infer<typeof RolePermissionInputSchema>;

export const RoleSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1, "slug is required"),
  description: z.string().optional().nullable(),
  permissions: z.array(PermissionSchema).optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type RoleDto = z.infer<typeof RoleSchema>;

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1, "slug is required"),
  description: z.string().optional(),
  permissions: z.array(RolePermissionInputSchema).optional(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  slug: z.string().min(1, "slug is required").optional(),
  description: z.string().optional(),
  permissions: z.array(RolePermissionInputSchema).optional(),
});

export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;

export const FindRolesSchema = PaginationSchema.extend({
  sortBy: z.enum(['id', 'name', 'slug', 'updatedAt']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  search: z.string().optional(),
});

export type FindRolesDto = z.infer<typeof FindRolesSchema>;

export const StandardRoles = {
  ADMIN: "admin",
  CMS: "cms",
  TEACHER: "teacher",
  STAFF: "staff",
  STUDENT: "student",
  CUSTOMER: "customer",
} as const;
