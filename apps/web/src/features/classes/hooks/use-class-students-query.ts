import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type StudentClassEnrollmentAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useClassStudentsQuery(classId?: number) {
  return useQuery<ResponseDto<StudentClassEnrollmentAttribute[]>, Error>({
    queryKey: ["classes", classId, "students"],
    queryFn: async ({ signal }) => {
      const url = `${API_ROUTE.CLASS.STUDENTS.replace(":id", String(classId))}`;
      const response = await apiClient.get<ResponseDto<StudentClassEnrollmentAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled: !!classId,
  });
}
