import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { PaymentStatusEnum, type StudentPaymentSummary } from "@repo/contracts";

interface PaymentStatusBadgeProps {
  summary?: StudentPaymentSummary | null;
  className?: string;
}

export const PaymentStatusBadge: FC<PaymentStatusBadgeProps> = ({ summary, className = "" }) => {
  if (!summary) {
    return (
      <Badge variant="outline" className={`bg-slate-50 text-slate-600 border-slate-200 font-medium ${className}`}>
        <Clock className="w-3 h-3 mr-1 text-slate-400" />
        No Ledger
      </Badge>
    );
  }

  const unpaidCount = summary.totalUnpaidMonths;
  const hasPartial = summary.unpaidMonthsList?.some(
    (m) => m.status === PaymentStatusEnum.PARTIAL
  );

  if (unpaidCount === 0) {
    return (
      <Badge className={`bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold flex items-center gap-1 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Fully Paid
      </Badge>
    );
  }

  if (hasPartial) {
    return (
      <Badge className={`bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-semibold flex items-center gap-1 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
        Partial (${summary.totalOutstandingAmount})
      </Badge>
    );
  }

  if (unpaidCount <= 2) {
    return (
      <Badge className={`bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold flex items-center gap-1 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        {unpaidCount} {unpaidCount === 1 ? "Month Unpaid" : "Months Unpaid"} (${summary.totalOutstandingAmount})
      </Badge>
    );
  }

  return (
    <Badge className={`bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold flex items-center gap-1 ${className}`}>
      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      {unpaidCount} Months Overdue (${summary.totalOutstandingAmount})
    </Badge>
  );
};
