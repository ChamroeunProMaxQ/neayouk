import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateProgramDto,
  type UpdateProgramDto,
  type ProgramAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useCreateProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<ProgramAttribute>, Error, CreateProgramDto>({
    mutationFn: async (dto) => {
      const response = await apiClient.post<ResponseDto<ProgramAttribute>>(
        API_ROUTE.PROGRAM.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<ProgramAttribute>,
    Error,
    { id: number; dto: UpdateProgramDto }
  >({
    mutationFn: async ({ id, dto }) => {
      const url = `${API_ROUTE.PROGRAM.UPDATE.replace(":id", String(id))}`;
      const response = await apiClient.patch<ResponseDto<ProgramAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<{ id: number; success: boolean }>, Error, number>({
    mutationFn: async (id) => {
      const url = `${API_ROUTE.PROGRAM.DELETE.replace(":id", String(id))}`;
      const response = await apiClient.delete<
        ResponseDto<{ id: number; success: boolean }>
      >(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
