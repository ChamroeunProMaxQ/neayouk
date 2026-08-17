import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindClassesDto,
  type ResponseDto,
  type ClassAttribute,
  type AcademicYearSummaryItem,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseClassesQueryParams extends Partial<FindClassesDto> {
  enabled?: boolean;
}

export function useClassesQuery(params: UseClassesQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<ClassAttribute[]>, Error>({
    queryKey: ["classes", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.CLASS.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<ClassAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}

export function useClassQuery(id?: number) {
  return useQuery<ResponseDto<ClassAttribute>, Error>({
    queryKey: ["classes", id],
    queryFn: async ({ signal }) => {
      const url = `${API_ROUTE.CLASS.GET.replace(":id", String(id))}`;
      const response = await apiClient.get<ResponseDto<ClassAttribute>>(url, {
        signal,
      });
      return response.data;
    },
    enabled: !!id,
  });
}

export function useClassesInfiniteQuery(params: UseClassesQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<ClassAttribute[]>, Error>({
    queryKey: ["classes", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.CLASS.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<ClassAttribute[]>>(url, {
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

export function useAcademicYearsSummaryQuery() {
  return useQuery<ResponseDto<AcademicYearSummaryItem[]>, Error>({
    queryKey: ["academic-years-summary"],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ResponseDto<AcademicYearSummaryItem[]>>(
        API_ROUTE.CLASS.ACADEMIC_YEARS_SUMMARY,
        { signal }
      );
      return response.data;
    },
  });
}
