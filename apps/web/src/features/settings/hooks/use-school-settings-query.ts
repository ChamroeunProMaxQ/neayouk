import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type ResponseDto,
  type SchoolProfileDto,
  type TelegramIntegrationDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { usePermission } from "@/features/auth";

export const SCHOOL_PROFILE_QUERY_KEY = ["settings", "school-profile"] as const;
export const TELEGRAM_INTEGRATION_QUERY_KEY = ["settings", "telegram-integration"] as const;

/**
 * Fetches current branch's school profile, logo, and receipt customization data.
 */
export function useSchoolProfileQuery(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const { user, isSuperAdmin } = usePermission();

  return useQuery<SchoolProfileDto>({
    queryKey: [...SCHOOL_PROFILE_QUERY_KEY, user?.branchId],
    queryFn: async ({ signal }): Promise<SchoolProfileDto> => {
      const response = await apiClient.get<ResponseDto<SchoolProfileDto>>(
        API_ROUTE.SETTING.PROFILE,
        { signal }
      );
      return response.data.data as SchoolProfileDto;
    },
    enabled: enabled && (Boolean(user?.branchId) || isSuperAdmin),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Fetches current branch's Telegram Bot integration configuration.
 */
export function useTelegramIntegrationQuery(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};
  const { user, isSuperAdmin } = usePermission();

  return useQuery<TelegramIntegrationDto>({
    queryKey: [...TELEGRAM_INTEGRATION_QUERY_KEY, user?.branchId],
    queryFn: async ({ signal }): Promise<TelegramIntegrationDto> => {
      const response = await apiClient.get<ResponseDto<TelegramIntegrationDto>>(
        API_ROUTE.SETTING.TELEGRAM,
        { signal }
      );
      return response.data.data as TelegramIntegrationDto;
    },
    enabled: enabled && (Boolean(user?.branchId) || isSuperAdmin),
  });
}
