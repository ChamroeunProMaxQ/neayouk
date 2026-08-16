import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindClassesDto,
  type ResponseDto,
  type ClassAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export interface UseClassesQueryParams extends Partial<FindClassesDto> {
  enabled?: boolean;
}

export function useClassesQuery(params: UseClassesQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery<ResponseDto<ClassAttribute[]>, Error>({
    queryKey: ["classes", queryParams],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.CLASS.LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<ClassAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled,
  });
}
