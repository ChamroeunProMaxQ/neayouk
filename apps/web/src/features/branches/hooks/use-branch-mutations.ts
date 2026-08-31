import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type BranchDto,
  type CreateBranchWithAdminDto,
  type ResponseDto,
  type UpdateBranchDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useCreateBranchWithAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<{ branch: BranchDto; adminUser: any }>,
    Error,
    CreateBranchWithAdminDto
  >({
    mutationFn: async (dto: CreateBranchWithAdminDto) => {
      const response = await apiClient.post<
        ResponseDto<{ branch: BranchDto; adminUser: any }>
      >(API_ROUTE.SUPERADMIN.BRANCHES, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export interface UpdateBranchMutationParams {
  id: number;
  dto: UpdateBranchDto;
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<BranchDto>, Error, UpdateBranchMutationParams>({
    mutationFn: async ({ id, dto }) => {
      const url = `${API_ROUTE.SUPERADMIN.BRANCHES}/${id}`;
      const response = await apiClient.patch<ResponseDto<BranchDto>>(url, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
