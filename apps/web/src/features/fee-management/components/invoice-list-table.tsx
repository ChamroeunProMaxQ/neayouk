import { FC, useState, useMemo } from "react";
import { Plus, Search, DollarSign, Eye, RefreshCw, Bell } from "lucide-react";
import { PaymentStatusEnum, type StudentInvoiceAttribute } from "@repo/contracts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";
import { useInvoicesQuery } from "../hooks/use-invoices";
import { GenerateInvoiceDialog } from "./generate-invoice-dialog";
import { PayInvoiceDialog } from "./pay-invoice-dialog";
import { RefundDialog } from "./refund-dialog";
import { PaymentReminderDialog } from "./payment-reminder-dialog";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";

export const InvoiceListTable: FC = () => {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoiceAttribute | null>(null);

  const { data: response, isLoading } = useInvoicesQuery({
    search: debouncedSearch,
    status: statusFilter !== "ALL" ? (statusFilter as PaymentStatusEnum) : undefined,
  });

  const invoices = useMemo(() => response?.data ?? [], [response]);

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

  return (
    <div className="space-y-4">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice or student..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value={PaymentStatusEnum.UNPAID}>UNPAID</SelectItem>
              <SelectItem value={PaymentStatusEnum.PAID}>PAID</SelectItem>
              <SelectItem value={PaymentStatusEnum.OVERDUE}>OVERDUE</SelectItem>
              <SelectItem value={PaymentStatusEnum.WAIVED}>WAIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {can("create", "fee") && (
          <Button onClick={() => setGenerateOpen(true)} className="bg-[#45AC5E] hover:bg-[#3b9450]">
            <Plus className="mr-2 h-4 w-4" /> Generate Invoices
          </Button>
        )}
      </div>

      {/* Invoices Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Billing Period</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Loading student invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No invoices found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-slate-900">
                    #{inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{inv.studentName || `ID: ${inv.studentId}`}</p>
                    {inv.studentCode && <p className="text-xs text-slate-500">{inv.studentCode}</p>}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">
                    {inv.billingMonth}/{inv.billingYear}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    ${inv.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    ${inv.amountPaid.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        inv.status === PaymentStatusEnum.PAID
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : inv.status === PaymentStatusEnum.OVERDUE
                          ? "bg-rose-100 text-rose-800 hover:bg-rose-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(inv)}
                        title="View Receipt / Details"
                        className="h-8 px-2"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>

                      {can("update", "fee") && inv.status !== PaymentStatusEnum.PAID && (
                        <Button
                          size="sm"
                          onClick={() => handlePay(inv)}
                          className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1" /> Pay
                        </Button>
                      )}

                      {can("update", "fee") && inv.status === PaymentStatusEnum.PAID && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRefund(inv)}
                          title="Issue Refund"
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refund
                        </Button>
                      )}

                      {can("update", "fee") && inv.status !== PaymentStatusEnum.PAID && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReminder(inv)}
                          title="Send Reminder"
                          className="h-8 px-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
