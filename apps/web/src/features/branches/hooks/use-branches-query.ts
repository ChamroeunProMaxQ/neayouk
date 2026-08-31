import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type BranchDto,
  type FindBranchesDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { usePermission } from "@/features/auth";
import queryString from "query-string";

export interface UseBranchesQueryParams extends Partial<FindBranchesDto> {
  enabled?: boolean;
}

/**
 * Fetches branches based on the user's role:
 * - SuperAdmin: calls /api/v1/superadmin/branches (or /api/v1/admin/branches) to manage all branches.
 * - Admin/CMS/scoped users: calls /api/v1/admin/branches to access their assigned branch.
 */
export function useBranchesQuery(params: UseBranchesQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const { isSuperAdmin } = usePermission();

  return useQuery<ResponseDto<BranchDto[]>, Error>({
    queryKey: ["branches", { ...queryParams, isSuperAdmin }],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const baseUrl = isSuperAdmin
        ? API_ROUTE.SUPERADMIN.BRANCHES
        : API_ROUTE.BRANCH.LIST;
      const url = qs ? `${baseUrl}?${qs}` : baseUrl;
      const response = await apiClient.get<ResponseDto<BranchDto[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

/**
 * Fetches the current logged-in user's assigned branch details.
 */
export function useCurrentBranchQuery(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const { user, isSuperAdmin } = usePermission();

  return useQuery<ResponseDto<BranchDto>, Error>({
    queryKey: ["branches", "current", user?.branchId],
    queryFn: async ({ signal }) => {
      const url = API_ROUTE.BRANCH.CURRENT;
      const response = await apiClient.get<ResponseDto<BranchDto>>(url, {
        signal,
      });
      return response.data;
    },
    enabled: enabled && (Boolean(user?.branchId) || isSuperAdmin),
  });
}
