import { useMemo, useState, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { usePermission } from "@/features/auth";

export const TeacherListTable: FC = () => {
  const { can } = usePermission();
  const canCreateTeacher = can("create", "teacher") || can("manage", "teacher");
  const canUpdateTeacher = can("update", "teacher") || can("manage", "teacher");
  const canDeleteTeacher = can("delete", "teacher") || can("manage", "teacher");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindTeachersSchema);
  const { search, status, gender, hasAccount, sortBy = "id", sortOrder = "DESC" } = values;
  const debouncedSearch = useDebounce(search, 800);

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
    isError,
    error,
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

  const handleSort = (field: "id" | "name" | "teacherCode" | "salaryInHour" | "status" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  // Columns definition
  const columns = useMemo<ColumnDef<TeacherAttribute>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Teacher Profile</span>
            {sortBy === "name" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const teacher = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-xs border border-emerald-200">
                {teacher.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleOpenDetail(teacher)}
                  className="font-semibold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer text-left text-xs"
                >
                  {teacher.name}
                </button>
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
          );
        },
      },
      {
        accessorKey: "specialization",
        header: () => <span className="text-xs font-bold text-slate-700">Specialty & Contact</span>,
        cell: ({ row }) => {
          const teacher = row.original;
          return (
            <div>
              <div className="text-xs text-slate-800 font-medium">
                {teacher.specialization || "-"}
              </div>
              <div className="text-[11px] text-slate-500">
                {teacher.phone || teacher.email || "-"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "salaryInHour",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("salaryInHour")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Hourly Salary</span>
            {sortBy === "salaryInHour" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-mono text-xs font-semibold text-slate-900">
            ${Number(getValue<number>() || 0).toFixed(2)}
            <span className="text-[10px] text-slate-400 font-normal"> /hr</span>
          </div>
        ),
      },
      {
        id: "classes",
        header: () => <span className="text-xs font-bold text-slate-700">Assigned Classes</span>,
        cell: ({ row }) => {
          const teacher = row.original;
          return (
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 font-medium text-slate-700 text-xs"
            >
              <GraduationCap className="mr-1 h-3 w-3 text-emerald-600 inline" />
              {teacher.classes?.length ?? teacher.classCount ?? 0} Classes
            </Badge>
          );
        },
      },
      {
        id: "account",
        header: () => <span className="text-xs font-bold text-slate-700">Portal Login</span>,
        cell: ({ row }) => {
          const teacher = row.original;
          return teacher.user ? (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[11px]"
            >
              <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600 inline" />
              {teacher.user.username}
            </Badge>
          ) : (
            <span className="text-xs text-slate-400">No Login</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <span className="text-xs font-bold text-slate-700">Status</span>,
        cell: ({ getValue }) => <TeacherStatusBadge status={getValue<TeacherStatusEnum>()} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const teacher = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenDetail(teacher)}
                title="View Details"
                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenEdit(teacher)}
                disabled={!canUpdateTeacher}
                title={!canUpdateTeacher ? "You do not have permission to edit teachers" : "Edit Teacher"}
                className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenDelete(teacher)}
                disabled={!canDeleteTeacher}
                title={!canDeleteTeacher ? "You do not have permission to delete teachers" : "Delete Teacher"}
                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdateTeacher, canDeleteTeacher]
  );

  const table = useReactTable({
    data: accumulatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const totalCount = data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length;

  return (
    <div className="space-y-4 font-sans">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value })}
              placeholder="Search by name, code, phone, subject..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status ?? ""}
            onChange={(e) => setValues({ status: (e.target.value as TeacherStatusEnum) || undefined })}
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
            value={gender ?? ""}
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
            value={hasAccount === true ? "true" : hasAccount === false ? "false" : ""}
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
          className="bg-[#45AC5E] hover:bg-[#389350] text-white font-medium text-xs h-9 px-4 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load teacher directory."}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/80 hover:bg-slate-50/80">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-xs font-bold text-slate-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#45AC5E]" />
                  <p className="mt-2 text-xs text-slate-500">Loading teacher directory...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <GraduationCap className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No teachers found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search query or status filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel / Bottom status */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
            <span>Loading more teachers...</span>
          </div>
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          <span>All {totalCount} teachers loaded</span>
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
};
