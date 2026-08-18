import { LeaveRequestListTable } from "@/features/attendance";

export function LeaveRequestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Teacher Leave Applications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review and approve teacher time-off applications with automatic attendance roster synchronization.
        </p>
      </div>
      <LeaveRequestListTable />
    </div>
  );
}
