# Infinite Scroll Data Table Rule

This rule defines mandatory architecture and implementation patterns for data tables using **TanStack Query `useInfiniteQuery`** and **TanStack Table v8** in React frontend applications.

---

## Core Directives

1. **Use `useInfiniteQuery`**: Data fetching for tables MUST use `useInfiniteQuery` (NEVER standard `useQuery` with manual array appending).
2. **Page Array Flattening**: Derive table row data using `useMemo` with `flatMap`:
   ```tsx
   const accumulatedData = useMemo<EntityAttribute[]>(
     () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
     [data]
   );
   ```
3. **Bottom Sentinel**: Attach an `IntersectionObserver` sentinel element (via `useInfiniteScroll`) to trigger `fetchNextPage()` when the user scrolls near the bottom.
4. **URL Filter Sync**: Sync pagination, search, and sorting states with URL search params using `useUrlFilters`.
