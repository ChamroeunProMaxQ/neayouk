import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateTeacherDto,
  type UpdateTeacherDto,
  type TeacherAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { TEACHER_QUERY_KEYS } from "./use-teachers-infinite-query";

export function useCreateTeacherMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTeacherDto) => {
      const response = await apiClient.post<ResponseDto<TeacherAttribute>>(
        API_ROUTE.TEACHER.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_QUERY_KEYS.all });
    },
  });
}

export function useUpdateTeacherMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: number;
      dto: UpdateTeacherDto;
    }) => {
      const url = API_ROUTE.TEACHER.UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<TeacherAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEACHER_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: TEACHER_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteTeacherMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.TEACHER.DELETE.replace(":id", String(id));
      const response = await apiClient.delete<
        ResponseDto<{ id: number; success: boolean }>
      >(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHER_QUERY_KEYS.all });
    },
  });
}
