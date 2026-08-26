import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindSchoolExpensesDto,
  type CreateSchoolExpenseDto,
  type UpdateSchoolExpenseDto,
  type ApproveSchoolExpenseDto,
  type SchoolExpenseAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export function useExpensesQuery(params: Partial<FindSchoolExpensesDto> = {}) {
  return useQuery<ResponseDto<SchoolExpenseAttribute[]>, Error>({
    queryKey: ["expenses", params],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(params);
      const url = `${API_ROUTE.FEE.EXPENSES_LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<SchoolExpenseAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateSchoolExpenseDto) => {
      const response = await apiClient.post<ResponseDto<SchoolExpenseAttribute>>(
        API_ROUTE.FEE.EXPENSES_CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdateSchoolExpenseDto }) => {
      const url = API_ROUTE.FEE.EXPENSES_UPDATE.replace(":id", String(id));
      const response = await apiClient.put<ResponseDto<SchoolExpenseAttribute>>(url, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useApproveExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: ApproveSchoolExpenseDto }) => {
      const url = API_ROUTE.FEE.EXPENSES_APPROVE.replace(":id", String(id));
      const response = await apiClient.post<ResponseDto<SchoolExpenseAttribute>>(url, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.FEE.EXPENSES_DELETE.replace(":id", String(id));
      await apiClient.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}
