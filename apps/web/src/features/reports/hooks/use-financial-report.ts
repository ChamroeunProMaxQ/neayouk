import { useQuery } from '@tanstack/react-query';
import queryString from 'query-string';
import {
  API_ROUTE,
  type FinancialReportQueryDto,
  type FinancialReportSummaryDto,
  type ResponseDto,
} from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';

export function useFinancialReportQuery(filters: FinancialReportQueryDto) {
  const queryStr = queryString.stringify(filters, { skipEmptyString: true, skipNull: true });

  return useQuery<ResponseDto<FinancialReportSummaryDto>, Error>({
    queryKey: ['reports', 'financial', filters],
    queryFn: async ({ signal }) => {
      const url = `${API_ROUTE.REPORT.FINANCIAL_SUMMARY}${queryStr ? `?${queryStr}` : ''}`;
      const response = await apiClient.get<ResponseDto<FinancialReportSummaryDto>>(url, {
        signal,
      });
      return response.data;
    },
  });
}
