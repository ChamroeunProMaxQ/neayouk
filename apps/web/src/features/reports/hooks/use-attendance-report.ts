import { useQuery } from '@tanstack/react-query';
import queryString from 'query-string';
import {
  API_ROUTE,
  type AttendanceReportQueryDto,
  type AttendanceReportSummaryDto,
  type ResponseDto,
} from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';

export function useAttendanceReportQuery(filters: AttendanceReportQueryDto) {
  const queryStr = queryString.stringify(filters, { skipEmptyString: true, skipNull: true });

  return useQuery<ResponseDto<AttendanceReportSummaryDto>, Error>({
    queryKey: ['reports', 'attendance', filters],
    queryFn: async ({ signal }) => {
      const url = `${API_ROUTE.REPORT.ATTENDANCE_SUMMARY}${queryStr ? `?${queryStr}` : ''}`;
      const response = await apiClient.get<ResponseDto<AttendanceReportSummaryDto>>(url, {
        signal,
      });
      return response.data;
    },
  });
}
