import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindUsersDto,
  type ResponseDto,
  type UserAttribute,
} from "@repo/contracts";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import queryString from "query-string";

export interface UseUsersQueryParams extends Partial<FindUsersDto> {
  enabled?: boolean;
}

export function useUsersQuery(params: UseUsersQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const token = useAuthStore((state) => state.token);

  return useQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", queryParams],
    queryFn: async () => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.USER.LIST}?${qs}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to fetch users (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<UserAttribute[]>;
    },
    enabled,
  });
}

export function useUsersInfiniteQuery(params: UseUsersQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;
  const token = useAuthStore((state) => state.token);

  return useInfiniteQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1 }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.USER.LIST}?${qs}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to fetch users (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<UserAttribute[]>;
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

