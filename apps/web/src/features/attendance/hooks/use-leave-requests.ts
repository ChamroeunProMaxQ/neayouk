import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import queryString from "query-string";
import {
  API_ROUTE,
  type CreateLeaveRequestDto,
  type FindLeaveRequestsDto,
  type LeaveRequestAttribute,
  type ResponseDto,
  type ReviewLeaveRequestDto,
  type UpdateLeaveRequestDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export const LEAVE_REQUEST_QUERY_KEYS = {
  all: ["leave-requests"] as const,
  lists: () => [...LEAVE_REQUEST_QUERY_KEYS.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...LEAVE_REQUEST_QUERY_KEYS.lists(), params] as const,
  detail: (id: number | string) => [...LEAVE_REQUEST_QUERY_KEYS.all, "detail", id] as const,
};

export function useLeaveRequestsInfiniteQuery(params: FindLeaveRequestsDto) {
  return useInfiniteQuery<ResponseDto<LeaveRequestAttribute[]>>({
    queryKey: LEAVE_REQUEST_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn: async ({ pageParam = 1 }) => {
      const query = queryString.stringify(
        {
          ...params,
          page: pageParam,
          pageSize: params.pageSize ?? 20,
        },
        { skipNull: true, skipEmptyString: true }
      );
      const res = await apiClient.get<ResponseDto<LeaveRequestAttribute[]>>(
        `${API_ROUTE.ATTENDANCE.LEAVE_REQUESTS}?${query}`
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      const { page, totalPage } = pagination;
      return page < totalPage ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useLeaveRequestDetailQuery(id?: number) {
  return useQuery<LeaveRequestAttribute>({
    queryKey: LEAVE_REQUEST_QUERY_KEYS.detail(id ?? 0),
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const res = await apiClient.get<ResponseDto<LeaveRequestAttribute>>(
        API_ROUTE.ATTENDANCE.LEAVE_REQUEST_GET.replace(":id", String(id))
      );
      return res.data.data as LeaveRequestAttribute;
    },
    enabled: Boolean(id),
  });
}

export function useCreateLeaveRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLeaveRequestDto) => {
      const res = await apiClient.post<ResponseDto<LeaveRequestAttribute>>(
        API_ROUTE.ATTENDANCE.LEAVE_REQUEST_CREATE,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_REQUEST_QUERY_KEYS.all });
    },
  });
}

export function useUpdateLeaveRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateLeaveRequestDto }) => {
      const res = await apiClient.patch<ResponseDto<LeaveRequestAttribute>>(
        API_ROUTE.ATTENDANCE.LEAVE_REQUEST_UPDATE.replace(":id", String(id)),
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_REQUEST_QUERY_KEYS.all });
    },
  });
}

export function useReviewLeaveRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ReviewLeaveRequestDto }) => {
      const res = await apiClient.post<ResponseDto<LeaveRequestAttribute>>(
        API_ROUTE.ATTENDANCE.LEAVE_REQUEST_REVIEW.replace(":id", String(id)),
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_REQUEST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendances"] });
    },
  });
}

export function useDeleteLeaveRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<ResponseDto<{ success: boolean }>>(
        API_ROUTE.ATTENDANCE.LEAVE_REQUEST_DELETE.replace(":id", String(id))
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_REQUEST_QUERY_KEYS.all });
    },
  });
}
