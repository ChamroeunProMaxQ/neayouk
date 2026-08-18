import { useState, useMemo, type FC } from "react";
import {
  AttendanceStatusEnum,
  type TeacherAttendanceAttribute,
} from "@repo/contracts";
import { useTeachersQuery } from "@/features/teachers/hooks/use-teachers-query";
import {
  useTeacherAttendanceQuery,
  useBatchRecordTeacherAttendanceMutation,
} from "../hooks/use-teacher-attendance";
import { usePermission } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Save,
  Loader2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";

export const TeacherAttendanceTable: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "attendance") || can("create", "attendance");

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Fetch active teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachersQuery({
    status: "ACTIVE",
  });

  // Fetch teacher attendances for selected date
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    refetch,
  } = useTeacherAttendanceQuery({
    sortBy: "id",
    sortOrder: "DESC",
    date: selectedDate,
    pageSize: 100,
  });

  const attendanceList = attendanceData?.data ?? [];
  const batchMutation = useBatchRecordTeacherAttendanceMutation();

  // Local draft state for table rows
  const [drafts, setDrafts] = useState<
    Record<
      number,
      {
        checkInTime: string;
        checkOutTime: string;
        hoursWorked: number;
        status: AttendanceStatusEnum;
        remarks: string;
        isDirty: boolean;
      }
    >
  >({});

  // Merge teachers with attendance records
  const teacherRows = useMemo(() => {
    const attMap = new Map<number, TeacherAttendanceAttribute>();
    attendanceList.forEach((att) => attMap.set(att.teacherId, att));

    return teachers.map((teacher) => {
      const att = attMap.get(teacher.id);
      const draft = drafts[teacher.id];

      const checkInTime = draft ? draft.checkInTime : att?.checkInTime ?? "07:30";
      const checkOutTime = draft ? draft.checkOutTime : att?.checkOutTime ?? "11:30";
      const status = draft ? draft.status : att?.status ?? AttendanceStatusEnum.PRESENT;
      const hoursWorked = draft
        ? draft.hoursWorked
        : att?.hoursWorked ?? (status === AttendanceStatusEnum.ON_LEAVE ? 0 : 4.0);
      const remarks = draft ? draft.remarks : att?.remarks ?? "";

      return {
        teacher,
        att,
        checkInTime,
        checkOutTime,
        status,
        hoursWorked,
        remarks,
        isRecorded: Boolean(att),
        isDirty: Boolean(draft?.isDirty),
      };
    });
  }, [teachers, attendanceList, drafts]);

  // Calculate hours worked from times
  const calculateHours = (inTime: string, outTime: string): number => {
    if (!inTime || !outTime) return 0;
    const inParts = inTime.split(":");
    const outParts = outTime.split(":");
    if (inParts.length < 2 || outParts.length < 2) return 0;
    const inH = Number(inParts[0]);
    const inM = Number(inParts[1]);
    const outH = Number(outParts[0]);
    const outM = Number(outParts[1]);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
    const diff = outH * 60 + outM - (inH * 60 + inM);
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
  };

  const handleRowChange = (
    teacherId: number,
    updates: Partial<{
      checkInTime: string;
      checkOutTime: string;
      hoursWorked: number;
      status: AttendanceStatusEnum;
      remarks: string;
    }>
  ) => {
    const current = teacherRows.find((r) => r.teacher.id === teacherId);
    if (!current) return;

    const nextIn = updates.checkInTime !== undefined ? updates.checkInTime : current.checkInTime;
    const nextOut = updates.checkOutTime !== undefined ? updates.checkOutTime : current.checkOutTime;
    const nextStatus = updates.status !== undefined ? updates.status : current.status;
    const nextRemarks = updates.remarks !== undefined ? updates.remarks : current.remarks;
    const computedHours =
      nextStatus === AttendanceStatusEnum.ON_LEAVE
        ? 0
        : calculateHours(nextIn, nextOut);

    setDrafts((prev) => ({
      ...prev,
      [teacherId]: {
        checkInTime: nextIn,
        checkOutTime: nextOut,
        status: nextStatus,
        hoursWorked: updates.hoursWorked !== undefined ? updates.hoursWorked : computedHours,
        remarks: nextRemarks,
        isDirty: true,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!canManage) return;

    const records = teacherRows.map((row) => ({
      teacherId: row.teacher.id,
      checkInTime: row.status === AttendanceStatusEnum.ON_LEAVE ? null : row.checkInTime,
      checkOutTime: row.status === AttendanceStatusEnum.ON_LEAVE ? null : row.checkOutTime,
      hoursWorked: row.hoursWorked,
      status: row.status,
      remarks: row.remarks || null,
    }));

    try {
      await batchMutation.mutateAsync({
        date: selectedDate,
        records,
      });
      setDrafts({});
      refetch();
    } catch (err) {
      console.error("Failed to save teacher attendance:", err);
    }
  };

  const handleMarkAllPresent = () => {
    teachers.forEach((t) => {
      handleRowChange(t.id, {
        status: AttendanceStatusEnum.PRESENT,
        checkInTime: "07:30",
        checkOutTime: "11:30",
        hoursWorked: 4.0,
      });
    });
  };

  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
    setDrafts({});
  };

  return (
    <div className="space-y-4">
      {/* Date Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Left: Date Picker */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeDateByDays(-1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDrafts({});
              }}
              className="pl-8 h-8 text-xs font-semibold w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeDateByDays(1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDate(today);
              setDrafts({});
            }}
            className="text-xs text-[#45AC5E] hover:bg-emerald-50 font-medium"
          >
            Today
          </Button>
        </div>

        {/* Right: Quick actions & Save */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Fill Standard Shift (4h)
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={batchMutation.isPending}
                className="text-xs font-bold bg-[#45AC5E] hover:bg-[#3d9853] text-white shadow-sm"
              >
                {batchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save Daily Roster
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Teacher Roster Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoadingTeachers || isLoadingAttendance ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#45AC5E]" />
            <p className="mt-2 text-xs text-slate-500 font-medium">Loading teacher roster...</p>
          </div>
        ) : teacherRows.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No active teachers found in the directory.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold w-12">#</th>
                <th className="px-4 py-3 font-bold min-w-[180px]">Instructor Name</th>
                <th className="px-3 py-3 font-bold min-w-[120px]">Specialization</th>
                <th className="px-3 py-3 font-bold w-24">Rate ($/hr)</th>
                <th className="px-3 py-3 font-bold w-28">Check In</th>
                <th className="px-3 py-3 font-bold w-28">Check Out</th>
                <th className="px-3 py-3 font-bold w-24">Hours</th>
                <th className="px-3 py-3 font-bold w-36">Status</th>
                <th className="px-4 py-3 font-bold min-w-[180px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherRows.map((row, idx) => (
                <tr
                  key={row.teacher.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.isDirty ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400 text-center">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{row.teacher.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {row.teacher.teacherCode || `ID:${row.teacher.id}`} • {row.teacher.phone || "No phone"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {row.teacher.specialization || "General"}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-700">
                    ${Number(row.teacher.salaryInHour || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="time"
                      value={row.checkInTime}
                      onChange={(e) =>
                        handleRowChange(row.teacher.id, { checkInTime: e.target.value })
                      }
                      disabled={!canManage || row.status === AttendanceStatusEnum.ON_LEAVE}
                      className="h-7 text-xs font-mono w-24 px-1.5"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="time"
                      value={row.checkOutTime}
                      onChange={(e) =>
                        handleRowChange(row.teacher.id, { checkOutTime: e.target.value })
                      }
                      disabled={!canManage || row.status === AttendanceStatusEnum.ON_LEAVE}
                      className="h-7 text-xs font-mono w-24 px-1.5"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {row.hoursWorked}h
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <select
                        value={row.status}
                        onChange={(e) =>
                          handleRowChange(row.teacher.id, {
                            status: e.target.value as AttendanceStatusEnum,
                          })
                        }
                        aria-label="Attendance status"
                        className="h-7 text-xs rounded border border-slate-200 bg-white px-2 py-0 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
                      >
                        <option value={AttendanceStatusEnum.PRESENT}>Present</option>
                        <option value={AttendanceStatusEnum.LATE}>Late</option>
                        <option value={AttendanceStatusEnum.ABSENT}>Absent</option>
                        <option value={AttendanceStatusEnum.HALF_DAY}>Half Day</option>
                        <option value={AttendanceStatusEnum.ON_LEAVE}>On Leave</option>
                      </select>
                    ) : (
                      <AttendanceStatusBadge status={row.status} size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Add note..."
                      value={row.remarks}
                      onChange={(e) =>
                        handleRowChange(row.teacher.id, { remarks: e.target.value })
                      }
                      disabled={!canManage}
                      className="h-7 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
