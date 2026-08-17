import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreateStudentDto,
  type UpdateStudentDto,
  type AssignStudentClassesDto,
  type PromoteStudentDto,
  type BatchPromoteStudentsDto,
  type ResponseDto,
  type StudentAttribute,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<StudentAttribute>, Error, CreateStudentDto>({
    mutationFn: async (dto: CreateStudentDto) => {
      const response = await apiClient.post<ResponseDto<StudentAttribute>>(
        API_ROUTE.STUDENT.CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export interface UpdateStudentMutationParams {
  id: number;
  dto: UpdateStudentDto;
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentAttribute>,
    Error,
    UpdateStudentMutationParams
  >({
    mutationFn: async ({ id, dto }) => {
      const url = API_ROUTE.STUDENT.UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<StudentAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", id] });
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation<ResponseDto<{ id: number; success: boolean }>, Error, number>({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.STUDENT.DELETE.replace(":id", String(id));
      const response = await apiClient.delete<
        ResponseDto<{ id: number; success: boolean }>
      >(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useAssignStudentClassesMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentAttribute>,
    Error,
    { studentId: number; dto: AssignStudentClassesDto }
  >({
    mutationFn: async ({ studentId, dto }) => {
      const url = API_ROUTE.STUDENT.ASSIGN_CLASSES.replace(":id", String(studentId));
      const response = await apiClient.post<ResponseDto<StudentAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", studentId] });
    },
  });
}

export function usePromoteStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentAttribute>,
    Error,
    { studentId: number; dto: PromoteStudentDto }
  >({
    mutationFn: async ({ studentId, dto }) => {
      const url = API_ROUTE.STUDENT.PROMOTE.replace(":id", String(studentId));
      const response = await apiClient.post<ResponseDto<StudentAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-summary", studentId] });
    },
  });
}

export function useBatchPromoteStudentsMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<StudentAttribute[]>,
    Error,
    BatchPromoteStudentsDto
  >({
    mutationFn: async (dto: BatchPromoteStudentsDto) => {
      const response = await apiClient.post<ResponseDto<StudentAttribute[]>>(
        API_ROUTE.STUDENT.BATCH_PROMOTE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
