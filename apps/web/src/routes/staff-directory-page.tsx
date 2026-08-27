import { StaffListTable } from "@/features/hr-payroll/components/staff-list-table";
import { Users2 } from "lucide-react";

export function StaffDirectoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Staff & Personnel Directory
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage school faculty, teachers, management, accountants, and operations staff.
            </p>
          </div>
        </div>
      </div>

      {/* Main Staff Directory Table */}
      <StaffListTable />
    </div>
  );
}

export default StaffDirectoryPage;
