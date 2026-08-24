import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type BatchSaveGradebookDto,
  type GradebookMatrixDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { GRADEBOOK_QUERY_KEYS } from "./use-gradebook-matrix-query";

export function useSaveGradebookMutation() {
  const queryClient = useQueryClient();

  return useMutation<GradebookMatrixDto, Error, BatchSaveGradebookDto>({
    mutationFn: async (payload: BatchSaveGradebookDto) => {
      const res = await apiClient.post<ResponseDto<GradebookMatrixDto>>(
        API_ROUTE.EXAMINATION.GRADEBOOK_SAVE,
        payload
      );
      return res.data.data as GradebookMatrixDto;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        GRADEBOOK_QUERY_KEYS.matrix(variables.classId, variables.month),
        data
      );
      queryClient.invalidateQueries({ queryKey: GRADEBOOK_QUERY_KEYS.all });
    },
  });
}
