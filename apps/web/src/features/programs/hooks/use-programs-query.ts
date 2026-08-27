import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindProgramsDto,
  type ProgramAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseProgramsQueryParams extends Partial<FindProgramsDto> {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useProgramsQuery(params: UseProgramsQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<ProgramAttribute[]>, Error>({
    queryKey: ["programs", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.PROGRAM.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<ProgramAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

export function useProgramsInfiniteQuery(params: UseProgramsQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<ProgramAttribute[]>, Error>({
    queryKey: ["programs", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.PROGRAM.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<ProgramAttribute[]>>(url, {
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
