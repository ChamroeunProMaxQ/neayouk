import { StudentAttendanceSheet } from "@/features/attendance";

export function StudentAttendancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Student Attendance Sheet
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Spreadsheet matrix for daily roll call, status cycling, and monthly percentage tracking.
        </p>
      </div>
      <StudentAttendanceSheet />
    </div>
  );
}
