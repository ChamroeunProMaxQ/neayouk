import { FC } from "react";
import { InvoiceListTable } from "@/features/fee-management";

export const InvoicesPage: FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Invoices & Payments</h1>
        <p className="text-sm text-slate-500">
          Generate student invoices, record payments, issue receipts, process refunds, and track overdue balances.
        </p>
      </div>

      <div className="pt-2">
        <InvoiceListTable />
      </div>
    </div>
  );
};
