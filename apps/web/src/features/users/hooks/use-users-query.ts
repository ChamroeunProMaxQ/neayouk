import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindUsersDto,
  type ResponseDto,
  type UserAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseUsersQueryParams extends Partial<FindUsersDto> {
  enabled?: boolean;
}

export function useUsersQuery(params: UseUsersQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.USER.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<UserAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

export function useUsersInfiniteQuery(params: UseUsersQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.USER.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<UserAttribute[]>>(url, {
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

