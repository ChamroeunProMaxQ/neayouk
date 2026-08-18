import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type BatchRecordTeacherAttendanceDto,
  type FindTeacherAttendanceDto,
  type RecordTeacherAttendanceDto,
  type ResponseDto,
  type TeacherAttendanceAttribute,
  type TeacherAttendanceSummaryDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const TEACHER_ATTENDANCE_QUERY_KEYS = {
  all: ["teacher-attendances"] as const,
  list: (params: Record<string, unknown>) =>
    [...TEACHER_ATTENDANCE_QUERY_KEYS.all, "list", params] as const,
  summary: (teacherId: number, month: string) =>
    [...TEACHER_ATTENDANCE_QUERY_KEYS.all, "summary", teacherId, month] as const,
};

export function useTeacherAttendanceQuery(params: FindTeacherAttendanceDto) {
  return useQuery<{ data: TeacherAttendanceAttribute[]; pagination: { totalCount: number; page: number; pageSize: number; pageCount: number } }>({
    queryKey: TEACHER_ATTENDANCE_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async () => {
      const query = queryString.stringify(params, { skipNull: true, skipEmptyString: true });
      const res = await apiClient.get<ResponseDto<{ data: TeacherAttendanceAttribute[]; pagination: any }>>(
        `${API_ROUTE.ATTENDANCE.TEACHERS}?${query}`
      );
      return res.data.data as { data: TeacherAttendanceAttribute[]; pagination: { totalCount: number; page: number; pageSize: number; pageCount: number } };
    },
  });
}

export function useTeacherAttendanceSummaryQuery(teacherId?: number, month?: string) {
  return useQuery<TeacherAttendanceSummaryDto>({
    queryKey: TEACHER_ATTENDANCE_QUERY_KEYS.summary(teacherId ?? 0, month ?? ""),
    queryFn: async () => {
      if (!teacherId || !month) {
        return {
          teacherId: 0,
          teacherName: "",
          salaryInHour: 0,
          totalHoursWorked: 0,
          estimatedSalary: 0,
          daysPresent: 0,
          daysAbsent: 0,
          daysLate: 0,
          daysOnLeave: 0,
          month: "",
        };
      }
      const query = queryString.stringify(
        { teacherId, month },
        { skipNull: true, skipEmptyString: true }
      );
      const res = await apiClient.get<ResponseDto<TeacherAttendanceSummaryDto>>(
        `${API_ROUTE.ATTENDANCE.TEACHER_SUMMARY}?${query}`
      );
      return res.data.data as TeacherAttendanceSummaryDto;
    },
    enabled: Boolean(teacherId && month),
  });
}

export function useRecordTeacherAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordTeacherAttendanceDto) => {
      const res = await apiClient.post<ResponseDto<TeacherAttendanceAttribute>>(
        API_ROUTE.ATTENDANCE.TEACHERS,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_ATTENDANCE_QUERY_KEYS.all });
    },
  });
}

export function useBatchRecordTeacherAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BatchRecordTeacherAttendanceDto) => {
      const res = await apiClient.post<ResponseDto<TeacherAttendanceAttribute[]>>(
        API_ROUTE.ATTENDANCE.TEACHERS_BATCH,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_ATTENDANCE_QUERY_KEYS.all });
    },
  });
}
