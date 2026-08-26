import { useQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type TeacherAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { TEACHER_QUERY_KEYS } from "./use-teachers-infinite-query";

export function useTeachersQuery(params?: { status?: string; search?: string }) {
  return useQuery<TeacherAttribute[]>({
    queryKey: [...TEACHER_QUERY_KEYS.lists(), "simple", params ?? {}],
    queryFn: async () => {
      const query = queryString.stringify(
        {
          pageSize: 100,
          status: params?.status,
          search: params?.search,
        },
        { skipNull: true, skipEmptyString: true }
      );

      const response = await apiClient.get<ResponseDto<TeacherAttribute[]>>(
        `${API_ROUTE.TEACHER.LIST}?${query}`
      );
      return response.data.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}
