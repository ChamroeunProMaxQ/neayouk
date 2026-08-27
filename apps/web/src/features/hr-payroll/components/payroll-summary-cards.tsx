import { usePayrollSummaryQuery } from "../hooks/use-payroll-summary-query";
import { PUBLIC_HOLIDAYS } from "@/shared/data/public-holiday";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface PayrollSummaryCardsProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function PayrollSummaryCards({
  year,
  month,
  onYearChange,
  onMonthChange,
}: PayrollSummaryCardsProps) {
  const { data: response, isLoading } = usePayrollSummaryQuery({
    year,
    month,
  });

  const summary = response?.data;
  const holidays = PUBLIC_HOLIDAYS[month] ?? [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-4">
      {/* Month / Year Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Payroll Period:
          </span>
          <select
            aria-label="Select month"
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name} ({idx + 1})
              </option>
            ))}
          </select>
          <select
            aria-label="Select year"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Cambodia Public Holidays Indicator */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Cambodia Holidays in {monthNames[month - 1]}:
          </span>
          {holidays.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">None</span>
          ) : (
            holidays.map((h, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 py-0"
              >
                Day {h.day}: {h.name}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payroll Spend */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Net Payroll
              </p>
              <h3 className="text-xl font-bold text-foreground mt-1">
                {isLoading ? (
                  <span className="text-sm font-normal text-muted-foreground">Loading...</span>
                ) : (
                  `$${(summary?.totalPayrollSpend ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {(summary?.paidCount ?? 0) + (summary?.draftCount ?? 0)} payroll vouchers
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Disbursed (Paid) */}
        <Card className="shadow-sm border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Disbursed (Paid)
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isLoading ? (
                  <span className="text-sm font-normal text-muted-foreground">Loading...</span>
                ) : (
                  `$${(summary?.totalPaid ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                {summary?.paidCount ?? 0} disbursed vouchers
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Drafts */}
        <Card className="shadow-sm border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Pending Drafts
              </p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {isLoading ? (
                  <span className="text-sm font-normal text-muted-foreground">Loading...</span>
                ) : (
                  `$${(summary?.totalDraft ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h3>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                {summary?.draftCount ?? 0} draft runs awaiting payment
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Staff & Calculation Types */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Salary Types Breakdown
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400">
                  Hourly: ${(summary?.hourlySpend ?? 0).toFixed(0)}
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Monthly: ${(summary?.monthlySpend ?? 0).toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {summary?.totalStaffCount ?? 0} total active staff
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
