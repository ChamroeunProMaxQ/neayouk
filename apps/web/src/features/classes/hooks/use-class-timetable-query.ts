import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type ClassTimetableAttribute,
  type CreateClassTimetableDto,
  type UpdateClassTimetableDto,
  type FindClassTimetablesDto,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export function useClassTimetableQuery(classId?: number, params: Partial<FindClassTimetablesDto> = {}) {
  return useQuery<ResponseDto<ClassTimetableAttribute[]>, Error>({
    queryKey: ["classes", classId, "timetable", params],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(params);
      const url = `${API_ROUTE.CLASS.TIMETABLE.replace(":id", String(classId))}${qs ? `?${qs}` : ""}`;
      const response = await apiClient.get<ResponseDto<ClassTimetableAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    enabled: !!classId,
  });
}

export function useCreateTimetableSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<ClassTimetableAttribute>,
    Error,
    { classId: number; dto: CreateClassTimetableDto }
  >({
    mutationFn: async ({ classId, dto }) => {
      const url = `${API_ROUTE.CLASS.CREATE_TIMETABLE.replace(":id", String(classId))}`;
      const response = await apiClient.post<ResponseDto<ClassTimetableAttribute>>(url, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId, "timetable"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateTimetableSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<ClassTimetableAttribute>,
    Error,
    { slotId: number; classId: number; dto: UpdateClassTimetableDto }
  >({
    mutationFn: async ({ slotId, dto }) => {
      const url = `${API_ROUTE.CLASS.UPDATE_TIMETABLE.replace(":slotId", String(slotId))}`;
      const response = await apiClient.patch<ResponseDto<ClassTimetableAttribute>>(url, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId, "timetable"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}

export function useDeleteTimetableSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ResponseDto<{ id: number; success: boolean }>,
    Error,
    { slotId: number; classId: number }
  >({
    mutationFn: async ({ slotId }) => {
      const url = `${API_ROUTE.CLASS.DELETE_TIMETABLE.replace(":slotId", String(slotId))}`;
      const response = await apiClient.delete<ResponseDto<{ id: number; success: boolean }>>(url);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId, "timetable"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}
