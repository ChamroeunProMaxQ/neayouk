import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindInvoicesDto,
  type CreateInvoiceDto,
  type GenerateBatchInvoicesDto,
  type RecordInvoicePaymentDto,
  type RefundPaymentDto,
  type PaymentReminderDto,
  type StudentInvoiceAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";
import queryString from "query-string";

export function useInvoicesQuery(params: Partial<FindInvoicesDto> = {}) {
  return useQuery<ResponseDto<StudentInvoiceAttribute[]>, Error>({
    queryKey: ["invoices", params],
    queryFn: async ({ signal }) => {
      const qs = queryString.stringify(params);
      const url = `${API_ROUTE.FEE.INVOICES_LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<StudentInvoiceAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
  });
}

export function useInvoicesInfiniteQuery(params: Partial<FindInvoicesDto> = {}) {
  const { pageSize = 20, ...queryParams } = params;

  return useInfiniteQuery<ResponseDto<StudentInvoiceAttribute[]>, Error>({
    queryKey: ["invoices", "infinite", { pageSize, ...queryParams }],
    queryFn: async ({ pageParam = 1, signal }) => {
      const qs = queryString.stringify({
        ...queryParams,
        page: pageParam,
        pageSize,
      });
      const url = `${API_ROUTE.FEE.INVOICES_LIST}?${qs}`;
      const response = await apiClient.get<ResponseDto<StudentInvoiceAttribute[]>>(url, {
        signal,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      const { page, totalPage } = pagination;
      if (page >= totalPage) return undefined;
      return page + 1;
    },
  });
}

export function useInvoiceDetailQuery(id?: number) {
  return useQuery<ResponseDto<StudentInvoiceAttribute>, Error>({
    queryKey: ["invoice", id],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Invoice ID required");
      const url = API_ROUTE.FEE.INVOICES_GET.replace(":id", String(id));
      const response = await apiClient.get<ResponseDto<StudentInvoiceAttribute>>(url, {
        signal,
      });
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateInvoiceDto) => {
      const response = await apiClient.post<ResponseDto<StudentInvoiceAttribute>>(
        API_ROUTE.FEE.INVOICES_CREATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useGenerateBatchInvoicesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: GenerateBatchInvoicesDto) => {
      const response = await apiClient.post<ResponseDto<{ message: string; invoiceIds: number[] }>>(
        API_ROUTE.FEE.INVOICES_BATCH_GENERATE,
        dto
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useRecordInvoicePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: RecordInvoicePaymentDto) => {
      const url = API_ROUTE.FEE.INVOICES_RECORD_PAYMENT.replace(":id", String(dto.invoiceId));
      const response = await apiClient.post<ResponseDto<any>>(url, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useRefundPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: RefundPaymentDto) => {
      const url = API_ROUTE.FEE.INVOICES_REFUND.replace(":id", String(dto.invoiceId));
      const response = await apiClient.post<ResponseDto<any>>(url, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });
}

export function useSendReminderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: PaymentReminderDto) => {
      const url = API_ROUTE.FEE.INVOICES_REMINDER.replace(":id", String(dto.invoiceId));
      const response = await apiClient.post<ResponseDto<any>>(url, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
