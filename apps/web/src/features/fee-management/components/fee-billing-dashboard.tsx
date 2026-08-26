import { FC } from "react";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeeSummaryQuery } from "../hooks/use-fee-summary";

export const FeeBillingDashboard: FC = () => {
  const { data: summaryResponse, isLoading } = useFeeSummaryQuery();
  const summary = summaryResponse?.data;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* 1. Total Revenue Collected */}
      <Card className="border-l-4 border-l-emerald-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Revenue Collected
          </CardTitle>
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? "..." : `$${(summary?.totalRevenueCollected ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <p className="mt-1 text-xs text-slate-500">Paid student invoices & fees</p>
        </CardContent>
      </Card>

      {/* 3. Operational Expenses */}
      <Card className="border-l-4 border-l-rose-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Approved Expenses
          </CardTitle>
          <div className="rounded-full bg-rose-50 p-2 text-rose-600">
            <TrendingDown className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">
            {isLoading ? "..." : `$${(summary?.totalApprovedExpenses ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.pendingExpensesCount ?? 0} pending manager approval
          </p>
        </CardContent>
      </Card>

      {/* 4. Net Operating Balance */}
      <Card className="border-l-4 border-l-blue-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Operating Balance
          </CardTitle>
          <div className="rounded-full bg-blue-50 p-2 text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(summary?.netOperatingBalance ?? 0) >= 0 ? "text-slate-900" : "text-rose-600"}`}>
            {isLoading ? "..." : `$${(summary?.netOperatingBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <p className="mt-1 text-xs text-slate-500">Revenue minus operating expenses</p>
        </CardContent>
      </Card>
    </div>
  );
};
