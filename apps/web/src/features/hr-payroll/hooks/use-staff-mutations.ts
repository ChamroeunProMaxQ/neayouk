import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateStaffDto,
  type UpdateStaffDto,
  type StaffAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { STAFF_QUERY_KEYS } from "./use-staff-infinite-query";

export function useStaffDetailQuery(id: number | null) {
  return useQuery<ResponseDto<StaffAttribute>>({
    queryKey: STAFF_QUERY_KEYS.detail(id ?? 0),
    queryFn: async () => {
      if (!id) throw new Error("Staff ID required");
      const url = API_ROUTE.HR.STAFF_GET.replace(":id", String(id));
      const response = await apiClient.get<ResponseDto<StaffAttribute>>(url);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateStaffDto) => {
      const response = await apiClient.post<ResponseDto<StaffAttribute>>(
        API_ROUTE.HR.STAFF_CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });
    },
  });
}

export function useUpdateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: number;
      dto: UpdateStaffDto;
    }) => {
      const url = API_ROUTE.HR.STAFF_UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<StaffAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: STAFF_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.HR.STAFF_DELETE.replace(":id", String(id));
      const response = await apiClient.delete<ResponseDto<StaffAttribute>>(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });
    },
  });
}
