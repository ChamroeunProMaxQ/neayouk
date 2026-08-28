import { useQuery } from '@tanstack/react-query';
import queryString from 'query-string';
import {
  API_ROUTE,
  type AcademicReportQueryDto,
  type AcademicReportSummaryDto,
  type ResponseDto,
} from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';

export function useAcademicReportQuery(filters: AcademicReportQueryDto) {
  const queryStr = queryString.stringify(filters, { skipEmptyString: true, skipNull: true });

  return useQuery<ResponseDto<AcademicReportSummaryDto>, Error>({
    queryKey: ['reports', 'academic', filters],
    queryFn: async ({ signal }) => {
      const url = `${API_ROUTE.REPORT.ACADEMIC_SUMMARY}${queryStr ? `?${queryStr}` : ''}`;
      const response = await apiClient.get<ResponseDto<AcademicReportSummaryDto>>(url, {
        signal,
      });
      return response.data;
    },
  });
}
