import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindUsersDto,
  type ResponseDto,
  type UserAttribute,
} from "@repo/contracts";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import queryString from "query-string";

export interface UseUsersQueryParams extends Partial<FindUsersDto> {
  enabled?: boolean;
}

export function useUsersQuery(params: UseUsersQueryParams = {}) {
  const { enabled = true, ...queryParams } = params;
  const token = useAuthStore((state) => state.token);

  return useQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", queryParams],
    queryFn: async () => {
      const qs = queryString.stringify(queryParams);
      const url = `${API_ROUTE.USER.LIST}?${qs}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to fetch users (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<UserAttribute[]>;
    },
    enabled,

  });
}
