import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type BranchDto,
  type FindBranchesDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseBranchesQueryParams extends Partial<FindBranchesDto> {
  enabled?: boolean;
}

export function useBranchesQuery(params: UseBranchesQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<BranchDto[]>, Error>({
    queryKey: ["branches", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.SUPERADMIN.BRANCHES}?${qs}`;
      const response = await apiClient.get<ResponseDto<BranchDto[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}
