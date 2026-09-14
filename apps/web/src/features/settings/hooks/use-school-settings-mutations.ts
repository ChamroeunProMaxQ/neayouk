import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type ResponseDto,
  type SchoolProfileDto,
  type TelegramIntegrationDto,
  type TestTelegramConnectionDto,
  type TestTelegramResultDto,
  type UpdateSchoolProfileDto,
  type UpdateTelegramIntegrationDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import {
  SCHOOL_PROFILE_QUERY_KEY,
  TELEGRAM_INTEGRATION_QUERY_KEY,
} from "./use-school-settings-query";

/**
 * Mutation to update school profile details (names, motto, contact, receipt terms).
 */
export function useUpdateSchoolProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<SchoolProfileDto, Error, UpdateSchoolProfileDto>({
    mutationFn: async (dto): Promise<SchoolProfileDto> => {
      const response = await apiClient.patch<ResponseDto<SchoolProfileDto>>(
        API_ROUTE.SETTING.UPDATE_PROFILE,
        dto
      );
      return response.data.data as SchoolProfileDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_PROFILE_QUERY_KEY });
    },
  });
}

/**
 * Mutation to upload a new official school logo.
 */
export function useUploadSchoolLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation<SchoolProfileDto, Error, File>({
    mutationFn: async (file): Promise<SchoolProfileDto> => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await apiClient.post<ResponseDto<SchoolProfileDto>>(
        API_ROUTE.SETTING.UPLOAD_LOGO,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.data as SchoolProfileDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_PROFILE_QUERY_KEY });
    },
  });
}

/**
 * Mutation to delete the custom school logo and revert to default.
 */
export function useDeleteSchoolLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation<SchoolProfileDto, Error, void>({
    mutationFn: async (): Promise<SchoolProfileDto> => {
      const response = await apiClient.delete<ResponseDto<SchoolProfileDto>>(
        API_ROUTE.SETTING.DELETE_LOGO
      );
      return response.data.data as SchoolProfileDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_PROFILE_QUERY_KEY });
    },
  });
}

/**
 * Mutation to update Telegram Bot integration settings and channel IDs.
 */
export function useUpdateTelegramIntegrationMutation() {
  const queryClient = useQueryClient();

  return useMutation<TelegramIntegrationDto, Error, UpdateTelegramIntegrationDto>({
    mutationFn: async (dto): Promise<TelegramIntegrationDto> => {
      const response = await apiClient.put<ResponseDto<TelegramIntegrationDto>>(
        API_ROUTE.SETTING.UPDATE_TELEGRAM,
        dto
      );
      return response.data.data as TelegramIntegrationDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TELEGRAM_INTEGRATION_QUERY_KEY });
    },
  });
}

/**
 * Mutation to send a live test message verifying Telegram connection.
 */
export function useTestTelegramMutation() {
  const queryClient = useQueryClient();

  return useMutation<TestTelegramResultDto, Error, TestTelegramConnectionDto>({
    mutationFn: async (dto): Promise<TestTelegramResultDto> => {
      const response = await apiClient.post<ResponseDto<TestTelegramResultDto>>(
        API_ROUTE.SETTING.TEST_TELEGRAM,
        dto
      );
      return response.data.data as TestTelegramResultDto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TELEGRAM_INTEGRATION_QUERY_KEY });
    },
  });
}
