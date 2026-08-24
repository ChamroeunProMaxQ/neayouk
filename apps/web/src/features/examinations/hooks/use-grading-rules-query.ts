import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type CreateGradingRuleDto,
  type UpdateGradingRuleDto,
  type FindGradingRulesDto,
  type GradingRuleAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const GRADING_RULES_QUERY_KEYS = {
  all: ["grading-rules"] as const,
  list: (params?: Record<string, unknown>) =>
    [...GRADING_RULES_QUERY_KEYS.all, "list", params || {}] as const,
  detail: (id: number) =>
    [...GRADING_RULES_QUERY_KEYS.all, "detail", id] as const,
  default: () => [...GRADING_RULES_QUERY_KEYS.all, "default"] as const,
};

export function useGradingRulesQuery(params?: Partial<FindGradingRulesDto>) {
  return useQuery<{
    data: GradingRuleAttribute[];
    pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
  }>({
    queryKey: GRADING_RULES_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async () => {
      const query = queryString.stringify(params || {}, {
        skipNull: true,
        skipEmptyString: true,
      });
      const res = await apiClient.get<ResponseDto<{
        data: GradingRuleAttribute[];
        pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
      }>>(`${API_ROUTE.EXAMINATION.RULES_LIST}?${query}`);
      return res.data.data as any;
    },
  });
}

export function useDefaultGradingRuleQuery() {
  return useQuery<GradingRuleAttribute>({
    queryKey: GRADING_RULES_QUERY_KEYS.default(),
    queryFn: async () => {
      const res = await apiClient.get<ResponseDto<GradingRuleAttribute>>(
        API_ROUTE.EXAMINATION.RULES_DEFAULT
      );
      return res.data.data as GradingRuleAttribute;
    },
  });
}

export function useCreateGradingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation<GradingRuleAttribute, Error, CreateGradingRuleDto>({
    mutationFn: async (payload: CreateGradingRuleDto) => {
      const res = await apiClient.post<ResponseDto<GradingRuleAttribute>>(
        API_ROUTE.EXAMINATION.RULES_CREATE,
        payload
      );
      return res.data.data as GradingRuleAttribute;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADING_RULES_QUERY_KEYS.all });
    },
  });
}

export function useUpdateGradingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation<GradingRuleAttribute, Error, { id: number; data: UpdateGradingRuleDto }>({
    mutationFn: async ({ id, data }) => {
      const url = API_ROUTE.EXAMINATION.RULES_UPDATE.replace(":id", String(id));
      const res = await apiClient.patch<ResponseDto<GradingRuleAttribute>>(url, data);
      return res.data.data as GradingRuleAttribute;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADING_RULES_QUERY_KEYS.all });
    },
  });
}

export function useDeleteGradingRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (id: number) => {
      const url = API_ROUTE.EXAMINATION.RULES_DELETE.replace(":id", String(id));
      const res = await apiClient.delete<ResponseDto<{ success: boolean }>>(url);
      return res.data.data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRADING_RULES_QUERY_KEYS.all });
    },
  });
}
