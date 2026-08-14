import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateUserDto,
  type UpdateUserDto,
  type ResponseDto,
  type UserAttribute,
} from "@repo/contracts";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

function getAuthHeaders(token: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  return useMutation<ResponseDto<UserAttribute>, Error, CreateUserDto>({
    mutationFn: async (dto: CreateUserDto) => {
      const response = await fetch(API_ROUTE.USER.CREATE, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create user (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<UserAttribute>;
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
  const token = useAuthStore((state) => state.token);

  return useMutation<
    ResponseDto<UserAttribute>,
    Error,
    UpdateUserMutationParams
  >({
    mutationFn: async ({ id, dto }) => {
      const url = API_ROUTE.USER.UPDATE.replace(":id", String(id));
      const response = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update user (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<UserAttribute>;
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
  const token = useAuthStore((state) => state.token);

  return useMutation<ResponseDto<{ id: number; success: boolean }>, Error, number>({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.USER.DELETE.replace(":id", String(id));
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to delete user (${response.status})`
        );
      }

      return (await response.json()) as ResponseDto<{
        id: number;
        success: boolean;
      }>;
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
