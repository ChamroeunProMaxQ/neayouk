import { useMemo, useState } from "react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import {
  FindTeachersSchema,
  TeacherGenderEnum,
  TeacherStatusEnum,
  type TeacherAttribute,
} from "@repo/contracts";
import { useTeachersInfiniteQuery } from "../hooks/use-teachers-infinite-query";
import { TeacherStatusBadge } from "./teacher-status-badge";
import { TeacherFormDialog } from "./teacher-form-dialog";
import { TeacherDetailDialog } from "./teacher-detail-dialog";
import { DeleteTeacherDialog } from "./delete-teacher-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { usePermission } from "@/features/auth";

export function TeacherListTable() {
  const { can } = usePermission();
  const canCreateTeacher = can("create", "teacher") || can("manage", "teacher");
  const canUpdateTeacher = can("update", "teacher") || can("manage", "teacher");
  const canDeleteTeacher = can("delete", "teacher") || can("manage", "teacher");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindTeachersSchema);
  const debouncedSearch = useDebounce(values.search, 800);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize: 20,
    }),
    [debouncedSearch, values]
  );

  // 2. Data Fetching
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTeachersInfiniteQuery(queryParams);

  // 3. Page Flattening
  const accumulatedData = useMemo<TeacherAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // 4. Infinite Scroll Sentinel
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Modal Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<TeacherAttribute | null>(null);
  const [detailTeacherId, setDetailTeacherId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTeacher, setDeleteTeacher] = useState<TeacherAttribute | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleOpenCreate = () => {
    setSelectedTeacherForEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherAttribute) => {
    setSelectedTeacherForEdit(teacher);
    setFormOpen(true);
  };

  const handleOpenDetail = (teacher: TeacherAttribute) => {
    setDetailTeacherId(teacher.id);
    setDetailOpen(true);
  };

  const handleOpenDelete = (teacher: TeacherAttribute) => {
    setDeleteTeacher(teacher);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value })}
              placeholder="Search by name, code, phone, subject..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={values.status ?? ""}
            onChange={(e) => setValues({ status: e.target.value || undefined })}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value={TeacherStatusEnum.ACTIVE}>Active</option>
            <option value={TeacherStatusEnum.ON_LEAVE}>On Leave</option>
            <option value={TeacherStatusEnum.INACTIVE}>Inactive</option>
            <option value={TeacherStatusEnum.ARCHIVED}>Archived</option>
          </select>

          {/* Gender Filter */}
          <select
            value={values.gender ?? ""}
            onChange={(e) => setValues({ gender: (e.target.value as TeacherGenderEnum) || undefined })}
            aria-label="Filter by gender"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Genders</option>
            <option value={TeacherGenderEnum.MALE}>Male</option>
            <option value={TeacherGenderEnum.FEMALE}>Female</option>
            <option value={TeacherGenderEnum.OTHER}>Other</option>
          </select>

          {/* Account Filter */}
          <select
            value={values.hasAccount === true ? "true" : values.hasAccount === false ? "false" : ""}
            onChange={(e) =>
              setValues({
                hasAccount: e.target.value === "true" ? true : e.target.value === "false" ? false : undefined,
              })
            }
            aria-label="Filter by account"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Accounts</option>
            <option value="true">With Login Account</option>
            <option value="false">Without Account</option>
          </select>
        </div>

        {/* Add Teacher Button */}
        <Button
          onClick={handleOpenCreate}
          disabled={!canCreateTeacher}
          title={!canCreateTeacher ? "You do not have permission to add teachers" : undefined}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-4 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="font-semibold text-slate-700 py-3.5">Teacher Profile</TableHead>
              <TableHead className="font-semibold text-slate-700">Specialty & Contact</TableHead>
              <TableHead className="font-semibold text-slate-700">Hourly Salary</TableHead>
              <TableHead className="font-semibold text-slate-700">Assigned Classes</TableHead>
              <TableHead className="font-semibold text-slate-700">Portal Login</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                  <p className="mt-2 text-xs text-slate-500">Loading teacher directory...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                  <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No teachers found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search query or status filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((teacher) => (
                <TableRow
                  key={teacher.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Teacher Name & Code */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-xs border border-emerald-200">
                        {teacher.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div
                          onClick={() => handleOpenDetail(teacher)}
                          className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer"
                        >
                          {teacher.name}
                        </div>
                        {teacher.nameKm && (
                          <div className="text-xs text-slate-500 font-khmer">
                            {teacher.nameKm}
                          </div>
                        )}
                        <div className="text-[11px] font-mono text-slate-400">
                          {teacher.teacherCode || "NO CODE"}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Specialization & Contact */}
                  <TableCell>
                    <div className="text-xs text-slate-800 font-medium">
                      {teacher.specialization || "-"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {teacher.phone || teacher.email || "-"}
                    </div>
                  </TableCell>

                  {/* Salary Rate */}
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      ${Number(teacher.salaryInHour).toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal"> /hr</span>
                    </div>
                  </TableCell>

                  {/* Assigned Classes Badge */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 font-medium text-slate-700"
                    >
                      <GraduationCap className="mr-1 h-3 w-3 text-emerald-600 inline" />
                      {teacher.classes?.length ?? teacher.classCount ?? 0} Classes
                    </Badge>
                  </TableCell>

                  {/* Portal Login Status */}
                  <TableCell>
                    {teacher.user ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[11px]"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600 inline" />
                        {teacher.user.username}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">No Login</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <TeacherStatusBadge status={teacher.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDetail(teacher)}
                        title="View Details"
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(teacher)}
                        disabled={!canUpdateTeacher}
                        title={!canUpdateTeacher ? "You do not have permission to edit teachers" : "Edit Teacher"}
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDelete(teacher)}
                        disabled={!canDeleteTeacher}
                        title={!canDeleteTeacher ? "You do not have permission to delete teachers" : "Delete Teacher"}
                        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel / Bottom status */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-600" />
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          `All ${data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length} teachers loaded`
        ) : null}
      </div>

      {/* Modals */}
      <TeacherFormDialog
        teacher={selectedTeacherForEdit}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <TeacherDetailDialog
        teacherId={detailTeacherId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleOpenEdit}
      />

      <DeleteTeacherDialog
        teacher={deleteTeacher}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
