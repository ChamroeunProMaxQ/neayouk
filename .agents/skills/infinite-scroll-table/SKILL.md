---
name: infinite-scroll-table
description: Mandatory rules and patterns for implementing infinite scroll data tables in React using TanStack Query's useInfiniteQuery and TanStack Table v8. Prohibits using standard useQuery with manual state accumulation for infinite scrolling.
---

# Infinite Scroll Table Best Practices

This skill mandates using **`useInfiniteQuery`** (TanStack Query / React Query) whenever building an **infinite scroll data table, list, or feed**. Standard `useQuery` with manual React state page accumulation is strictly anti-pattern for infinite scroll implementations.

---

## Mandatory Directives

1. **Always Use `useInfiniteQuery`**: Any table or list requiring continuous background data fetching on scroll MUST use `useInfiniteQuery`.
2. **Prohibited Anti-Pattern**: Never use standard `useQuery` combined with manual state (`const [accumulatedData, setAccumulatedData] = useState([])`) and manual `useEffect` syncing to append pages.
3. **Data Flattening via `useMemo`**: Derive table rows by flattening `data.pages` using `useMemo`:
   ```tsx
   const flatData = useMemo(
     () => data?.pages.flatMap((page) => page.data) ?? [],
     [data]
   );
   ```
4. **Sentinel Observation**: Trigger `fetchNextPage()` using an `IntersectionObserver` attached to a sentinel element placed right below the table body or loader row.
5. **Query Key Parameter Isolation**: Pass search, filters, and sort options into `queryKey`. When filters change, TanStack Query automatically resets page state and fetches from page 1 safely.

---

## Standard Infinite Scroll Hook Pattern

Custom hook wrapping `useInfiniteQuery`:

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { API_ROUTE, type ResponseDto, type UserAttribute, type FindUsersDto } from "@repo/contracts";

export interface UseUsersInfiniteQueryParams extends Omit<Partial<FindUsersDto>, "page"> {
  enabled?: boolean;
}

export function useUsersInfiniteQuery(params: UseUsersInfiniteQueryParams = {}) {
  const { enabled = true, pageSize = 20, ...filters } = params;

  return useInfiniteQuery<ResponseDto<UserAttribute[]>, Error>({
    queryKey: ["users", "infinite", { pageSize, ...filters }],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams({
        ...filters,
        page: String(pageParam),
        pageSize: String(pageSize),
      });

      const response = await fetch(`${API_ROUTE.USER.LIST}?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const meta = lastPage.meta; // e.g. { page: 1, totalPages: 5 }
      if (!meta || meta.page >= meta.totalPages) return undefined;
      return meta.page + 1;
    },
    enabled,
  });
}
```

---

## Anti-Pattern vs Recommended Pattern

### ❌ Anti-Pattern: `useQuery` + Manual `useState` Accumulation

```tsx
// ❌ WRONG: Manual page tracking & state accumulation
const [page, setPage] = useState(1);
const [accumulatedUsers, setAccumulatedUsers] = useState<UserAttribute[]>([]);

const { data } = useUsersQuery({ page, pageSize: 20, search });

// Complex, fragile useEffect prone to race conditions and stale cache on filter change
useEffect(() => {
  if (data?.data) {
    setAccumulatedUsers((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }
}, [data, page]);
```

---

### ✅ Recommended Pattern: `useInfiniteQuery` + `useReactTable` + Sentinel

```tsx
import React, { useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useUsersInfiniteQuery } from "../hooks/use-users-infinite-query";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";

export const UserListTable: React.FC = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useUsersInfiniteQuery({ search, sortBy, sortOrder });

  // 1. Flatten all loaded pages into a single rows array
  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  // 2. Pass flattened data into TanStack Table
  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 3. Attach IntersectionObserver sentinel ref
  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 4. Infinite scroll sentinel & status indicators */}
      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage && <p className="text-sm text-muted-foreground">Loading more users...</p>}
        {!hasNextPage && flatData.length > 0 && (
          <p className="text-sm text-muted-foreground">End of results</p>
        )}
      </div>
    </div>
  );
};
```

---

## Checklist for Implementation

- [ ] Wrap API in `useInfiniteQuery` with explicit `getNextPageParam`.
- [ ] Flatten `data.pages` into a `flatData` array using `useMemo`.
- [ ] Bind `flatData` directly to `useReactTable({ data: flatData, ... })`.
- [ ] Place an `IntersectionObserver` sentinel element below the table body.
- [ ] Avoid keeping local state (`accumulatedUsers`, `page`) for infinite table pagination.
- [ ] Invalidate infinite query keys (`queryClient.invalidateQueries({ queryKey: [...] })`) after mutations to automatically update all active pages.
