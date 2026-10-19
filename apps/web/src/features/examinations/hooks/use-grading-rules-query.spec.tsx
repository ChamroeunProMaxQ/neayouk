import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useUpdateGradingRuleMutation,
  useCreateGradingRuleMutation,
  useDeleteGradingRuleMutation,
  GRADING_RULES_QUERY_KEYS,
} from "./use-grading-rules-query";
import { GRADEBOOK_QUERY_KEYS } from "./use-gradebook-matrix-query";
import { apiClient } from "@/shared/lib/api-client";
import { DefaultGradingComponents, DefaultGradeScale } from "@repo/contracts";

describe("useGradingRules mutations - Cache Invalidation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("invalidates both grading-rules and gradebook queries when updating a grading rule", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          name: "Updated Scheme",
          components: DefaultGradingComponents,
          gradeScale: DefaultGradeScale,
        },
      },
    });

    const { result } = renderHook(() => useUpdateGradingRuleMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 1,
        data: { name: "Updated Scheme" },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADING_RULES_QUERY_KEYS.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADEBOOK_QUERY_KEYS.all,
      });
    });
  });

  it("invalidates both grading-rules and gradebook queries when creating a grading rule", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        data: {
          id: 2,
          name: "New Scheme",
          code: "RULE-NEW",
          components: DefaultGradingComponents,
          gradeScale: DefaultGradeScale,
          isDefault: true,
          status: "ACTIVE",
        },
      },
    });

    const { result } = renderHook(() => useCreateGradingRuleMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        name: "New Scheme",
        code: "RULE-NEW",
        components: DefaultGradingComponents,
        gradeScale: DefaultGradeScale,
        isDefault: true,
        status: "ACTIVE",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADING_RULES_QUERY_KEYS.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADEBOOK_QUERY_KEYS.all,
      });
    });
  });

  it("invalidates both grading-rules and gradebook queries when deleting a grading rule", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
      data: {
        data: { success: true },
      },
    });

    const { result } = renderHook(() => useDeleteGradingRuleMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADING_RULES_QUERY_KEYS.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GRADEBOOK_QUERY_KEYS.all,
      });
    });
  });
});
