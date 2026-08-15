import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateUserDto,
  type UpdateUserDto,
  type ResponseDto,
  type UserAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<UserAttribute>, Error, CreateUserDto>({
    mutationFn: async (dto: CreateUserDto) => {
      const response = await apiClient.post<ResponseDto<UserAttribute>>(
        API_ROUTE.USER.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueriesData<ResponseDto<UserAttribute[]>>(
          { queryKey: ["users"] },
          (oldData) => {
            if (!oldData || !oldData.data) return oldData;
            const currentUsers = oldData.data || [];
            const updatedUsers = [
              res.data!,
              ...currentUsers.filter((u) => u.id !== res.data!.id),
            ];
            const newTotal =
              (oldData.pagination?.totalCount || currentUsers.length) + 1;
            return {
              ...oldData,
              data: updatedUsers,
              pagination: oldData.pagination
                ? {
                    ...oldData.pagination,
                    totalCount: newTotal,
                    totalPage: Math.ceil(
                      newTotal / oldData.pagination.pageSize
                    ),
                  }
                : undefined,
            };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export interface UpdateUserMutationParams {
  id: number;
  dto: UpdateUserDto;
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<UserAttribute>,
    Error,
    UpdateUserMutationParams
  >({
    mutationFn: async ({ id, dto }) => {
      const url = API_ROUTE.USER.UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<UserAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueriesData<ResponseDto<UserAttribute[]>>(
          { queryKey: ["users"] },
          (oldData) => {
            if (!oldData || !oldData.data) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((u) =>
                u.id === res.data!.id ? { ...u, ...res.data } : u
              ),
            };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<{ id: number; success: boolean }>, Error, number>({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.USER.DELETE.replace(":id", String(id));
      const response = await apiClient.delete<
        ResponseDto<{ id: number; success: boolean }>
      >(url);
      return response.data;
    },
    onSuccess: (_res, id) => {
      queryClient.setQueriesData<ResponseDto<UserAttribute[]>>(
        { queryKey: ["users"] },
        (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((u) =>
              u.id === id ? { ...u, deletedAt: new Date() } : u
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
