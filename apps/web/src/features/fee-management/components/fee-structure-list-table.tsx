import { FC, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FindFeeStructuresSchema,
  FeeCategoryEnum,
  BillingCycleEnum,
  type FeeStructureAttribute,
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
  useFeeStructuresInfiniteQuery,
  useDeleteFeeStructureMutation,
} from "../hooks/use-fee-structures";
import { FeeStructureDialog } from "./fee-structure-dialog";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Receipt,
} from "lucide-react";

export const FeeStructureListTable: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "fee") || can("create", "fee");
  const canUpdate = can("manage", "fee") || can("update", "fee");
  const canDelete = can("manage", "fee") || can("delete", "fee");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindFeeStructuresSchema);
  const { search, category, billingCycle, isActive, sortBy = "id", sortOrder = "DESC" } = values;
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
  } = useFeeStructuresInfiniteQuery(queryParams);

  const deleteMutation = useDeleteFeeStructureMutation();

  // 3. Flatten Pages
  const accumulatedData = useMemo<FeeStructureAttribute[]>(
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
  const [selectedFee, setSelectedFee] = useState<FeeStructureAttribute | null>(null);

  const handleCreate = () => {
    setSelectedFee(null);
    setDialogOpen(true);
  };

  const handleEdit = (fee: FeeStructureAttribute) => {
    setSelectedFee(fee);
    setDialogOpen(true);
  };

  const handleDelete = (fee: FeeStructureAttribute) => {
    if (confirm(`Are you sure you want to delete fee structure "${fee.name}"?`)) {
      deleteMutation.mutate(fee.id);
    }
  };

  const handleSort = (field: "id" | "name" | "category" | "amount" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<FeeStructureAttribute>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Fee Name / Item</span>
            {sortBy === "name" ? (
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
          const fee = row.original;
          return (
            <div className="font-semibold text-slate-900 text-xs">
              {fee.name}
              {fee.description && (
                <p className="text-[11px] font-normal text-slate-500">{fee.description}</p>
              )}
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
            <Tag className="mr-1 h-3 w-3" /> {getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: "billingCycle",
        header: () => <span className="text-xs font-bold text-slate-700">Billing Cycle</span>,
        cell: ({ getValue }) => (
          <span className="flex items-center text-xs text-slate-600 font-medium">
            <Calendar className="mr-1 h-3 w-3 text-slate-400" />
            {getValue<string>()}
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
        accessorKey: "isOptional",
        header: () => <span className="text-xs font-bold text-slate-700">Optional</span>,
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[11px]">Optional</Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500 text-[11px]">Mandatory</Badge>
          ),
      },
      {
        accessorKey: "isActive",
        header: () => <span className="text-xs font-bold text-slate-700">Status</span>,
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[11px]">Active</Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400 text-[11px]">Inactive</Badge>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const fee = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdate && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(fee)}
                  className="h-8 w-8 text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Edit Fee Structure"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(fee)}
                  className="h-8 w-8 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete Fee Structure"
                >
                  <Trash2 className="h-4 w-4" />
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
      {/* Top Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={search ?? ""}
              onChange={(e) => setValues({ search: e.target.value })}
              placeholder="Search fee structures..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category ?? ""}
            onChange={(e) => setValues({ category: (e.target.value as FeeCategoryEnum) || undefined })}
            aria-label="Filter by category"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {Object.values(FeeCategoryEnum).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Billing Cycle Filter */}
          <select
            value={billingCycle ?? ""}
            onChange={(e) => setValues({ billingCycle: (e.target.value as BillingCycleEnum) || undefined })}
            aria-label="Filter by billing cycle"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Cycles</option>
            {Object.values(BillingCycleEnum).map((bc) => (
              <option key={bc} value={bc}>
                {bc}
              </option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={isActive === true ? "true" : isActive === false ? "false" : ""}
            onChange={(e) =>
              setValues({
                isActive: e.target.value === "true" ? true : e.target.value === "false" ? false : undefined,
              })
            }
            aria-label="Filter by active status"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {canManage && (
          <Button
            onClick={handleCreate}
            className="bg-[#45AC5E] hover:bg-[#3b9450] text-white font-medium text-xs h-9 px-4 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Fee Structure
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load fee structures."}</span>
        </div>
      )}

      {/* Table */}
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
                  <p className="mt-2 text-xs text-slate-500">Loading fee structures...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No fee structures found</p>
                  <p className="text-xs text-slate-400 mt-1">Click &ldquo;Add Fee Structure&rdquo; to create one.</p>
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
            <span>Loading more fee structures...</span>
          </div>
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          <span>All {totalCount} fee structures loaded</span>
        ) : null}
      </div>

      {/* Dialog Modal */}
      <FeeStructureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feeStructure={selectedFee}
      />
    </div>
  );
};

