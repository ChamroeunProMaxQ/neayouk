---
name: tanstack-table-best-practices
description: Production-grade best practices, architecture patterns, and conventions for building data tables using TanStack Table (v8) with React and shadcn/ui primitives.
license: MIT
metadata:
  author: Antigravity
  version: "1.0.0"
---

# TanStack Table Best Practices & Architecture Patterns

Comprehensive guidelines for implementing scalable, type-safe data tables in React applications using **TanStack Table (v8)** and **shadcn/ui** primitive components.

---

## 🏛️ Core Principles

1. **Separation of Concerns**:
   - **TanStack Table (`@tanstack/react-table`)** handles headless logic, state, sorting, filtering, searching, pagination, and selection.
   - **shadcn UI Table primitives (`@/components/ui/table`)** handle visual markup and Tailwind CSS styling (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
2. **Never Use Raw `<table>` Elements directly**:
   - Always wrap TanStack Table hooks with shadcn UI primitive components.
3. **Strict Type Safety**:
   - Explicitly type row data models and column definitions using `ColumnDef<TData>[]`.
4. **Memoization**:
   - Wrap `columns` definitions in `useMemo` to prevent infinite re-renders or unnecessary recalculations.

---

## 🛠️ Package Dependency Requirement

Ensure `@tanstack/react-table` (stable `v8.x`, e.g., `^8.20.6`) is installed in your frontend package:

```bash
pnpm --filter web add @tanstack/react-table@^8.20.6
```

> [!WARNING]
> Do not install `@tanstack/react-table@latest` without pinning to `^8.x.x` if the application relies on v8 API exports (`getCoreRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, `getSortedRowModel`).

---

## 📐 Component Architecture Pattern

```
┌────────────────────────────────────────────────────────┐
│               Data Table Container Component           │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │ Top Toolbar (Search, Filter, Actions, Export)  │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │ useReactTable Hook                             │   │
│   │  ├── data & columns (memoized)                 │   │
│   │  ├── getCoreRowModel()                         │   │
│   │  ├── getFilteredRowModel()                     │   │
│   │  └── getPaginationRowModel()                   │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │ shadcn/ui Table Primitives                     │   │
│   │  ├── <Table>                                   │   │
│   │  │    ├── <TableHeader> -> <TableRow> -> ...   │   │
│   │  │    └── <TableBody>   -> <TableRow> -> ...   │   │
│   │  └── </Table>                                  │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │ Bottom Pagination Controls & Page Info         │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Code Template & Pattern

### 1. Column Definition (`columns.tsx`)

```tsx
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit3, Trash2 } from "lucide-react";

export interface UserRow {
  id: string;
  code: string;
  name: string;
  username: string;
}

export function useUserColumns(onEdit?: (user: UserRow) => void, onDelete?: (user: UserRow) => void) {
  return useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => <span className="font-semibold text-xs text-slate-900">{getValue<string>()}</span>,
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{getValue<string>()}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onEdit?.(user)}
                className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200"
                aria-label={`Edit ${user.name}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete?.(user)}
                className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100"
                aria-label={`Delete ${user.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );
}
```

### 2. Table Implementation (`data-table.tsx`)

```tsx
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function UserDataTable({ data, columns }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="px-3 py-2 text-sm border rounded-lg"
      />

      {/* Table Render */}
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-slate-400">
                  No data found
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
    </div>
  );
}
```

---

## ⚡ Quick Checklist for Code Reviews

- [ ] Is `@tanstack/react-table` (v8) used for table state management?
- [ ] Are shadcn UI primitives (`<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`) used for rendering HTML markup?
- [ ] Are `columns` definitions memoized via `useMemo`?
- [ ] Are cell renders wrapped in `flexRender(cell.column.columnDef.cell, cell.getContext())`?
- [ ] Is `globalFilter` or column filter state managed through `useReactTable` state options?
- [ ] Are interactive buttons provided with accessible `aria-label` attributes?
