import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type TeacherAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { TEACHER_QUERY_KEYS } from "./use-teachers-infinite-query";

export function useTeacherDetailQuery(teacherId?: number | null) {
  return useQuery<TeacherAttribute>({
    queryKey: TEACHER_QUERY_KEYS.detail(teacherId ?? 0),
    queryFn: async () => {
      if (!teacherId) throw new Error("Teacher ID is required");
      const url = API_ROUTE.TEACHER.GET.replace(":id", String(teacherId));
      const response = await apiClient.get<ResponseDto<TeacherAttribute>>(url);
      if (!response.data.data) {
        throw new Error("Teacher details not found");
      }
      return response.data.data;
    },
    enabled: !!teacherId,
  });
}
