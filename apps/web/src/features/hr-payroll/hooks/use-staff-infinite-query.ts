import { useInfiniteQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type FindStaffDto,
  type StaffAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const STAFF_QUERY_KEYS = {
  all: ["staff"] as const,
  lists: () => [...STAFF_QUERY_KEYS.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...STAFF_QUERY_KEYS.lists(), params] as const,
  details: () => [...STAFF_QUERY_KEYS.all, "detail"] as const,
  detail: (id: number | string) =>
    [...STAFF_QUERY_KEYS.details(), id] as const,
};

export function useStaffInfiniteQuery(params: Partial<FindStaffDto> = {}) {
  return useInfiniteQuery<ResponseDto<StaffAttribute[]>>({
    queryKey: STAFF_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async ({ pageParam = 1 }) => {
      const query = queryString.stringify(
        {
          ...params,
          page: pageParam,
          pageSize: params.pageSize ?? 20,
        },
        { skipNull: true, skipEmptyString: true }
      );

      const response = await apiClient.get<ResponseDto<StaffAttribute[]>>(
        `${API_ROUTE.HR.STAFF_LIST}?${query}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      const { page, totalPage } = pagination;
      return page < totalPage ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
