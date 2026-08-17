import { useMemo, useState } from "react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import {
  FindClassesSchema,
  type ClassAttribute,
  SemesterEnum,
  ShiftEnum,
} from "@repo/contracts";
import { useClassesInfiniteQuery } from "../hooks/use-classes-infinite-query";
import { ClassFormDialog } from "./class-form-dialog";
import { ClassDetailDialog } from "./class-detail-dialog";
import { DeleteClassDialog } from "./delete-class-dialog";
import { PromoteClassDialog } from "./promote-class-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export function ClassListTable() {
  // 1. URL Filter Sync & Debounced Search
  const { values, setValues } = useUrlFilters(FindClassesSchema);
  const debouncedSearch = useDebounce(values.search, 800);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize: 20,
    }),
    [debouncedSearch, values]
  );

  // 2. TanStack Query Infinite Fetching
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClassesInfiniteQuery(queryParams);

  // 3. Flatten Pages
  const accumulatedData = useMemo<ClassAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const totalClasses = data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length;
  const totalStudents = useMemo(
    () =>
      accumulatedData.reduce(
        (sum, c) => sum + (c.studentCount || 0),
        0
      ),
    [accumulatedData]
  );

  // 4. Sentinel Ref
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassAttribute | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState("overview");

  const handleCreate = () => {
    setSelectedClass(null);
    setFormOpen(true);
  };

  const handleEdit = (cls: ClassAttribute) => {
    setSelectedClass(cls);
    setFormOpen(true);
  };

  const handlePromote = (cls: ClassAttribute) => {
    setSelectedClass(cls);
    setPromoteOpen(true);
  };

  const handleViewDetail = (cls: ClassAttribute, tab = "overview") => {
    setSelectedClass(cls);
    setDetailInitialTab(tab);
    setDetailOpen(true);
  };

  const handleDelete = (cls: ClassAttribute) => {
    setSelectedClass(cls);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-[#45AC5E]" />
            Academic Classes & Sections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure academic classes, shift schedules, term dates, student enrollment headcounts, and weekly timetables.
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-[#45AC5E] hover:bg-[#3d9853] text-white gap-2 font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Class
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Classes
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#45AC5E] flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalClasses}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum offerings</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalStudents}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across active classes</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Daily Shifts
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">Morning / Afternoon</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Flexible class timetables</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Academic Session
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">2025-2026</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Semester 1 & 2 Active</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value || undefined })}
              placeholder="Search class, code, room..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Academic Year Filter */}
          <select
            value={values.academicYear ?? ""}
            onChange={(e) => setValues({ academicYear: e.target.value || undefined })}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Academic Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>

          {/* Semester / Term Filter */}
          <select
            value={values.semester ?? ""}
            onChange={(e) => setValues({ semester: (e.target.value as SemesterEnum) || undefined })}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Terms / Semesters</option>
            {Object.values(SemesterEnum).map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={values.shift ?? ""}
            onChange={(e) => setValues({ shift: (e.target.value as ShiftEnum) || undefined })}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Shifts</option>
            {Object.values(ShiftEnum).map((shift) => (
              <option key={shift} value={shift}>
                {shift}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Classes Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700">Class Name & Code</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Program / Grade</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Academic Term</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Shift & Schedule</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Room</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 text-center">Enrolled Students</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Monthly Fee</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#45AC5E]" />
                  <p className="mt-2 text-xs text-slate-500">Loading academic classes...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <GraduationCap className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Classes Found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filters or click &ldquo;Create Class&rdquo; to add one.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((cls) => (
                <TableRow
                  key={cls.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(cls, "overview")}
                >
                  {/* Name & Code */}
                  <TableCell>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{cls.name}</p>
                      {cls.code && (
                        <p className="text-[11px] font-mono text-[#45AC5E]">
                          {cls.code}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Program / Grade */}
                  <TableCell>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold">
                        {(typeof cls.program === "object" && cls.program
                          ? cls.program.name
                          : cls.programName || cls.program) || "General"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {cls.gradeLevel ? `Grade ${cls.gradeLevel}` : "Standard"} {cls.section ? `• Sec ${cls.section}` : ""}
                      </p>
                    </div>
                  </TableCell>

                  {/* Academic Year & Semester */}
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">{cls.academicYear || "2025-2026"}</p>
                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 mt-0.5">
                        {cls.semester || "SEMESTER_1"}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Shift & Daily Time */}
                  <TableCell>
                    <div className="text-xs">
                      <Badge className="bg-emerald-50 text-[#45AC5E] hover:bg-emerald-50 text-[10px] font-bold">
                        {cls.shift || "MORNING"}
                      </Badge>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {cls.startTime || "07:30"} - {cls.endTime || "11:30"}
                      </p>
                    </div>
                  </TableCell>

                  {/* Room */}
                  <TableCell>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {cls.room || "—"}
                    </span>
                  </TableCell>

                  {/* Enrolled Students Headcount */}
                  <TableCell className="text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(cls, "students");
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 hover:bg-emerald-50 hover:text-[#45AC5E] transition-colors text-xs font-bold"
                      title="View enrolled students roster"
                    >
                      <Users className="h-3.5 w-3.5 text-[#45AC5E]" />
                      <span>{cls.studentCount || 0} Students</span>
                    </button>
                  </TableCell>

                  {/* Monthly Fee */}
                  <TableCell>
                    <span className="text-xs font-bold text-slate-800">
                      ${Number(cls.monthlyFee || 0).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(cls, "overview")}
                        title="View Class Details & Roster"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(cls, "timetable")}
                        title="View & Edit Timetable"
                        className="h-7 w-7 text-[#45AC5E] hover:bg-emerald-50"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePromote(cls)}
                        title="Promote Class / Advance to Next Level (Semester End)"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cls)}
                        title="Edit Class"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cls)}
                        title="Delete Class"
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
            <span>Loading more classes...</span>
          </div>
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          <span>All {totalClasses} classes loaded</span>
        ) : null}
      </div>

      {/* Dialogs */}
      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cls={selectedClass}
      />

      <ClassDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        cls={selectedClass}
        initialTab={detailInitialTab}
      />

      <DeleteClassDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        cls={selectedClass}
      />

      <PromoteClassDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        fromClass={selectedClass}
      />
    </div>
  );
}
