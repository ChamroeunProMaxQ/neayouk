import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindRolesDto,
  type ResponseDto,
  type RoleDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseRolesQueryParams extends Partial<FindRolesDto> {
  enabled?: boolean;
}

export const ROLE_KEYS = {
  all: ["roles"] as const,
  lists: () => [...ROLE_KEYS.all, "list"] as const,
  list: (params: UseRolesQueryParams) => [...ROLE_KEYS.lists(), params] as const,
  infinite: (params: UseRolesQueryParams) => [...ROLE_KEYS.all, "infinite", params] as const,
  details: () => [...ROLE_KEYS.all, "detail"] as const,
  detail: (id: number) => [...ROLE_KEYS.details(), id] as const,
};

export function useRolesQuery(params: UseRolesQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<RoleDto[]>, Error>({
    queryKey: ROLE_KEYS.list(queryParams),
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.ROLE.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<RoleDto[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

export function useRolesInfiniteQuery(params: UseRolesQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<RoleDto[]>, Error>({
    queryKey: ROLE_KEYS.infinite({ pageSize, ...queryParams }),
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.ROLE.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<RoleDto[]>>(url, {
        signal,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      const { page, totalPage } = pagination;
      if (page >= totalPage) return undefined;
      return page + 1;
    },
    enabled,
  });
}

// Backward-compatible alias
export const useInfiniteRolesQuery = useRolesInfiniteQuery;

export function useRoleDetailQuery(id: number | null | undefined) {
  return useQuery<RoleDto, Error>({
    queryKey: ROLE_KEYS.detail(id ?? 0),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Role ID is required");
      const url = API_ROUTE.ROLE.GET.replace(":id", String(id));
      const response = await apiClient.get<ResponseDto<RoleDto>>(url, { signal });
      if (!response.data.data) {
        throw new Error("Role not found");
      }
      return response.data.data;
    },
    enabled: Boolean(id && id > 0),
  });
}
