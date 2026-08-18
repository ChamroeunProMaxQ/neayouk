import { TeacherAttendanceTable } from "@/features/attendance";

export function TeacherAttendancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Teacher Daily Roster & Attendance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record teacher check-in/out times, hours worked, and status for payroll and scheduling.
        </p>
      </div>
      <TeacherAttendanceTable />
    </div>
  );
}
