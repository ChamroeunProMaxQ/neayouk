import { useState, type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  DollarSign,
  Plus,
  Loader2,
  Calendar,
  Receipt,
  Printer,
} from "lucide-react";
import { useStudentSummaryQuery } from "../hooks/use-student-summary-query";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { SchoolReceiptModal } from "@/features/fee-management/components/school-receipt-modal";
import { type SchoolReceiptData } from "@/features/fee-management/components/school-receipt";
import { usePermission } from "@/features/auth";
import { PaymentStatusEnum, PaymentMethodEnum, type StudentAttribute } from "@repo/contracts";

interface StudentPaymentTrackerProps {
  student: StudentAttribute;
  onPaymentRecorded?: () => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const StudentPaymentTracker: FC<StudentPaymentTrackerProps> = ({
  student,
  onPaymentRecorded,
}) => {
  const { can } = usePermission();
  const { data: summary, isLoading, refetch } = useStudentSummaryQuery(student.id);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedMonthForPayment, setSelectedMonthForPayment] = useState<number | null>(null);
  const [selectedYearForPayment, setSelectedYearForPayment] = useState<number>(new Date().getFullYear());
  const [receiptDataForPrint, setReceiptDataForPrint] = useState<SchoolReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const canManageFees = can("create", "fee") || can("manage", "fee") || can("update", "student");

  const handlePayMonth = (month: number, year: number) => {
    setSelectedMonthForPayment(month);
    setSelectedYearForPayment(year);
    setIsRecordDialogOpen(true);
  };

  const handleGeneralRecordPayment = () => {
    setSelectedMonthForPayment(null);
    setSelectedYearForPayment(selectedYear);
    setIsRecordDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#45AC5E]" />
        <p className="text-sm font-medium">Loading payment ledger & history...</p>
      </div>
    );
  }

  const unpaidList = summary?.unpaidMonthsList || [];
  const paymentsList = summary?.payments || [];

  // Group payments by year-month
  const paymentsByMonth = new Map<string, any>();
  paymentsList.forEach((p) => {
    paymentsByMonth.set(`${p.billingYear}-${p.billingMonth}`, p);
  });

  return (
    <div className="space-y-6">
      {/* Top Financial Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="bg-emerald-50/70 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Paid</p>
              <h4 className="text-2xl font-black text-emerald-950 mt-0.5">
                ${(summary?.totalPaidAmount || 0).toFixed(2)}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/70 border-rose-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Outstanding Balance</p>
              <h4 className="text-2xl font-black text-rose-950 mt-0.5">
                ${(summary?.totalOutstandingAmount || 0).toFixed(2)}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/70 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Unpaid Months</p>
              <h4 className="text-2xl font-black text-amber-950 mt-0.5">
                {summary?.totalUnpaidMonths || 0} <span className="text-sm font-normal text-amber-700">months</span>
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Monthly Base Fee</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                ${Number(student.primaryClass?.monthlyFee || 0).toFixed(2)}
                {Number(student.discount || 0) > 0 && (
                  <span className="text-xs text-[#45AC5E] font-medium block">
                    -${Number(student.discount).toFixed(2)} discount
                  </span>
                )}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Matrix Grid */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#45AC5E]" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Monthly Tuition Tracker ({selectedYear})
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select Billing Year"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={handleGeneralRecordPayment}
              disabled={!canManageFees}
              className="bg-[#45AC5E] hover:bg-[#389350] text-white text-xs font-semibold h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Payment
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTH_NAMES.map((monthName, idx) => {
              const monthNum = idx + 1;
              const key = `${selectedYear}-${monthNum}`;
              const payment = paymentsByMonth.get(key);
              const unpaidItem = unpaidList.find(
                (u) => u.year === selectedYear && u.month === monthNum
              );

              const isPaid = payment && payment.status === PaymentStatusEnum.PAID;
              const isPartial = payment && payment.status === PaymentStatusEnum.PARTIAL;
              const isUnpaid = Boolean(unpaidItem) || (!payment && !isPaid);

              return (
                <div
                  key={monthNum}
                  className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                    isPaid
                      ? "bg-emerald-50/50 border-emerald-200"
                      : isPartial
                      ? "bg-amber-50/50 border-amber-200"
                      : isUnpaid
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-800">
                      {monthName} {selectedYear}
                    </span>
                    {isPaid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    {isPaid ? (
                      <div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">
                          PAID (${Number(payment.amountPaid).toFixed(2)})
                        </Badge>
                        <p className="text-[11px] text-slate-500 mt-1">
                          via {payment.paymentMethod || "CASH"}
                        </p>
                      </div>
                    ) : isPartial ? (
                      <div>
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                          PARTIAL (${Number(payment.amountPaid).toFixed(2)})
                        </Badge>
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">
                          Due: ${unpaidItem?.amountDue.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Badge className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0">
                          UNPAID
                        </Badge>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1">
                          Due: ${unpaidItem ? unpaidItem.amountDue.toFixed(2) : (Number(student.primaryClass?.monthlyFee || 0) - Number(student.discount || 0)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isPaid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayMonth(monthNum, selectedYear)}
                      disabled={!canManageFees}
                      className="w-full text-xs h-7 border-rose-300 text-rose-700 hover:bg-rose-100/70 font-semibold"
                    >
                      Pay Month
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Ledger Table */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-2">
          <Receipt className="w-4 h-4 text-[#45AC5E]" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Payment Transaction History
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {paymentsList.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No payments recorded yet for this student.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Receipt / Ref</th>
                    <th className="py-2.5 px-4 font-semibold">Billing Month</th>
                    <th className="py-2.5 px-4 font-semibold">Amount Paid</th>
                    <th className="py-2.5 px-4 font-semibold">Method</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Payment Date</th>
                    <th className="py-2.5 px-4 font-semibold">Notes</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {p.receiptNumber || `PAY-${p.id}`}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {MONTH_NAMES[p.billingMonth - 1]} {p.billingYear}
                      </td>
                      <td className="py-2.5 px-4 font-black text-emerald-700">
                        ${Number(p.amountPaid).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50">
                          {p.paymentMethod || "CASH"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic max-w-xs truncate">
                        {p.notes || "-"}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const grossFee = Number(student.primaryClass?.monthlyFee || p.amountPaid || 16);
                            const discountVal = Number(p.discountApplied || student.discount || 0);
                            const netPaid = Number(p.amountPaid || 0);
                            setReceiptDataForPrint({
                              studentName: `${student.firstName} ${student.lastName}`,
                              className: student.primaryClass?.name || "General English",
                              level: "5",
                              date: p.paidAt
                                ? new Date(p.paidAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : new Date().toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }),
                              receiptNumber: p.receiptNumber || `REC-${p.id}`,
                              paymentMethod: p.paymentMethod || PaymentMethodEnum.CASH,
                              items: [
                                {
                                  description: `Tuition Fee (${MONTH_NAMES[p.billingMonth - 1]} ${p.billingYear})`,
                                  quantity: 1,
                                  price: grossFee,
                                  total: grossFee,
                                },
                              ],
                              total: grossFee,
                              discount: discountVal,
                              subtotal: netPaid,
                            });
                            setIsReceiptModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1 hover:bg-slate-100"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          Print A5
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={isRecordDialogOpen}
        onClose={() => setIsRecordDialogOpen(false)}
        student={student}
        defaultMonth={selectedMonthForPayment}
        defaultYear={selectedYearForPayment}
        onSuccess={() => {
          refetch();
          onPaymentRecorded?.();
        }}
      />

      {/* School Receipt Print Modal */}
      <SchoolReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptDataForPrint(null);
        }}
        receiptData={receiptDataForPrint}
      />
    </div>
  );
};
