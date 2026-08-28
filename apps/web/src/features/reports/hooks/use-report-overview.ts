import { useQuery } from '@tanstack/react-query';
import { API_ROUTE, type ReportOverviewDto, type ResponseDto } from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';

export function useReportOverviewQuery() {
  return useQuery<ResponseDto<ReportOverviewDto>, Error>({
    queryKey: ['reports', 'overview'],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ResponseDto<ReportOverviewDto>>(
        API_ROUTE.REPORT.OVERVIEW,
        { signal },
      );
      return response.data;
    },
  });
}
