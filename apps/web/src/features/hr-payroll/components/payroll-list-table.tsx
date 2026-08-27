import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import {
  FindPayrollsSchema,
  PayrollStatusEnum,
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  type PayrollAttribute,
} from "@repo/contracts";
import { usePayrollsInfiniteQuery } from "../hooks/use-payrolls-infinite-query";
import { PayrollStatusBadge } from "./payroll-status-badge";
import { PayrollFormDialog } from "./payroll-form-dialog";
import { PayrollPaymentDialog } from "./payroll-payment-dialog";
import { DeletePayrollDialog } from "./delete-payroll-dialog";
import { PayslipModal } from "./payslip-modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  CreditCard,
  Receipt,
  Clock,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { usePermission } from "@/features/auth";

interface PayrollListTableProps {
  year: number;
  month: number;
}

export function PayrollListTable({ year, month }: PayrollListTableProps) {
  const { can } = usePermission();
  const canManagePayroll = can("create", "hr") || can("manage", "hr");
  const canPayPayroll = can("update", "hr") || can("manage", "hr");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindPayrollsSchema);
  const { search, department, salaryType, status, sortBy = "id", sortOrder = "DESC" } = values;
  const debouncedSearch = useDebounce(search, 600);

  const queryParams = useMemo(
    () => ({
      ...values,
      year: values.year ?? year,
      month: values.month ?? month,
      search: debouncedSearch,
      pageSize: 20,
    }),
    [debouncedSearch, values, year, month]
  );

  // 2. Data Fetching
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePayrollsInfiniteQuery(queryParams);

  // 3. Page Flattening
  const accumulatedData = useMemo<PayrollAttribute[]>(
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

  // Modal Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPayrollForEdit, setSelectedPayrollForEdit] = useState<PayrollAttribute | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPayrollForPay, setSelectedPayrollForPay] = useState<PayrollAttribute | null>(null);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedPayrollForPayslip, setSelectedPayrollForPayslip] = useState<PayrollAttribute | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPayrollForDelete, setSelectedPayrollForDelete] = useState<PayrollAttribute | null>(null);

  const handleOpenCreate = () => {
    setSelectedPayrollForEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (payroll: PayrollAttribute) => {
    setSelectedPayrollForEdit(payroll);
    setFormOpen(true);
  };

  const handleOpenPay = (payroll: PayrollAttribute) => {
    setSelectedPayrollForPay(payroll);
    setPaymentOpen(true);
  };

  const handleOpenPayslip = (payroll: PayrollAttribute) => {
    setSelectedPayrollForPayslip(payroll);
    setPayslipOpen(true);
  };

  const handleOpenDelete = (payroll: PayrollAttribute) => {
    setSelectedPayrollForDelete(payroll);
    setDeleteOpen(true);
  };

  const handleSort = (field: "id" | "payrollNumber" | "salaryType" | "calculatedBaseAmount" | "netSalary" | "status" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<PayrollAttribute>[]>(
    () => [
      {
        accessorKey: "payrollNumber",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("payrollNumber")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Voucher #</span>
            {sortBy === "payrollNumber" ? (
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
          <span className="font-mono text-xs font-semibold text-slate-900">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "staff",
        header: () => <span className="text-xs font-bold text-slate-700">Staff Member</span>,
        cell: ({ row }) => {
          const payroll = row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                <span>{payroll.staff?.name ?? `Staff #${payroll.staffId}`}</span>
                {payroll.staff?.nameKm && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({payroll.staff.nameKm})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-slate-100 text-slate-700">
                  {payroll.staff?.department ?? "STAFF"}
                </Badge>
                <span>{payroll.staff?.designation}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "salaryType",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("salaryType")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Salary Formula</span>
            {sortBy === "salaryType" ? (
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
          const payroll = row.original;
          return (
            <div className="flex flex-col text-xs">
              {payroll.salaryType === StaffSalaryTypeEnum.HOURLY ? (
                <div className="flex items-center gap-1 text-blue-600 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{payroll.totalHoursWorked} hrs @ ${payroll.hourlyRate}/hr</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Fixed Monthly</span>
                </div>
              )}
              <span className="text-[10px] text-slate-400">
                {payroll.workingDays} working days ({payroll.holidayDays} holidays)
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "calculatedBaseAmount",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("calculatedBaseAmount")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Calculated Base</span>
            {sortBy === "calculatedBaseAmount" ? (
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
          <span className="font-medium text-xs text-slate-800">
            ${Number(getValue<number>() || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "adjustments",
        header: () => <span className="text-xs font-bold text-slate-700">Adjustments</span>,
        cell: ({ row }) => {
          const payroll = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              {payroll.totalBonus > 0 && (
                <span className="text-emerald-600 font-medium">
                  +${payroll.totalBonus?.toFixed(2)} bonus
                </span>
              )}
              {payroll.totalDeduction > 0 && (
                <span className="text-rose-600 font-medium">
                  -${payroll.totalDeduction?.toFixed(2)} ded.
                </span>
              )}
              {payroll.totalBonus === 0 && payroll.totalDeduction === 0 && (
                <span className="text-slate-400 text-[11px]">None</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "netSalary",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("netSalary")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Net Pay</span>
            {sortBy === "netSalary" ? (
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
          <span className="font-bold text-xs text-slate-900">
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
        cell: ({ getValue }) => <PayrollStatusBadge status={getValue<PayrollStatusEnum>()} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const payroll = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {/* View / Print A5 Payslip */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
                onClick={() => handleOpenPayslip(payroll)}
                title="View & Print A5 Payslip"
              >
                <Printer className="h-4 w-4" />
              </Button>

              {/* Pay Trigger (if DRAFT) */}
              {payroll.status === PayrollStatusEnum.DRAFT && canPayPayroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => handleOpenPay(payroll)}
                  title="Record Payment Disbursement"
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              )}

              {/* Edit (if DRAFT) */}
              {payroll.status === PayrollStatusEnum.DRAFT && canManagePayroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
                  onClick={() => handleOpenEdit(payroll)}
                  title="Edit Payroll Draft"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}

              {/* Delete (if DRAFT or CANCELLED) */}
              {payroll.status !== PayrollStatusEnum.PAID && canManagePayroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  onClick={() => handleOpenDelete(payroll)}
                  title="Delete / Void Payroll"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canPayPayroll, canManagePayroll]
  );

  const table = useReactTable({
    data: accumulatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by voucher #, staff name..."
              value={search ?? ""}
              onChange={(e) => setValues({ search: e.target.value || undefined })}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Department Filter */}
          <select
            aria-label="Filter by department"
            value={department ?? ""}
            onChange={(e) =>
              setValues({
                department: (e.target.value as StaffDepartmentEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Departments</option>
            {Object.values(StaffDepartmentEnum).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Salary Type Filter */}
          <select
            aria-label="Filter by salary type"
            value={salaryType ?? ""}
            onChange={(e) =>
              setValues({
                salaryType: (e.target.value as StaffSalaryTypeEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Salary Types</option>
            <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Fixed</option>
            <option value={StaffSalaryTypeEnum.HOURLY}>Hourly Rate</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            value={status ?? ""}
            onChange={(e) =>
              setValues({
                status: (e.target.value as PayrollStatusEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value={PayrollStatusEnum.DRAFT}>Draft</option>
            <option value={PayrollStatusEnum.PAID}>Paid</option>
            <option value={PayrollStatusEnum.CANCELLED}>Cancelled</option>
          </select>
        </div>

        {canManagePayroll && (
          <Button
            onClick={handleOpenCreate}
            className="bg-[#45AC5E] hover:bg-[#3b9450] text-white font-medium text-xs h-9 px-4 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Individual Payroll
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load payroll records."}</span>
        </div>
      )}

      {/* Payrolls Table */}
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
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#45AC5E]" />
                    <span>Loading payroll records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Receipt className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No payroll records for this period</p>
                    <p className="text-xs">Create an individual payroll voucher for a staff member.</p>
                  </div>
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

        {/* Infinite Scroll Indicator */}
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
              <span>Loading more payroll vouchers...</span>
            </div>
          )}
          {!hasNextPage && accumulatedData.length > 0 && (
            <p className="text-xs text-slate-400">
              All {totalCount} payroll vouchers loaded
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <PayrollFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        payroll={selectedPayrollForEdit}
        defaultYear={year}
        defaultMonth={month}
      />

      <PayrollPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        payroll={selectedPayrollForPay}
      />

      <PayslipModal
        open={payslipOpen}
        onOpenChange={setPayslipOpen}
        payroll={selectedPayrollForPayslip}
      />

      <DeletePayrollDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        payroll={selectedPayrollForDelete}
      />
    </div>
  );
}

