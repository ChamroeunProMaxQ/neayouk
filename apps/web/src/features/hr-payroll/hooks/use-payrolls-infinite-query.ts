import { useInfiniteQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type FindPayrollsDto,
  type PayrollAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const PAYROLL_QUERY_KEYS = {
  all: ["payrolls"] as const,
  lists: () => [...PAYROLL_QUERY_KEYS.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...PAYROLL_QUERY_KEYS.lists(), params] as const,
  summary: (params: { year?: number; month?: number }) =>
    [...PAYROLL_QUERY_KEYS.all, "summary", params] as const,
  details: () => [...PAYROLL_QUERY_KEYS.all, "detail"] as const,
  detail: (id: number | string) =>
    [...PAYROLL_QUERY_KEYS.details(), id] as const,
};

export function usePayrollsInfiniteQuery(params: FindPayrollsDto) {
  return useInfiniteQuery<ResponseDto<PayrollAttribute[]>>({
    queryKey: PAYROLL_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async ({ pageParam = 1 }) => {
      const query = queryString.stringify(
        {
          ...params,
          page: pageParam,
          pageSize: params.pageSize ?? 20,
        },
        { skipNull: true, skipEmptyString: true }
      );

      const response = await apiClient.get<ResponseDto<PayrollAttribute[]>>(
        `${API_ROUTE.HR.PAYROLL_LIST}?${query}`
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
