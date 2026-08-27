import { FC, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FindSchoolExpensesSchema,
  ExpenseCategoryEnum,
  ExpenseStatusEnum,
  type SchoolExpenseAttribute,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { usePermission } from "@/features/auth";
import {
  useExpensesInfiniteQuery,
  useApproveExpenseMutation,
  useDeleteExpenseMutation,
} from "../hooks/use-expenses";
import { ExpenseDialog } from "./expense-dialog";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Receipt,
} from "lucide-react";

export const ExpenseListTable: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "fee") || can("create", "fee");
  const canUpdate = can("manage", "fee") || can("update", "fee");
  const canDelete = can("manage", "fee") || can("delete", "fee");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindSchoolExpensesSchema);
  const { search, category, status, sortBy = "id", sortOrder = "DESC" } = values;
  const debouncedSearch = useDebounce(search, 600);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize: 20,
    }),
    [debouncedSearch, values]
  );

  // 2. Data Fetching via Infinite Query
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExpensesInfiniteQuery(queryParams);

  const approveMutation = useApproveExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();

  // 3. Flatten Pages
  const accumulatedData = useMemo<SchoolExpenseAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const totalCount =
    data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length;

  // 4. Infinite Scroll Sentinel
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<SchoolExpenseAttribute | null>(null);

  const handleCreate = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleEdit = (exp: SchoolExpenseAttribute) => {
    setSelectedExpense(exp);
    setDialogOpen(true);
  };

  const handleApprove = (
    exp: SchoolExpenseAttribute,
    nextStatus: ExpenseStatusEnum.APPROVED | ExpenseStatusEnum.PAID | ExpenseStatusEnum.REJECTED
  ) => {
    approveMutation.mutate({ id: exp.id, dto: { status: nextStatus } });
  };

  const handleDelete = (exp: SchoolExpenseAttribute) => {
    if (confirm(`Are you sure you want to delete expense "${exp.title}"?`)) {
      deleteMutation.mutate(exp.id);
    }
  };

  const handleSort = (field: "id" | "title" | "category" | "expenseDate" | "amount" | "status" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<SchoolExpenseAttribute>[]>(
    () => [
      {
        accessorKey: "title",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("title")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Title & Details</span>
            {sortBy === "title" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const exp = row.original;
          return (
            <div>
              <p className="font-semibold text-slate-900 text-xs">{exp.title}</p>
              {exp.receiptRef && <p className="text-[11px] text-slate-500 font-mono">Ref: {exp.receiptRef}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("category")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Category</span>
            {sortBy === "category" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="bg-slate-100 font-medium text-slate-700 text-[11px]">
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: "expenseDate",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("expenseDate")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Incur Date</span>
            {sortBy === "expenseDate" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs font-medium text-slate-600">
            {String(getValue<string | Date>())}
          </span>
        ),
      },
      {
        accessorKey: "vendor",
        header: () => <span className="text-xs font-bold text-slate-700">Vendor / Payee</span>,
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-800 font-medium">
            {getValue<string>() || "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("amount")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Amount ($)</span>
            {sortBy === "amount" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-bold text-slate-900 text-xs">
            ${Number(getValue<number>() || 0).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("status")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Approval Status</span>
            {sortBy === "status" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => {
          const s = getValue<ExpenseStatusEnum>();
          return (
            <Badge
              className={
                s === ExpenseStatusEnum.APPROVED || s === ExpenseStatusEnum.PAID
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[11px]"
                  : s === ExpenseStatusEnum.REJECTED
                  ? "bg-rose-100 text-rose-800 hover:bg-rose-100 text-[11px]"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 text-[11px]"
              }
            >
              {s}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const exp = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && exp.status === ExpenseStatusEnum.PENDING && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(exp, ExpenseStatusEnum.APPROVED)}
                    title="Approve Expense"
                    className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(exp, ExpenseStatusEnum.REJECTED)}
                    title="Reject Expense"
                    className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </>
              )}

              {canUpdate && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(exp)}
                  className="h-7 w-7 text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Edit Expense"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}

              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(exp)}
                  className="h-7 w-7 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete Expense"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdate, canDelete]
  );

  const table = useReactTable({
    data: accumulatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={search ?? ""}
              onChange={(e) => setValues({ search: e.target.value })}
              placeholder="Search expenses or vendor..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={category ?? ""}
            onChange={(e) => setValues({ category: (e.target.value as ExpenseCategoryEnum) || undefined })}
            aria-label="Filter by category"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {Object.values(ExpenseCategoryEnum).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={status ?? ""}
            onChange={(e) => setValues({ status: (e.target.value as ExpenseStatusEnum) || undefined })}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value={ExpenseStatusEnum.PENDING}>PENDING</option>
            <option value={ExpenseStatusEnum.APPROVED}>APPROVED</option>
            <option value={ExpenseStatusEnum.PAID}>PAID</option>
            <option value={ExpenseStatusEnum.REJECTED}>REJECTED</option>
          </select>
        </div>

        {canManage && (
          <Button
            onClick={handleCreate}
            className="bg-[#45AC5E] hover:bg-[#3b9450] text-white font-medium text-xs h-9 px-4 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Expense
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load expenses."}</span>
        </div>
      )}

      {/* Expenses Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/80">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-xs font-bold text-slate-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#45AC5E]" />
                  <p className="mt-2 text-xs text-slate-500">Loading operational expenses...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No expenses recorded</p>
                  <p className="text-xs text-slate-400 mt-1">Click &ldquo;Record Expense&rdquo; to create one.</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
            <span>Loading more expenses...</span>
          </div>
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          <span>All {totalCount} expenses loaded</span>
        ) : null}
      </div>

      {/* Expense Dialog */}
      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={selectedExpense} />
    </div>
  );
};

