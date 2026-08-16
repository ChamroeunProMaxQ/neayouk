import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import {
  API_ROUTE,
  type CreateRoleDto,
  type ResponseDto,
  type RoleDto,
  type UpdateRoleDto,
} from "@repo/contracts";
import { ROLE_KEYS } from "./use-roles-query";

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateRoleDto) => {
      const response = await apiClient.post<ResponseDto<RoleDto>>(API_ROUTE.ROLE.CREATE, dto);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateRoleDto }) => {
      const url = API_ROUTE.ROLE.UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<RoleDto>>(url, dto);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ROLE_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.ROLE.DELETE.replace(":id", String(id));
      const response = await apiClient.delete<ResponseDto<{ id: number; success: boolean }>>(url);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLE_KEYS.all });
    },
  });
}
