import { FC, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FindInvoicesSchema,
  PaymentStatusEnum,
  type StudentInvoiceAttribute,
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
import { useInvoicesInfiniteQuery } from "../hooks/use-invoices";
import { GenerateInvoiceDialog } from "./generate-invoice-dialog";
import { PayInvoiceDialog } from "./pay-invoice-dialog";
import { RefundDialog } from "./refund-dialog";
import { PaymentReminderDialog } from "./payment-reminder-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";
import {
  Plus,
  Search,
  DollarSign,
  Eye,
  RefreshCw,
  Bell,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Receipt,
} from "lucide-react";

export const InvoiceListTable: FC = () => {
  const { can } = usePermission();
  const canCreate = can("manage", "fee") || can("create", "fee");
  const canUpdate = can("manage", "fee") || can("update", "fee");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindInvoicesSchema);
  const { search, status, sortBy = "id", sortOrder = "DESC" } = values;
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
  } = useInvoicesInfiniteQuery(queryParams);

  // 3. Flatten Pages
  const accumulatedData = useMemo<StudentInvoiceAttribute[]>(
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

  // Modals state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoiceAttribute | null>(null);

  const handlePay = (inv: StudentInvoiceAttribute) => {
    setSelectedInvoice(inv);
    setPayOpen(true);
  };

  const handleRefund = (inv: StudentInvoiceAttribute) => {
    setSelectedInvoice(inv);
    setRefundOpen(true);
  };

  const handleReminder = (inv: StudentInvoiceAttribute) => {
    setSelectedInvoice(inv);
    setReminderOpen(true);
  };

  const handleViewDetail = (inv: StudentInvoiceAttribute) => {
    setSelectedInvoice(inv);
    setDetailOpen(true);
  };

  const handleSort = (field: "id" | "invoiceNumber" | "billingYear" | "billingMonth" | "totalAmount" | "status" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<StudentInvoiceAttribute>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("invoiceNumber")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Invoice #</span>
            {sortBy === "invoiceNumber" ? (
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
        cell: ({ row }) => (
          <span className="font-bold text-slate-900 text-xs">
            #{row.original.invoiceNumber}
          </span>
        ),
      },
      {
        id: "student",
        header: () => <span className="text-xs font-bold text-slate-700">Student Name</span>,
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div>
              <p className="font-semibold text-slate-900 text-xs">{inv.studentName || `ID: ${inv.studentId}`}</p>
              {inv.studentCode && <p className="text-[11px] font-mono text-slate-500">{inv.studentCode}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: "billingPeriod",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("billingYear")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Billing Period</span>
            {sortBy === "billingYear" ? (
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
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600">
            {row.original.billingMonth}/{row.original.billingYear}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("totalAmount")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Total Amount</span>
            {sortBy === "totalAmount" ? (
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
        accessorKey: "amountPaid",
        header: () => <span className="text-xs font-bold text-slate-700">Amount Paid</span>,
        cell: ({ getValue }) => (
          <span className="font-semibold text-emerald-600 text-xs">
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
            <span>Status</span>
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
          const s = getValue<PaymentStatusEnum>();
          return (
            <Badge
              className={
                s === PaymentStatusEnum.PAID
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[11px]"
                  : s === PaymentStatusEnum.OVERDUE
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
          const inv = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetail(inv)}
                title="View Receipt / Details"
                className="h-7 px-2 text-xs cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> View
              </Button>

              {canUpdate && inv.status !== PaymentStatusEnum.PAID && (
                <Button
                  size="sm"
                  onClick={() => handlePay(inv)}
                  className="h-7 px-2 bg-[#45AC5E] hover:bg-[#389350] text-white text-xs cursor-pointer"
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" /> Pay
                </Button>
              )}

              {canUpdate && inv.status === PaymentStatusEnum.PAID && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRefund(inv)}
                  title="Issue Refund"
                  className="h-7 px-2 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refund
                </Button>
              )}

              {canUpdate && inv.status !== PaymentStatusEnum.PAID && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReminder(inv)}
                  title="Send Reminder"
                  className="h-7 px-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdate]
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
              placeholder="Search invoice or student..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={status ?? ""}
            onChange={(e) => setValues({ status: (e.target.value as PaymentStatusEnum) || undefined })}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value={PaymentStatusEnum.UNPAID}>UNPAID</option>
            <option value={PaymentStatusEnum.PAID}>PAID</option>
            <option value={PaymentStatusEnum.PARTIAL}>PARTIAL</option>
            <option value={PaymentStatusEnum.OVERDUE}>OVERDUE</option>
            <option value={PaymentStatusEnum.WAIVED}>WAIVED</option>
          </select>
        </div>

        {canCreate && (
          <Button
            onClick={() => setGenerateOpen(true)}
            className="bg-[#45AC5E] hover:bg-[#3b9450] text-white font-medium text-xs h-9 px-4 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Generate Invoices
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load invoices."}</span>
        </div>
      )}

      {/* Invoices Data Table */}
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
                  <p className="mt-2 text-xs text-slate-500">Loading student invoices...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No invoices found</p>
                  <p className="text-xs text-slate-400 mt-1">No invoices found matching the search criteria.</p>
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
            <span>Loading more invoices...</span>
          </div>
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          <span>All {totalCount} invoices loaded</span>
        ) : null}
      </div>

      {/* Dialog Modals */}
      <GenerateInvoiceDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <PayInvoiceDialog open={payOpen} onOpenChange={setPayOpen} invoice={selectedInvoice} />
      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} invoice={selectedInvoice} />
      <PaymentReminderDialog open={reminderOpen} onOpenChange={setReminderOpen} invoice={selectedInvoice} />
      <InvoiceDetailDialog open={detailOpen} onOpenChange={setDetailOpen} invoice={selectedInvoice} />
    </div>
  );
};

