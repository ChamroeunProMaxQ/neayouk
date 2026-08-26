import { FC } from "react";
import { ExpenseListTable } from "@/features/fee-management";

export const ExpensesPage: FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">School Operational Expenses</h1>
        <p className="text-sm text-slate-500">
          Track operational spending (salaries, utilities, maintenance, supplies) with 2-step manager approval.
        </p>
      </div>

      <div className="pt-2">
        <ExpenseListTable />
      </div>
    </div>
  );
};
