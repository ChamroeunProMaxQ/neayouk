import { QueryClient } from "@tanstack/react-query";

/**
 * Standardized TanStack Query client configuration with stale time and cache strategy.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh duration
      gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
