---
title: Use TanStack Table (v8) with Infinite Scroll, URL Search Params, and shadcn/ui Primitives
impact: HIGH
impactDescription: Guarantees standardized headless logic, state management, infinite scroll, URL query param sync, and accessible UI markup for all data tables.
tags: ui, tanstack-table, shadcn-ui, infinite-scroll, search-params, accessibility, data-table
---

## Use TanStack Table (v8) with Infinite Scroll, URL Search Params, and shadcn/ui Primitives

**Impact: HIGH (Standardizes data grid logic, URL query parameter state persistence, infinite scroll loading, contract schema validation, and accessible table markup across the application)**

### Non-Negotiable Table Rules

1. **Always Use TanStack Table (`@tanstack/react-table` v8)**:
   - Use `useReactTable` with `getCoreRowModel()` and `manualSorting: true` for server-driven data table features.
2. **Always Use shadcn UI Table Primitives**:
   - Render table markup using `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`.
3. **Mandatory Infinite Scroll (NO Next/Previous Pagination Buttons)**:
   - **Do NOT render Next or Previous pagination buttons** (`<ChevronLeft>`, `<ChevronRight>`).
   - Use `useInfiniteQuery` (TanStack Query) to load pages and flatten them with `useMemo(() => data?.pages.flatMap(page => page.data ?? []) ?? [], [data])`.
   - Attach an `IntersectionObserver` sentinel element via `useInfiniteScroll` below the table body to trigger `fetchNextPage()`.
4. **Mandatory URL Parameter Sync (`useUrlFilters` + Schema)**:
   - Every filter (search text, filter dropdowns, sort field, sort direction) MUST sync with URL parameters via `useUrlFilters(ZodSchema)` using schemas from `@repo/contracts` (e.g. `FindUsersSchema`).
   - Search input values MUST be debounced using `useDebounce(search, 800)` before triggering query parameter refetches.
5. **Server-Side Sorting via Header Controls**:
   - Implement header sorting using a ghost `Button` toggling `sortOrder` ("ASC" vs "DESC") or `sortBy` field via `setValues`.
   - Show dynamic green icons (`ArrowUp` / `ArrowDown`) when active and neutral icon (`ArrowUpDown`) when inactive.
6. **CRUD Modal Dialog & Mutation Integration**:
   - Modularize create/edit forms (`<EntityFormDialog>`) and deletion confirmation (`<DeleteEntityDialog>`).
   - Submit handlers MUST await mutation calls and reset modal state (`setIsFormDialogOpen(false)`).
7. **Comprehensive State Presentation**:
   - Render distinct initial loading spinner (`Loader2 animate-spin`), empty state message, error banner (`isError`), and bottom sentinel pagination status ("All X items loaded").

---

### Incorrect (Local-only state without URL sync, contract schemas, or debouncing):

```tsx
// ❌ Bad: Local state only without URL parameter syncing, debouncing, or contract integration
export function BadTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // ❌ Missing URL query param sync with useUrlFilters
  // ❌ Manual pagination buttons instead of infinite scroll
  return <div>...</div>;
}
```

---

### Correct (TanStack Table v8 + `useUrlFilters` + Infinite Scroll + `@repo/contracts`):

Canonical production implementation reference from [`user-list-table.tsx`](file:///e:/work/neayouk/apps/web/src/features/users/components/user-list-table.tsx):

```tsx
import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search, UserPlus, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Loader2, AlertCircle } from "lucide-react";
import { FindUsersSchema, UserStatusEnum, UserTypeEnum, type UserAttribute } from "@repo/contracts";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUsersInfiniteQuery } from "../hooks/use-users-query";
import { useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "../hooks/use-user-mutations";
import { UserFormDialog, type UserFormValues } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";

export const UserListTable: FC = () => {
  const { values, setValue, setValues } = useUrlFilters(FindUsersSchema);
  const { search, userType, sortBy, sortOrder } = values;

  const debouncedSearch = useDebounce(search, 800);

  const queryParams = useMemo(
    () => ({ ...values, search: debouncedSearch, pageSize: 20 }),
    [debouncedSearch, values]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useUsersInfiniteQuery(queryParams);

  const accumulatedUsers = useMemo<UserAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const columns = useMemo<ColumnDef<UserAttribute>[]>(
    () => [
      {
        accessorKey: "username",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setValues({ sortBy: "username", sortOrder: sortBy === "username" && sortOrder === "ASC" ? "DESC" : "ASC" })}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E]"
          >
            <span>Username</span>
            {sortBy === "username" ? (sortOrder === "ASC" ? <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />) : <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
          </Button>
        ),
        cell: ({ getValue }) => <span className="font-semibold text-xs">{getValue<string>()}</span>,
      },
      // ... additional columns
    ],
    [sortBy, sortOrder]
  );

  const table = useReactTable({
    data: accumulatedUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-6">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setValue("search", e.target.value)}
            className="pl-3 pr-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
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
            {accumulatedUsers.length === 0 && isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#45AC5E]" />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sentinel indicator */}
      <div ref={sentinelRef} className="py-2 text-center text-xs text-slate-400">
        {isFetchingNextPage ? "Loading more..." : !hasNextPage && accumulatedUsers.length > 0 ? "All items loaded" : null}
      </div>
    </div>
  );
};
```

Reference: [shadcn/ui Data Table Guidelines](https://ui.shadcn.com/docs/components/data-table)
