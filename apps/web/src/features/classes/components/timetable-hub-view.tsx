import { useState, useMemo } from "react";
import { useClassesQuery } from "../hooks/use-classes-infinite-query";
import { ClassTimetableGrid } from "./class-timetable-grid";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Users,
  Search,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TimetableHubView() {
  const { data: classesData, isLoading } = useClassesQuery({ pageSize: 100 });
  const classes = classesData?.data ?? [];

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchClass, setSearchClass] = useState("");

  const filteredClasses = useMemo(() => {
    if (!searchClass) return classes;
    const q = searchClass.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.programName && c.programName.toLowerCase().includes(q))
    );
  }, [classes, searchClass]);

  const currentClassId = selectedClassId ?? classes[0]?.id;
  const currentClass = classes.find((c) => c.id === currentClassId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-[#45AC5E]" />
            School Class Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore and manage weekly academic schedules across classes, shifts, and classrooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Timetable
          </Button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Class / Section
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchClass}
              onChange={(e) => setSearchClass(e.target.value)}
              placeholder="Search class name or code..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Loading class options...
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No classes found matching search.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
            {filteredClasses.map((cls) => {
              const isSelected = cls.id === currentClassId;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#45AC5E] text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                >
                  <GraduationCap className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-[#45AC5E]"}`} />
                  <span>{cls.name}</span>
                  {cls.code && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? "bg-emerald-700/60 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cls.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Class Banner & Timetable Grid */}
      {currentClass ? (
        <div className="space-y-4">
          {/* Summary Card for the chosen class */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#45AC5E] border border-emerald-100">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentClass.name}</span>
                    {currentClass.code && (
                      <span className="text-xs font-mono text-[#45AC5E] bg-emerald-50 px-2 py-0.5 rounded">
                        {currentClass.code}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Program: <strong>{currentClass.programName || "General"}</strong></span>
                    <span>Session: <strong>{currentClass.academicYear || "2025-2026"}</strong></span>
                    <span>Term: <strong>{currentClass.semester || "SEMESTER_1"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-50 text-[#45AC5E] hover:bg-emerald-50 text-xs font-semibold py-1">
                  <Clock className="mr-1 h-3 w-3" />
                  {currentClass.shift || "MORNING"} ({currentClass.startTime || "07:30"} - {currentClass.endTime || "11:30"})
                </Badge>
                {currentClass.room && (
                  <Badge variant="outline" className="border-slate-200 text-slate-700 text-xs font-medium py-1">
                    <MapPin className="mr-1 h-3 w-3 text-slate-400" />
                    {currentClass.room}
                  </Badge>
                )}
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-xs font-medium py-1">
                  <Users className="mr-1 h-3 w-3 text-slate-400" />
                  {currentClass.studentCount || 0} Students
                </Badge>
              </div>
            </div>
          </div>

          {/* Interactive Timetable Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <ClassTimetableGrid classId={currentClass.id} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center bg-white">
          <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Class Selected</p>
          <p className="text-xs text-slate-400 mt-1">
            Please choose a class from the selector above to view its timetable.
          </p>
        </div>
      )}
    </div>
  );
}
