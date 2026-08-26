import { FC } from "react";
import { FeeBillingDashboard, FeeStructureListTable } from "@/features/fee-management";

export const FeeStructuresPage: FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Structures</h1>
        <p className="text-sm text-slate-500">
          Manage tuition, registration, transportation, meals, uniform variants, and school fee items.
        </p>
      </div>

      <FeeBillingDashboard />

      <div className="pt-2">
        <FeeStructureListTable />
      </div>
    </div>
  );
};
