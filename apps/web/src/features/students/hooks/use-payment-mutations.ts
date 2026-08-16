import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type RecordPaymentDto,
  type BatchRecordPaymentDto,
  type ResponseDto,
  type StudentPaymentAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentPaymentAttribute>,
    Error,
    RecordPaymentDto
  >({
    mutationFn: async (dto: RecordPaymentDto) => {
      const url = API_ROUTE.STUDENT.RECORD_PAYMENT.replace(":id", String(dto.studentId));
      const response = await apiClient.post<ResponseDto<StudentPaymentAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", dto.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-payments", dto.studentId] });
    },
  });
}

export function useBatchRecordPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentPaymentAttribute[]>,
    Error,
    BatchRecordPaymentDto
  >({
    mutationFn: async (dto: BatchRecordPaymentDto) => {
      const url = `/api/v1/admin/students/${dto.studentId}/batch-payments`;
      const response = await apiClient.post<ResponseDto<StudentPaymentAttribute[]>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", dto.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-payments", dto.studentId] });
    },
  });
}
