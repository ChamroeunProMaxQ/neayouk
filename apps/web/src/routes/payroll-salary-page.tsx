import { useState } from "react";
import { PayrollSummaryCards } from "@/features/hr-payroll/components/payroll-summary-cards";
import { PayrollListTable } from "@/features/hr-payroll/components/payroll-list-table";
import { Calculator } from "lucide-react";

export function PayrollSalaryPage() {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              HR & Payroll Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Calculate base on hours worked or fixed monthly salary, manage bonuses/deductions, and issue A5 printable payslips.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards with Period Selector & Holiday Indicators */}
      <PayrollSummaryCards
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      {/* Main Payroll List Table */}
      <PayrollListTable year={year} month={month} />
    </div>
  );
}

export default PayrollSalaryPage;
