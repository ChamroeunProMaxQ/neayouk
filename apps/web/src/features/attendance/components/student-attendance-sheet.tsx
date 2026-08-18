import { useState, useMemo, useEffect, type FC, type KeyboardEvent } from "react";
import {
  AttendanceStatusEnum,
} from "@repo/contracts";
import { useClassesQuery } from "@/features/classes/hooks/use-classes-infinite-query";
import {
  useStudentAttendanceMatrixQuery,
  useBatchStudentAttendanceMutation,
} from "../hooks/use-student-attendance";
import { usePermission } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { getHoliday, getIsHoliday } from "@/shared/data/public-holiday";

interface EditedCell {
  studentId: number;
  date: string;
  status: AttendanceStatusEnum;
  remarks?: string | null;
}

export const StudentAttendanceSheet: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "attendance") || can("create", "attendance");

  // Selected class
  const { data: classesData, isLoading: isLoadingClasses } = useClassesQuery({
    pageSize: 100,
    status: "ACTIVE",
  });
  const classesList = classesData?.data ?? [];

  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const firstCls = classesList[0];
    if (!selectedClassId && firstCls) {
      setSelectedClassId(firstCls.id);
    }
  }, [classesList, selectedClassId]);

  // Selected Year & Month
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-indexed

  // Date range for the month
  const startDateStr = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  }, [selectedYear, selectedMonth]);

  const endDateStr = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [selectedYear, selectedMonth]);

  // Selected focused day for daily bulk actions
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    today.toISOString().slice(0, 10)
  );

  // Fetch matrix
  const {
    data: matrixData,
    isLoading: isLoadingMatrix,
    isFetching: isFetchingMatrix,
    refetch,
  } = useStudentAttendanceMatrixQuery(selectedClassId, startDateStr, endDateStr);

  const batchMutation = useBatchStudentAttendanceMutation();

  // Local pending edits: key is `${studentId}_${date}`
  const [pendingEdits, setPendingEdits] = useState<Record<string, EditedCell>>({});

  const isDirty = Object.keys(pendingEdits).length > 0;

  // Clear pending edits on class or month change
  useEffect(() => {
    setPendingEdits({});
  }, [selectedClassId, selectedMonth, selectedYear]);

  // Cycle status: PRESENT -> ABSENT -> LATE -> EXCUSED
  const cycleStatus = (currentStatus?: AttendanceStatusEnum): AttendanceStatusEnum => {
    switch (currentStatus) {
      case AttendanceStatusEnum.PRESENT:
        return AttendanceStatusEnum.ABSENT;
      case AttendanceStatusEnum.ABSENT:
        return AttendanceStatusEnum.LATE;
      case AttendanceStatusEnum.LATE:
        return AttendanceStatusEnum.EXCUSED;
      case AttendanceStatusEnum.EXCUSED:
        return AttendanceStatusEnum.PRESENT;
      default:
        return AttendanceStatusEnum.PRESENT;
    }
  };

  const handleCellClick = (studentId: number, dateStr: string, currentStatus?: AttendanceStatusEnum) => {
    if (!canManage) return;
    const nextStatus = cycleStatus(currentStatus);
    const key = `${studentId}_${dateStr}`;
    setPendingEdits((prev) => {
      return {
        ...prev,
        [key]: {
          studentId,
          date: dateStr,
          status: nextStatus,
          remarks: prev[key]?.remarks,
        },
      };
    });
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    studentId: number,
    dateStr: string,
  ) => {
    if (!canManage) return;
    const key = e.key.toUpperCase();
    let nextStatus: AttendanceStatusEnum | null | undefined = null;

    if (key === "P" || key === "1") nextStatus = AttendanceStatusEnum.PRESENT;
    else if (key === "A" || key === "2") nextStatus = AttendanceStatusEnum.ABSENT;
    else if (key === "L" || key === "3") nextStatus = AttendanceStatusEnum.LATE;
    else if (key === "E" || key === "4") nextStatus = AttendanceStatusEnum.EXCUSED;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const current = pendingEdits[`${studentId}_${dateStr}`]?.status || getCellStatus(studentId, dateStr);
      nextStatus = cycleStatus(current);
    }

    if (nextStatus) {
      const editKey = `${studentId}_${dateStr}`;
      setPendingEdits((prev) => ({
        ...prev,
        [editKey]: {
          studentId,
          date: dateStr,
          status: nextStatus!,
          remarks: prev[editKey]?.remarks,
        },
      }));
    }
  };

  const getCellStatus = (studentId: number, dateStr: string): AttendanceStatusEnum | undefined => {
    const edit = pendingEdits[`${studentId}_${dateStr}`];
    if (edit) return edit.status;
    const row = matrixData?.rows.find((r) => r.studentId === studentId);
    return row?.attendances[dateStr]?.status;
  };

  const getCellRemarks = (studentId: number, dateStr: string): string | null | undefined => {
    const edit = pendingEdits[`${studentId}_${dateStr}`];
    if (edit && edit.remarks !== undefined) return edit.remarks;
    const row = matrixData?.rows.find((r) => r.studentId === studentId);
    return row?.attendances[dateStr]?.remarks;
  };

  // Bulk actions for the selected day
  const handleMarkAllPresentForDay = (targetDate: string) => {
    if (!matrixData || !canManage) return;
    const newEdits = { ...pendingEdits };
    for (const row of matrixData.rows) {
      const editKey = `${row.studentId}_${targetDate}`;
      newEdits[editKey] = {
        studentId: row.studentId,
        date: targetDate,
        status: AttendanceStatusEnum.PRESENT,
        remarks: newEdits[editKey]?.remarks,
      };
    }
    setPendingEdits(newEdits);
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!selectedClassId || !isDirty) return;

    // Group pending edits by date
    const editsByDate: Record<string, EditedCell[]> = {};
    for (const edit of Object.values(pendingEdits)) {
      const list = editsByDate[edit.date] ?? [];
      list.push(edit);
      editsByDate[edit.date] = list;
    }

    try {
      for (const [date, records] of Object.entries(editsByDate)) {
        await batchMutation.mutateAsync({
          classId: selectedClassId,
          date,
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          })),
        });
      }
      setPendingEdits({});
      refetch();
    } catch (err) {
      console.error("Failed to save attendance:", err);
    }
  };

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Compute live summary stats
  const stats = useMemo(() => {
    if (!matrixData) {
      return { totalStudents: 0, presentRate: 0, present: 0, absent: 0, late: 0, excused: 0 };
    }
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    for (const row of matrixData.rows) {
      for (const d of matrixData.dates) {
        const status = pendingEdits[`${row.studentId}_${d}`]?.status || row.attendances[d]?.status;
        if (status === AttendanceStatusEnum.PRESENT) totalPresent++;
        else if (status === AttendanceStatusEnum.ABSENT) totalAbsent++;
        else if (status === AttendanceStatusEnum.LATE) totalLate++;
        else if (status === AttendanceStatusEnum.EXCUSED || status === AttendanceStatusEnum.ON_LEAVE) totalExcused++;
      }
    }

    const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;
    const presentRate =
      totalRecords > 0
        ? Math.round(((totalPresent + totalLate * 0.5) / totalRecords) * 100)
        : 100;

    return {
      totalStudents: matrixData.totalStudents,
      presentRate,
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      excused: totalExcused,
    };
  }, [matrixData, pendingEdits]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Left: Class & Month Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <select
              value={selectedClassId ? String(selectedClassId) : ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              disabled={isLoadingClasses}
              aria-label="Select Class"
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
            >
              {classesList.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name} ({cls.gradeLevel || cls.code || "Class"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold text-slate-800 px-2 min-w-[130px] text-center">
              {monthNames[selectedMonth - 1] ?? "Month"} {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAllPresentForDay(selectedDayStr)}
                className="text-xs font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                title={`Mark all students Present for ${selectedDayStr}`}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Mark Today Present
              </Button>

              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingEdits({})}
                  className="text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Discard
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={!isDirty || batchMutation.isPending}
                className={`text-xs font-bold transition-all ${isDirty
                  ? "bg-[#45AC5E] hover:bg-[#3d9853] text-white shadow-sm ring-2 ring-emerald-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
              >
                {batchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save Changes {isDirty && `(${Object.keys(pendingEdits).length})`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-4 rounded-xl border border-emerald-100">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Enrolled Students</span>
          <span className="text-xl font-bold text-slate-800">{stats.totalStudents}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-emerald-700 uppercase">Attendance Rate</span>
          <span className="text-xl font-bold text-emerald-700">{stats.presentRate}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-emerald-600 uppercase">Total Present</span>
          <span className="text-xl font-bold text-emerald-800">{stats.present}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-rose-600 uppercase">Total Absent</span>
          <span className="text-xl font-bold text-rose-700">{stats.absent}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-amber-600 uppercase">Total Late</span>
          <span className="text-xl font-bold text-amber-700">{stats.late}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-blue-600 uppercase">Total Excused</span>
          <span className="text-xl font-bold text-blue-700">{stats.excused}</span>
        </div>
      </div>

      {/* Keyboard instructions badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            Click cell to cycle status:
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">P</kbd>
            <span className="text-emerald-700 font-semibold">Present</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">A</kbd>
            <span className="text-rose-700 font-semibold">Absent</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">L</kbd>
            <span className="text-amber-700 font-semibold">Late</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">E</kbd>
            <span className="text-blue-700 font-semibold">Excused</span>
          </span>
        </div>
        {isFetchingMatrix && (
          <span className="flex items-center gap-1 text-slate-400 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating sheet...
          </span>
        )}
      </div>

      {/* Interactive Sheet Matrix Grid */}
      <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-[650px]">
        {isLoadingMatrix ? (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#45AC5E]" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Loading attendance matrix...</p>
          </div>
        ) : !matrixData || matrixData.rows.length === 0 ? (
          <div className="py-24 text-center">
            <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-base font-semibold text-slate-700">No students enrolled</p>
            <p className="text-xs text-slate-400 mt-1">
              Select a different class or enroll students in this class.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse select-none">
            {/* Header */}
            <thead className="bg-slate-50 text-slate-700 sticky top-0 z-20 shadow-sm">
              <tr className="border-b border-slate-200">
                {/* Sticky Left Column 1: Index */}
                <th className="sticky left-0 z-30 bg-slate-50 px-3 py-3 font-bold text-center w-10 border-r border-slate-200">
                  #
                </th>
                {/* Sticky Left Column 2: Student Details */}
                <th className="sticky left-10 z-30 bg-slate-50 px-4 py-3 font-bold min-w-[200px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Student Name
                </th>
                {/* Date Columns */}
                {matrixData.dates.map((dateStr) => {
                  const d = new Date(dateStr);
                  const dayNum = d.getDate();
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const holiday = getHoliday(dateStr);
                  const isToday = dateStr === today.toISOString().slice(0, 10);

                  return (
                    <th
                      key={dateStr}
                      onClick={() => setSelectedDayStr(dateStr)}
                      className={`px-1.5 py-2 text-center min-w-[42px] border-r border-slate-100 cursor-pointer transition-colors ${isToday
                        ? "bg-emerald-100/60 text-emerald-900 font-extrabold"
                        : isWeekend || holiday?.name
                          ? "bg-slate-100/70 text-slate-400"
                          : "hover:bg-slate-100 text-slate-700"
                        }`}
                      title={`${dateStr} (${dayName}) - Click to set target`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-semibold">{dayName[0]}</span>
                        <span className={`text-xs ${isToday ? "underline font-bold" : ""}`}>
                          {dayNum}
                        </span>
                      </div>
                    </th>
                  );
                })}
                {/* Right Columns: Summary */}
                <th className="px-3 py-3 text-center font-bold bg-slate-50 min-w-[60px] border-l border-slate-200">
                  Pres %
                </th>
                <th className="px-2 py-3 text-center font-semibold text-emerald-700 bg-slate-50 w-10">
                  P
                </th>
                <th className="px-2 py-3 text-center font-semibold text-rose-700 bg-slate-50 w-10">
                  A
                </th>
                <th className="px-2 py-3 text-center font-semibold text-amber-700 bg-slate-50 w-10">
                  L
                </th>
                <th className="px-2 py-3 text-center font-semibold text-blue-700 bg-slate-50 w-10">
                  E
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {matrixData.rows.map((row, idx) => {
                let rowPresent = 0;
                let rowAbsent = 0;
                let rowLate = 0;
                let rowExcused = 0;

                return (
                  <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Index */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-2 py-2 text-center text-slate-400 border-r border-slate-100 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Student Name & Code */}
                    <td className="sticky left-10 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          {row.lastName} {row.firstName}
                          {row.lastNameKm && (
                            <span className="ml-1.5 text-xs text-slate-500 font-normal">
                              ({row.lastNameKm} {row.firstNameKm})
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{row.studentCode || `ID:${row.studentId}`}</span>
                          <span>•</span>
                          <span>{row.gender}</span>
                        </div>
                      </div>
                    </td>

                    {/* Matrix Cells */}
                    {matrixData.dates.map((dateStr) => {
                      const d = new Date(dateStr);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isFuture = d > today;
                      const isHoliday = getIsHoliday(dateStr);
                      const status = getCellStatus(row.studentId, dateStr);
                      const remarks = getCellRemarks(row.studentId, dateStr);
                      const isEdited = Boolean(pendingEdits[`${row.studentId}_${dateStr}`]);

                      if (status === AttendanceStatusEnum.PRESENT) rowPresent++;
                      else if (status === AttendanceStatusEnum.ABSENT) rowAbsent++;
                      else if (status === AttendanceStatusEnum.LATE) rowLate++;
                      else if (status === AttendanceStatusEnum.EXCUSED || status === AttendanceStatusEnum.ON_LEAVE) rowExcused++;

                      const diableCondition = isWeekend || isFuture || isHoliday;

                      return (
                        <td
                          key={dateStr}
                          className={`p-1 text-center border-r border-slate-100 ${isEdited ? "bg-amber-50/50" : ""
                            }`}
                        >
                          <button
                            type="button"

                            onClick={() => handleCellClick(row.studentId, dateStr, status)}
                            onKeyDown={(e) => handleKeyDown(e, row.studentId, dateStr)}
                            disabled={!canManage || diableCondition}
                            title={
                              remarks
                                ? `${status} (${remarks})`
                                : status
                                  ? `${status} - Click to cycle`
                                  : "Unmarked - Click to mark"
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all mx-auto focus:outline-none focus:ring-2 focus:ring-[#45AC5E] ${status === AttendanceStatusEnum.PRESENT
                              ? "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600"
                              : status === AttendanceStatusEnum.ABSENT
                                ? "bg-rose-500 text-white shadow-xs hover:bg-rose-600"
                                : status === AttendanceStatusEnum.LATE
                                  ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                                  : status === AttendanceStatusEnum.EXCUSED || status === AttendanceStatusEnum.ON_LEAVE
                                    ? "bg-blue-500 text-white shadow-xs hover:bg-blue-600"
                                    : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-600"
                              } ${isEdited ? "ring-2 ring-amber-400 font-extrabold" : ""}`}
                          >
                            {status === AttendanceStatusEnum.PRESENT
                              ? "P"
                              : status === AttendanceStatusEnum.ABSENT
                                ? "A"
                                : status === AttendanceStatusEnum.LATE
                                  ? "L"
                                  : status === AttendanceStatusEnum.EXCUSED || status === AttendanceStatusEnum.ON_LEAVE
                                    ? "E"
                                    : "·"}
                          </button>
                        </td>
                      );
                    })}

                    {/* Summary Calculations */}
                    {(() => {
                      const totalRec = rowPresent + rowAbsent + rowLate + rowExcused;
                      const rate =
                        totalRec > 0
                          ? Math.round(((rowPresent + rowLate * 0.5) / totalRec) * 100)
                          : 100;

                      return (
                        <>
                          <td className="px-2 py-2 text-center font-bold border-l border-slate-200 text-xs">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] ${rate >= 90
                                ? "bg-emerald-50 text-emerald-700"
                                : rate >= 75
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                                }`}
                            >
                              {rate}%
                            </span>
                          </td>
                          <td className="px-1 py-2 text-center text-xs font-semibold text-emerald-700">
                            {rowPresent}
                          </td>
                          <td className="px-1 py-2 text-center text-xs font-semibold text-rose-700">
                            {rowAbsent}
                          </td>
                          <td className="px-1 py-2 text-center text-xs font-semibold text-amber-700">
                            {rowLate}
                          </td>
                          <td className="px-1 py-2 text-center text-xs font-semibold text-blue-700">
                            {rowExcused}
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
