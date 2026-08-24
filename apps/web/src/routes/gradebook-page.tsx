import { GradebookMatrix } from "@/features/examinations";

export function GradebookPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Monthly Gradebook Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select class and month to input student component scores, auto-calculate weighted totals, and review class performance.
        </p>
      </div>
      <GradebookMatrix />
    </div>
  );
}
