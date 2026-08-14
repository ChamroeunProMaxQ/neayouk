---
title: Use TanStack Table (v8) with shadcn/ui Primitives for Data Tables
impact: HIGH
impactDescription: Guarantees standardized headless logic, state management, and accessible UI markup for all tabular data displays.
tags: ui, tanstack-table, shadcn-ui, accessibility, data-table
---

## Use TanStack Table (v8) with shadcn/ui Primitives for Data Tables

**Impact: HIGH (Standardizes data grid logic, search filtering, pagination, and accessible table markup across the application)**

Writing custom HTML `<table>` elements with manual state management loops (`useState`, `.filter()`, manual pagination math) creates inconsistent behavior, accessibility issues, and unmaintainable code.

Always use **TanStack Table (`@tanstack/react-table` v8)** for headless table logic (sorting, searching, filtering, pagination) and render the UI using **shadcn UI Table primitives** (`<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`).

**Incorrect (Manual state loops with raw HTML `<table>` elements):**

```tsx
// ❌ Bad: Manual state filtering and raw <table> markup
export function BadTable({ users }) {
  const [query, setQuery] = useState("");
  const filtered = users.filter(u => u.name.includes(query));

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <table>
        <thead>
          <tr><th>Name</th></tr>
        </thead>
        <tbody>
          {filtered.map(u => <tr key={u.id}><td>{u.name}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
```

**Correct (TanStack Table v8 hook + shadcn/ui Table primitives):**

```tsx
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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

interface User {
  id: string;
  name: string;
  code: string;
}

export function GoodDataTable({ data }: { data: User[] }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Name" },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
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
    </div>
  );
}
```

Reference: [shadcn/ui Data Table Guidelines](https://ui.shadcn.com/docs/components/data-table)
