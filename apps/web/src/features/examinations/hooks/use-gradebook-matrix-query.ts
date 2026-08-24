import { useQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type GradebookMatrixDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const GRADEBOOK_QUERY_KEYS = {
  all: ["gradebook"] as const,
  matrix: (classId: number, month: string) =>
    [...GRADEBOOK_QUERY_KEYS.all, "matrix", classId, month] as const,
  reportCard: (studentId: number, month: string, classId?: number) =>
    [...GRADEBOOK_QUERY_KEYS.all, "report-card", studentId, month, classId] as const,
};

export function useGradebookMatrixQuery(classId?: number, month?: string) {
  return useQuery<GradebookMatrixDto>({
    queryKey: GRADEBOOK_QUERY_KEYS.matrix(classId ?? 0, month ?? ""),
    queryFn: async () => {
      if (!classId || !month) {
        throw new Error("Class ID and month are required");
      }
      const query = queryString.stringify(
        { classId, month },
        { skipNull: true, skipEmptyString: true }
      );
      const res = await apiClient.get<ResponseDto<GradebookMatrixDto>>(
        `${API_ROUTE.EXAMINATION.MATRIX}?${query}`
      );
      return res.data.data as GradebookMatrixDto;
    },
    enabled: Boolean(classId && month),
  });
}
