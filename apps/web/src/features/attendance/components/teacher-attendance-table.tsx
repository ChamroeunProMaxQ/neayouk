import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  AttendanceStatusEnum,
  type TeacherAttendanceAttribute,
  type TeacherAttribute,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Save,
  Loader2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";

interface TeacherRowData {
  teacher: TeacherAttribute;
  att?: TeacherAttendanceAttribute;
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatusEnum;
  hoursWorked: number;
  remarks: string;
  isRecorded: boolean;
  isDirty: boolean;
}

export const TeacherAttendanceTable: FC = () => {
  const { can, isAdmin } = usePermission();
  const canManage =
    isAdmin ||
    can("manage", "attendance") ||
    can("create", "attendance") ||
    can("manage", "teacher") ||
    can("manage", "academic") ||
    can("manage", "hr");

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
  const teacherRows = useMemo<TeacherRowData[]>(() => {
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
      checkInTime:
        row.status === AttendanceStatusEnum.ON_LEAVE || !row.checkInTime
          ? null
          : row.checkInTime,
      checkOutTime:
        row.status === AttendanceStatusEnum.ON_LEAVE || !row.checkOutTime
          ? null
          : row.checkOutTime,
      hoursWorked:
        row.status === AttendanceStatusEnum.ON_LEAVE
          ? 0
          : Number(row.hoursWorked) || 0,
      status: row.status,
      remarks: row.remarks || null,
    }));

    try {
      setFeedback(null);
      await batchMutation.mutateAsync({
        date: selectedDate,
        records,
      });
      setDrafts({});
      await refetch();
      setFeedback({
        type: "success",
        message: `Daily roster for ${selectedDate} saved successfully (${records.length} instructor${records.length === 1 ? "" : "s"}).`,
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const serverMsg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Failed to save teacher attendance roster.";
      setFeedback({ type: "error", message: serverMsg });
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
    setFeedback(null);
  };

  const columns = useMemo<ColumnDef<TeacherRowData>[]>(
    () => [
      {
        id: "index",
        header: () => <span className="text-xs font-bold text-slate-700 w-12 text-center">#</span>,
        cell: ({ row }) => <span className="text-slate-400 text-xs text-center block">{row.index + 1}</span>,
      },
      {
        id: "teacherName",
        header: () => <span className="text-xs font-bold text-slate-700 min-w-[180px]">Instructor Name</span>,
        cell: ({ row }) => {
          const { teacher } = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 text-xs">{teacher.name}</span>
              <span className="text-[10px] text-slate-400">
                {teacher.teacherCode || `ID:${teacher.id}`} • {teacher.phone || "No phone"}
              </span>
            </div>
          );
        },
      },
      {
        id: "specialization",
        header: () => <span className="text-xs font-bold text-slate-700 min-w-[120px]">Specialization</span>,
        cell: ({ row }) => (
          <span className="text-xs text-slate-600">
            {row.original.teacher.specialization || "General"}
          </span>
        ),
      },
      {
        id: "rate",
        header: () => <span className="text-xs font-bold text-slate-700 w-24">Rate ($/hr)</span>,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-700">
            ${Number(row.original.teacher.salaryInHour || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "checkIn",
        header: () => <span className="text-xs font-bold text-slate-700 w-28">Check In</span>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <Input
              type="time"
              value={r.checkInTime}
              onChange={(e) =>
                handleRowChange(r.teacher.id, { checkInTime: e.target.value })
              }
              disabled={!canManage || r.status === AttendanceStatusEnum.ON_LEAVE}
              className="h-7 text-xs font-mono w-24 px-1.5"
            />
          );
        },
      },
      {
        id: "checkOut",
        header: () => <span className="text-xs font-bold text-slate-700 w-28">Check Out</span>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <Input
              type="time"
              value={r.checkOutTime}
              onChange={(e) =>
                handleRowChange(r.teacher.id, { checkOutTime: e.target.value })
              }
              disabled={!canManage || r.status === AttendanceStatusEnum.ON_LEAVE}
              className="h-7 text-xs font-mono w-24 px-1.5"
            />
          );
        },
      },
      {
        id: "hours",
        header: () => <span className="text-xs font-bold text-slate-700 w-24">Hours</span>,
        cell: ({ row }) => {
          const r = row.original;
          return canManage && r.status !== AttendanceStatusEnum.ON_LEAVE ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={r.hoursWorked}
                onChange={(e) =>
                  handleRowChange(r.teacher.id, {
                    hoursWorked: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                aria-label={`Hours worked for ${r.teacher.name}`}
                className="h-7 text-xs font-bold font-mono w-16 px-1.5 text-center bg-slate-50 focus:bg-white border-slate-300"
              />
              <span className="text-[10px] text-slate-500 font-medium">hrs</span>
            </div>
          ) : (
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
              {r.hoursWorked}h
            </span>
          );
        },
      },
      {
        id: "status",
        header: () => <span className="text-xs font-bold text-slate-700 w-36">Status</span>,
        cell: ({ row }) => {
          const r = row.original;
          return canManage ? (
            <select
              value={r.status}
              onChange={(e) =>
                handleRowChange(r.teacher.id, {
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
            <AttendanceStatusBadge status={r.status} size="sm" />
          );
        },
      },
      {
        id: "remarks",
        header: () => <span className="text-xs font-bold text-slate-700 min-w-[180px]">Remarks</span>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <Input
              placeholder="Add note..."
              value={r.remarks}
              onChange={(e) =>
                handleRowChange(r.teacher.id, { remarks: e.target.value })
              }
              disabled={!canManage}
              className="h-7 text-xs"
            />
          );
        },
      },
    ],
    [canManage]
  );

  const table = useReactTable({
    data: teacherRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <span className="font-bold text-red-600">✕</span>
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-slate-500 hover:text-slate-800 ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Date Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Left: Date Picker */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeDateByDays(-1)}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDrafts({});
                setFeedback(null);
              }}
              className="pl-8 h-8 text-xs font-semibold w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeDateByDays(1)}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDate(today);
              setDrafts({});
              setFeedback(null);
            }}
            className="text-xs text-[#45AC5E] hover:bg-emerald-50 font-medium cursor-pointer"
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
                className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Fill Standard Shift (4h)
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={batchMutation.isPending}
                className="text-xs font-bold bg-[#45AC5E] hover:bg-[#3d9853] text-white shadow-sm cursor-pointer"
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
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-200">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-3 px-3 text-xs font-bold text-slate-700">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.original.isDirty ? "bg-amber-50/40" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

