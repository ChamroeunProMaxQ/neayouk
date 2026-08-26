import { useQuery } from "@tanstack/react-query";
import { API_ROUTE, type FeeSummary, type ResponseDto } from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useFeeSummaryQuery() {
  return useQuery<ResponseDto<FeeSummary>, Error>({
    queryKey: ["fee-summary"],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ResponseDto<FeeSummary>>(API_ROUTE.FEE.SUMMARY, {
        signal,
      });
      return response.data;
    },
  });
}
