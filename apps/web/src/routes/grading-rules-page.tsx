import { GradingRuleListTable } from "@/features/examinations";

export function GradingRulesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Grading Rules & Schemes
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage master evaluation criteria, component weights, max scores, and grade threshold scales.
        </p>
      </div>
      <GradingRuleListTable />
    </div>
  );
}
