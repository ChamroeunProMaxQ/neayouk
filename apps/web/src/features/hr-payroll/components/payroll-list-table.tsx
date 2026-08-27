import { useMemo, useState } from "react";
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
  const debouncedSearch = useDebounce(values.search, 800);

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePayrollsInfiniteQuery(queryParams);

  // 3. Page Flattening
  const accumulatedData = useMemo<PayrollAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

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

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by voucher #, staff name..."
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value || undefined })}
              className="pl-8"
            />
          </div>

          {/* Department Filter */}
          <select
            aria-label="Filter by department"
            value={values.department ?? ""}
            onChange={(e) =>
              setValues({
                department: (e.target.value as StaffDepartmentEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            value={values.salaryType ?? ""}
            onChange={(e) =>
              setValues({
                salaryType: (e.target.value as StaffSalaryTypeEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Salary Types</option>
            <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Fixed</option>
            <option value={StaffSalaryTypeEnum.HOURLY}>Hourly Rate</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            value={values.status ?? ""}
            onChange={(e) =>
              setValues({
                status: (e.target.value as PayrollStatusEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value={PayrollStatusEnum.DRAFT}>Draft</option>
            <option value={PayrollStatusEnum.PAID}>Paid</option>
            <option value={PayrollStatusEnum.CANCELLED}>Cancelled</option>
          </select>
        </div>

        {canManagePayroll && (
          <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Individual Payroll
          </Button>
        )}
      </div>

      {/* Payrolls Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[130px]">Voucher #</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Salary Formula</TableHead>
              <TableHead>Calculated Base</TableHead>
              <TableHead>Adjustments</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading payroll records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Receipt className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">No payroll records for this period</p>
                    <p className="text-xs">Create an individual payroll voucher for a staff member.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((payroll) => (
                <TableRow key={payroll.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {payroll.payrollNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>{payroll.staff?.name ?? `Staff #${payroll.staffId}`}</span>
                        {payroll.staff?.nameKm && (
                          <span className="text-xs text-muted-foreground">
                            ({payroll.staff.nameKm})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {payroll.staff?.department ?? "STAFF"}
                        </Badge>
                        <span>{payroll.staff?.designation}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      {payroll.salaryType === StaffSalaryTypeEnum.HOURLY ? (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{payroll.totalHoursWorked} hrs @ ${payroll.hourlyRate}/hr</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Fixed Monthly</span>
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {payroll.workingDays} working days ({payroll.holidayDays} holidays)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    ${payroll.calculatedBaseAmount?.toFixed(2)}
                  </TableCell>
                  <TableCell>
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
                        <span className="text-muted-foreground text-[11px]">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm text-foreground">
                      ${payroll.netSalary?.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PayrollStatusBadge status={payroll.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View / Print A5 Payslip */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
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
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleOpenDelete(payroll)}
                          title="Delete / Void Payroll"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Infinite Scroll Indicator */}
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading more payroll vouchers...</span>
            </div>
          )}
          {!hasNextPage && accumulatedData.length > 0 && (
            <p className="text-xs text-muted-foreground">
              All {accumulatedData.length} payroll vouchers loaded
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
