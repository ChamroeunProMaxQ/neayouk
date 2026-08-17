import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateClassDto,
  type UpdateClassDto,
  type ResponseDto,
  type ClassAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useCreateClassMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<ClassAttribute>, Error, CreateClassDto>({
    mutationFn: async (dto) => {
      const response = await apiClient.post<ResponseDto<ClassAttribute>>(
        API_ROUTE.CLASS.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<ClassAttribute>,
    Error,
    { id: number; dto: UpdateClassDto }
  >({
    mutationFn: async ({ id, dto }) => {
      const url = `${API_ROUTE.CLASS.UPDATE.replace(":id", String(id))}`;
      const response = await apiClient.patch<ResponseDto<ClassAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.id] });
    },
  });
}

export function useDeleteClassMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<{ id: number; success: boolean }>, Error, number>({
    mutationFn: async (id) => {
      const url = `${API_ROUTE.CLASS.DELETE.replace(":id", String(id))}`;
      const response = await apiClient.delete<
        ResponseDto<{ id: number; success: boolean }>
      >(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
