import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type BatchRecordStudentAttendanceDto,
  type ClassAttendanceSummaryDto,
  type RecordStudentAttendanceDto,
  type ResponseDto,
  type StudentAttendanceAttribute,
  type StudentAttendanceMatrixDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const STUDENT_ATTENDANCE_QUERY_KEYS = {
  all: ["student-attendances"] as const,
  matrix: (classId: number, startDate: string, endDate: string) =>
    [...STUDENT_ATTENDANCE_QUERY_KEYS.all, "matrix", classId, startDate, endDate] as const,
  summary: (classId: number, date: string) =>
    [...STUDENT_ATTENDANCE_QUERY_KEYS.all, "summary", classId, date] as const,
  list: (params: Record<string, unknown>) =>
    [...STUDENT_ATTENDANCE_QUERY_KEYS.all, "list", params] as const,
};

export function useStudentAttendanceMatrixQuery(
  classId?: number,
  startDate?: string,
  endDate?: string
) {
  return useQuery<StudentAttendanceMatrixDto>({
    queryKey: STUDENT_ATTENDANCE_QUERY_KEYS.matrix(
      classId ?? 0,
      startDate ?? "",
      endDate ?? ""
    ),
    queryFn: async () => {
      if (!classId || !startDate || !endDate) {
        return {
          classId: 0,
          className: "",
          startDate: "",
          endDate: "",
          dates: [],
          totalStudents: 0,
          rows: [],
        };
      }
      const query = queryString.stringify(
        { classId, startDate, endDate },
        { skipNull: true, skipEmptyString: true }
      );
      const res = await apiClient.get<ResponseDto<StudentAttendanceMatrixDto>>(
        `${API_ROUTE.ATTENDANCE.STUDENT_SHEET_MATRIX}?${query}`
      );
      return res.data.data as StudentAttendanceMatrixDto;
    },
    enabled: Boolean(classId && startDate && endDate),
  });
}

export function useClassAttendanceSummaryQuery(classId?: number, date?: string) {
  return useQuery<ClassAttendanceSummaryDto>({
    queryKey: STUDENT_ATTENDANCE_QUERY_KEYS.summary(classId ?? 0, date ?? ""),
    queryFn: async () => {
      if (!classId || !date) {
        return {
          classId: 0,
          className: "",
          totalEnrolled: 0,
          date: "",
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          halfDayCount: 0,
          attendanceRate: 0,
        };
      }
      const query = queryString.stringify(
        { classId, date },
        { skipNull: true, skipEmptyString: true }
      );
      const res = await apiClient.get<ResponseDto<ClassAttendanceSummaryDto>>(
        `${API_ROUTE.ATTENDANCE.STUDENT_SUMMARY}?${query}`
      );
      return res.data.data as ClassAttendanceSummaryDto;
    },
    enabled: Boolean(classId && date),
  });
}

export function useRecordStudentAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordStudentAttendanceDto) => {
      const res = await apiClient.post<ResponseDto<StudentAttendanceAttribute>>(
        API_ROUTE.ATTENDANCE.STUDENTS,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_ATTENDANCE_QUERY_KEYS.all });
    },
  });
}

export function useBatchStudentAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BatchRecordStudentAttendanceDto) => {
      const res = await apiClient.post<ResponseDto<StudentAttendanceAttribute[]>>(
        API_ROUTE.ATTENDANCE.STUDENTS_BATCH,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENT_ATTENDANCE_QUERY_KEYS.all });
    },
  });
}
