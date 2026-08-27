import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  UserPlus,
  Edit3,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Eye,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  FindStudentsSchema,
  StudentStatusEnum,
  PaymentStatusEnum,
  type StudentAttribute,
  type FindStudentsDto,
} from "@repo/contracts";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudentsInfiniteQuery } from "../hooks/use-students-infinite-query";
import { useClassesQuery } from "../hooks/use-classes-query";
import { StudentFormDialog } from "./student-form-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";
import { StudentDetailDialog } from "./student-detail-dialog";
import { StudentPromoteDialog } from "./student-promote-dialog";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ClassBadgeList } from "./class-badge-list";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";

export const StudentListTable: FC = () => {
  const { can } = usePermission();
  const canCreate = can("create", "student") || can("manage", "student");
  const canUpdate = can("update", "student") || can("manage", "student");
  const canDelete = can("delete", "student") || can("manage", "student");

  const { values, setValue, setValues } = useUrlFilters(FindStudentsSchema);
  const { search, classId, gender, status, paymentStatus, sortBy = "id", sortOrder = "DESC" } = values;

  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 800);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize,
    }),
    [debouncedSearch, pageSize, values]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useStudentsInfiniteQuery(queryParams);

  const { data: classesRes } = useClassesQuery({ pageSize: 100 });
  const classesList = classesRes?.data || [];

  const accumulatedStudents = useMemo<StudentAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentAttribute | null>(null);

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentAttribute | null>(null);

  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [studentToPromote, setStudentToPromote] = useState<StudentAttribute | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentAttribute | null>(null);

  // Infinite Scroll Sentinel
  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(hasNextPage),
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: () => {
      fetchNextPage();
    },
  });

  const handleSort = (field: "id" | "studentCode" | "firstName" | "lastName" | "discount" | "status" | "registeredAt" | "updatedAt") => {
    if (sortBy === field) {
      setValue("sortOrder", sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setValues({
        ...values,
        sortBy: field,
        sortOrder: "ASC",
      });
    }
  };

  const columns = useMemo<ColumnDef<StudentAttribute>[]>(
    () => [
      {
        accessorKey: "studentCode",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("studentCode")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Student</span>
            {sortBy === "studentCode" ? (
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
          const student = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF6EE] flex items-center justify-center text-[#45AC5E] font-bold text-xs shrink-0 border border-[#45AC5E]/20">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                  <span>{student.firstName} {student.lastName}</span>
                  {(student.firstNameKm || student.lastNameKm) && (
                    <span className="text-[11px] font-normal text-slate-500 font-sans">
                      ({student.lastNameKm || ""} {student.firstNameKm || ""})
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {student.studentCode || `ID #${student.id}`}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "gender",
        header: () => <span className="text-xs font-bold text-slate-700">Gender / Contact</span>,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="text-xs">
              <span className="font-medium text-slate-800">{student.gender}</span>
              {student.contact ? (
                <p className="text-[11px] text-slate-500">{student.contact}</p>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No phone</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "classes",
        header: () => <span className="text-xs font-bold text-slate-700">Enrolled Classes</span>,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <ClassBadgeList
              enrollments={student.enrollments}
              classes={student.classes}
              primaryClass={student.primaryClass}
            />
          );
        },
      },
      {
        accessorKey: "discount",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("discount")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Monthly Fee</span>
            {sortBy === "discount" ? (
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
          const student = row.original;
          const baseFee = Number(student.primaryClass?.monthlyFee || 0);
          const discount = Number(student.discount || 0);
          const net = Math.max(0, baseFee - discount);

          return (
            <div className="text-xs">
              <span className="font-bold text-slate-900">${net.toFixed(2)}/mo</span>
              {discount > 0 && (
                <p className="text-[10px] text-[#45AC5E] font-medium">-${discount.toFixed(2)} disc</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "paymentStatus",
        header: () => <span className="text-xs font-bold text-slate-700">Tuition Status</span>,
        cell: ({ row }) => {
          const student = row.original;
          return <PaymentStatusBadge summary={student.paymentSummary} />;
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("status")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Status</span>
            {sortBy === "status" ? (
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
          const s = row.original.status;
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold uppercase ${
                s === StudentStatusEnum.ACTIVE
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : s === StudentStatusEnum.INACTIVE
                  ? "bg-slate-50 text-slate-600 border-slate-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {s}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                title="View Ledger & Details"
                onClick={() => {
                  setSelectedStudentForDetail(student);
                  setIsDetailDialogOpen(true);
                }}
                className="h-8 px-2 text-slate-600 hover:text-[#389350] hover:bg-[#EBF6EE]"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>

              {canUpdate && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Promote to Next Class"
                    onClick={() => {
                      setStudentToPromote(student);
                      setIsPromoteDialogOpen(true);
                    }}
                    className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit Student"
                    onClick={() => {
                      setStudentToEdit(student);
                      setIsFormDialogOpen(true);
                    }}
                    className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Soft Delete Student"
                  onClick={() => {
                    setStudentToDelete(student);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canDelete, canUpdate, sortBy, sortOrder]
  );

  const table = useReactTable({
    data: accumulatedStudents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const totalCount = data?.pages[0]?.pagination?.totalCount ?? accumulatedStudents.length;

  return (
    <div className="space-y-4">
      {/* Header Controls & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search by name, Khmer name, code, contact..."
              value={search ?? ""}
              onChange={(e) => setValue("search", e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-[#45AC5E]/20"
            />
          </div>

          {/* Filter: Class */}
          <select
            value={classId ? String(classId) : ""}
            onChange={(e) => setValue("classId", e.target.value ? Number(e.target.value) : undefined)}
            aria-label="Filter by Class"
            className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Classes</option>
            {classesList.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filter: Status */}
          <select
            value={status ?? ""}
            onChange={(e) => setValue("status", e.target.value ? (e.target.value as StudentStatusEnum) : undefined)}
            aria-label="Filter by Status"
            className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value={StudentStatusEnum.ACTIVE}>Active</option>
            <option value={StudentStatusEnum.INACTIVE}>Inactive</option>
            <option value={StudentStatusEnum.SUSPENDED}>Suspended</option>
            <option value={StudentStatusEnum.GRADUATED}>Graduated</option>
            <option value={StudentStatusEnum.DROPPED}>Dropped</option>
          </select>

          {/* Filter: Gender */}
          <select
            value={gender ?? ""}
            onChange={(e) => setValue("gender", e.target.value ? (e.target.value as "MALE" | "FEMALE" | "OTHER") : undefined)}
            aria-label="Filter by Gender"
            className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Filter: Payment Status */}
          <select
            value={paymentStatus ?? ""}
            onChange={(e) =>
              setValue(
                "paymentStatus",
                e.target.value ? (e.target.value as FindStudentsDto["paymentStatus"]) : undefined
              )
            }
            aria-label="Filter by Payment Status"
            className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none font-medium"
          >
            <option value="">All Payment Statuses</option>
            <option value={PaymentStatusEnum.PAID}>Paid</option>
            <option value={PaymentStatusEnum.PARTIAL}>Partial</option>
            <option value={PaymentStatusEnum.UNPAID}>Unpaid</option>
            <option value={PaymentStatusEnum.OVERDUE}>Overdue</option>
          </select>
        </div>

        {/* Action Button */}
        {canCreate && (
          <Button
            onClick={() => {
              setStudentToEdit(null);
              setIsFormDialogOpen(true);
            }}
            className="bg-[#45AC5E] hover:bg-[#389350] text-white text-xs font-semibold h-9 shrink-0 shadow-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Register Student
          </Button>
        )}
      </div>

      {/* Main Student Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-[#45AC5E]" />
                    <span>Loading student records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-rose-600">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-7 h-7" />
                    <span>{error?.message || "Failed to load students"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                    <span className="font-medium text-sm text-slate-600">No student records found</span>
                    <span className="text-xs text-slate-400">Try adjusting your search or filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/60 transition-colors">
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

        {/* Sentinel & Infinite Scroll Loader */}
        <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#45AC5E]" />
              <span>Loading more students...</span>
            </div>
          ) : hasNextPage ? (
            <span>Scroll down to load more</span>
          ) : accumulatedStudents.length > 0 ? (
            <span>Showing all {totalCount} students</span>
          ) : null}
        </div>
      </div>

      {/* Dialogs */}
      <StudentFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        studentToEdit={studentToEdit}
      />

      <StudentDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        student={selectedStudentForDetail}
      />

      {studentToPromote && (
        <StudentPromoteDialog
          isOpen={isPromoteDialogOpen}
          onClose={() => setIsPromoteDialogOpen(false)}
          student={studentToPromote}
        />
      )}

      <DeleteStudentDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        student={studentToDelete}
      />
    </div>
  );
};
