import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type CreatePayrollDto,
  type UpdatePayrollDto,
  type ProcessPayrollPaymentDto,
  type PayrollAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import { PAYROLL_QUERY_KEYS } from "./use-payrolls-infinite-query";

export function usePayrollDetailQuery(id: number | null) {
  return useQuery<ResponseDto<PayrollAttribute>>({
    queryKey: PAYROLL_QUERY_KEYS.detail(id ?? 0),
    queryFn: async () => {
      if (!id) throw new Error("Payroll ID required");
      const url = API_ROUTE.HR.PAYROLL_GET.replace(":id", String(id));
      const response = await apiClient.get<ResponseDto<PayrollAttribute>>(url);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePayrollMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePayrollDto) => {
      const response = await apiClient.post<ResponseDto<PayrollAttribute>>(
        API_ROUTE.HR.PAYROLL_CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.all });
    },
  });
}

export function useUpdatePayrollMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: number;
      dto: UpdatePayrollDto;
    }) => {
      const url = API_ROUTE.HR.PAYROLL_UPDATE.replace(":id", String(id));
      const response = await apiClient.patch<ResponseDto<PayrollAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: PAYROLL_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useProcessPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: number;
      dto: ProcessPayrollPaymentDto;
    }) => {
      const url = API_ROUTE.HR.PAYROLL_PAY.replace(":id", String(id));
      const response = await apiClient.post<ResponseDto<PayrollAttribute>>(
        url,
        dto
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: PAYROLL_QUERY_KEYS.detail(variables.id),
      });
      // Invalidate school expenses as well since an expense was created automatically
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useDeletePayrollMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.HR.PAYROLL_DELETE.replace(":id", String(id));
      const response = await apiClient.delete<ResponseDto<PayrollAttribute>>(url);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_QUERY_KEYS.all });
    },
  });
}
