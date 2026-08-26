import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindFeeStructuresDto,
  type CreateFeeStructureDto,
  type UpdateFeeStructureDto,
  type FeeStructureAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export function useFeeStructuresQuery(params: Partial<FindFeeStructuresDto> = {}) {
  return useQuery<ResponseDto<FeeStructureAttribute[]>, Error>({
    queryKey: ["fee-structures", params],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(params);
      const url = `${API_ROUTE.FEE.STRUCTURES_LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<FeeStructureAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
  });
}

export function useCreateFeeStructureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFeeStructureDto) => {
      const response = await apiClient.post<ResponseDto<FeeStructureAttribute>>(
        API_ROUTE.FEE.STRUCTURES_CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
}

export function useUpdateFeeStructureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateFeeStructureDto }) => {
      const url = API_ROUTE.FEE.STRUCTURES_UPDATE.replace(":id", String(id));
      const response = await apiClient.put<ResponseDto<FeeStructureAttribute>>(url, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
}

export function useDeleteFeeStructureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.FEE.STRUCTURES_DELETE.replace(":id", String(id));
      await apiClient.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
}
