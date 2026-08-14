---
title: Use TanStack Table (v8) with Infinite Scroll, URL Search Params, and shadcn/ui Primitives
impact: HIGH
impactDescription: Guarantees standardized headless logic, state management, infinite scroll, URL query param sync, and accessible UI markup for all data tables.
tags: ui, tanstack-table, shadcn-ui, infinite-scroll, search-params, accessibility, data-table
---

## Use TanStack Table (v8) with Infinite Scroll, URL Search Params, and shadcn/ui Primitives

**Impact: HIGH (Standardizes data grid logic, URL query parameter state persistence, infinite scroll loading, and accessible table markup across the application)**

### Non-Negotiable Table Rules

1. **Always Use TanStack Table (`@tanstack/react-table` v8)**:
   - Use `useReactTable` for headless table logic (sorting, searching, filtering, row mapping).
2. **Always Use shadcn UI Table Primitives**:
   - Render UI using `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`.
3. **Mandatory Infinite Scroll (NO Next/Previous Pagination Buttons)**:
   - **Do NOT render Next or Previous pagination buttons** (`<ChevronLeft>`, `<ChevronRight>`).
   - Use **Infinite Scroll** with an `IntersectionObserver` sentinel element (or scroll listener / `useInfiniteQuery`) to automatically fetch and append subsequent pages as the user scrolls down.
4. **Mandatory URL Query Parameter Synchronization (`useSearchParams`)**:
   - Every filter change (search input, role selection, status selection) and column header sort toggle MUST push/sync its value to URL query parameters via `useSearchParams` (e.g., `?search=alice&role=ADMIN&status=deleted&sortBy=username&sortOrder=ASC`).
   - Component initial filter/sort state MUST be read from `useSearchParams()` so refreshing or sharing table links restores the exact state.

---

### Incorrect (Local-only state without URL sync or Next/Previous buttons):

```tsx
// ❌ Bad: Local state only without URL query parameter syncing
export function BadTable() {
  const [search, setSearch] = useState("");
  // ❌ Missing URL query param sync with useSearchParams
  return <div>...</div>;
}
```

---

### Correct (TanStack Table v8 + URL Params Sync + Infinite Scroll):

```tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  code: string;
}

export function InfiniteDataTable({
  data,
  columns,
  hasMore,
  isLoading,
  onLoadMore,
}: {
  data: User[];
  columns: ColumnDef<User>[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (value) p.set("search", value);
      else p.delete("search");
      return p;
    }, { replace: true });
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, isLoading, onLoadMore]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="px-3 py-2 text-sm border rounded-lg"
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
      </div>

      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-500">
        {isLoading && <span>Loading more items...</span>}
      </div>
    </div>
  );
}
```

Reference: [shadcn/ui Data Table Guidelines](https://ui.shadcn.com/docs/components/data-table)
