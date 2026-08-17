import { useInfiniteQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type FindTeachersDto,
  type TeacherAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const TEACHER_QUERY_KEYS = {
  all: ["teachers"] as const,
  lists: () => [...TEACHER_QUERY_KEYS.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...TEACHER_QUERY_KEYS.lists(), params] as const,
  details: () => [...TEACHER_QUERY_KEYS.all, "detail"] as const,
  detail: (id: number | string) => [...TEACHER_QUERY_KEYS.details(), id] as const,
  classes: (id: number | string) => [...TEACHER_QUERY_KEYS.detail(id), "classes"] as const,
};

export function useTeachersInfiniteQuery(params: FindTeachersDto) {
  return useInfiniteQuery<ResponseDto<TeacherAttribute[]>>({
    queryKey: TEACHER_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async ({ pageParam = 1 }) => {
      const query = queryString.stringify(
        {
          ...params,
          page: pageParam,
          pageSize: params.pageSize ?? 20,
        },
        { skipNull: true, skipEmptyString: true }
      );

      const response = await apiClient.get<ResponseDto<TeacherAttribute[]>>(
        `${API_ROUTE.TEACHER.LIST}?${query}`
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
