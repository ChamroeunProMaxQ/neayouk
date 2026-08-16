import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindStudentsDto,
  type ResponseDto,
  type StudentAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseStudentsQueryParams extends Partial<FindStudentsDto> {
  enabled?: boolean;
}

export function useStudentsQuery(params: UseStudentsQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<StudentAttribute[]>, Error>({
    queryKey: ["students", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.STUDENT.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<StudentAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

export function useStudentsInfiniteQuery(params: UseStudentsQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<StudentAttribute[]>, Error>({
    queryKey: ["students", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.STUDENT.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<StudentAttribute[]>>(url, {
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
