import { useQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type StudentReportCardDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { GRADEBOOK_QUERY_KEYS } from "./use-gradebook-matrix-query";

export function useStudentReportCardQuery(
  studentId?: number,
  month?: string,
  classId?: number
) {
  return useQuery<StudentReportCardDto>({
    queryKey: GRADEBOOK_QUERY_KEYS.reportCard(
      studentId ?? 0,
      month ?? "",
      classId
    ),
    queryFn: async () => {
      if (!studentId || !month) {
        throw new Error("Student ID and month are required");
      }
      const query = queryString.stringify(
        { month, classId },
        { skipNull: true, skipEmptyString: true }
      );
      const url = `${API_ROUTE.EXAMINATION.REPORT_CARD.replace(":studentId", String(studentId))}?${query}`;
      const res = await apiClient.get<ResponseDto<StudentReportCardDto>>(url);
      return res.data.data as StudentReportCardDto;
    },
    enabled: Boolean(studentId && month),
  });
}
