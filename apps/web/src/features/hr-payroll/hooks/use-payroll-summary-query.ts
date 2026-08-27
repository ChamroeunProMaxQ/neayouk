import { useQuery } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type PayrollSummaryAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { PAYROLL_QUERY_KEYS } from "./use-payrolls-infinite-query";

export function usePayrollSummaryQuery(params: { year?: number; month?: number }) {
  return useQuery<ResponseDto<PayrollSummaryAttribute>>({
    queryKey: PAYROLL_QUERY_KEYS.summary(params),
    queryFn: async () => {
      const query = queryString.stringify(params, {
        skipNull: true,
        skipEmptyString: true,
      });

      const url = query
        ? `${API_ROUTE.HR.PAYROLL_SUMMARY}?${query}`
        : API_ROUTE.HR.PAYROLL_SUMMARY;

      const response = await apiClient.get<ResponseDto<PayrollSummaryAttribute>>(
        url
      );
      return response.data;
    },
  });
}
