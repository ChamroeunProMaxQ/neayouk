import { useQuery } from "@tanstack/react-query";
import { API_ROUTE, type StudentPaymentSummary } from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useStudentSummaryQuery(studentId: number | null | undefined, enabled = true) {
  return useQuery<StudentPaymentSummary, Error>({
    queryKey: ["student-summary", studentId],
    queryFn: async ({ signal }) => {
      if (!studentId) throw new Error("Student ID is required");
      const url = API_ROUTE.STUDENT.SUMMARY.replace(":id", String(studentId));
      const response = await apiClient.get<{ data: StudentPaymentSummary }>(url, {
        signal,
      });
      return response.data.data;
    },
    enabled: enabled && Boolean(studentId),
  });
}
