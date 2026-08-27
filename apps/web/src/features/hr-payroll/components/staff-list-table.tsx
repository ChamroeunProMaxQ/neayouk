import { useMemo, useState } from "react";
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
  FindStaffSchema,
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  StaffStatusEnum,
  type StaffAttribute,
} from "@repo/contracts";
import { useStaffInfiniteQuery } from "../hooks/use-staff-infinite-query";
import { StaffStatusBadge } from "./staff-status-badge";
import { StaffFormDialog } from "./staff-form-dialog";
import { StaffDetailDialog } from "./staff-detail-dialog";
import { DeleteStaffDialog } from "./delete-staff-dialog";
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
  Building2,
  DollarSign,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { usePermission } from "@/features/auth";

export function StaffListTable() {
  const { can } = usePermission();
  const canCreateStaff = can("create", "hr") || can("manage", "hr") || can("create", "teacher");
  const canUpdateStaff = can("update", "hr") || can("manage", "hr") || can("update", "teacher");
  const canDeleteStaff = can("delete", "hr") || can("manage", "hr") || can("delete", "teacher");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindStaffSchema);
  const { search, department, salaryType, status, sortBy = "id", sortOrder = "DESC" } = values;
  const debouncedSearch = useDebounce(search, 600);

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
  } = useStaffInfiniteQuery(queryParams);

  // 3. Page Flattening
  const accumulatedData = useMemo<StaffAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const totalCount =
    data?.pages[0]?.pagination?.totalCount ?? accumulatedData.length;

  // 4. Infinite Scroll Sentinel
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Modal Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffAttribute | null>(null);
  const [detailStaffId, setDetailStaffId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState<StaffAttribute | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleOpenCreate = () => {
    setSelectedStaffForEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (staff: StaffAttribute) => {
    setSelectedStaffForEdit(staff);
    setFormOpen(true);
  };

  const handleOpenDetail = (staff: StaffAttribute) => {
    setDetailStaffId(staff.id);
    setDetailOpen(true);
  };

  const handleOpenDelete = (staff: StaffAttribute) => {
    setDeleteStaff(staff);
    setDeleteOpen(true);
  };

  const handleSort = (field: "id" | "name" | "staffCode" | "department" | "baseSalary" | "status" | "createdAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<StaffAttribute>[]>(
    () => [
      {
        accessorKey: "staffCode",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("staffCode")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Staff Code</span>
            {sortBy === "staffCode" ? (
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
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {row.original.staffCode || `#${row.original.id}`}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Staff Member</span>
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
          const staff = row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
                <span>{staff.name}</span>
                {staff.nameKm && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({staff.nameKm})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {staff.phone && <span>{staff.phone}</span>}
                {staff.phone && staff.email && <span>•</span>}
                {staff.email && <span>{staff.email}</span>}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("department")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Department & Role</span>
            {sortBy === "department" ? (
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
          const staff = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-xs text-slate-800">{staff.designation}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-700">
                  {staff.department}
                </Badge>
                {staff.specialization && (
                  <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {staff.specialization}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "baseSalary",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("baseSalary")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Compensation</span>
            {sortBy === "baseSalary" ? (
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
          const staff = row.original;
          return (
            <div className="flex flex-col text-xs">
              {staff.salaryType === StaffSalaryTypeEnum.HOURLY ? (
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>${staff.hourlyRate?.toFixed(2)} / hr</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span>${staff.baseSalary?.toFixed(2)} / mo</span>
                </div>
              )}
              <span className="text-[10px] text-slate-400">
                {staff.employmentType?.replace("_", " ")}
              </span>
            </div>
          );
        },
      },
      {
        id: "account",
        header: () => <span className="text-xs font-bold text-slate-700">Account</span>,
        cell: ({ row }) => {
          const staff = row.original;
          return staff.user ? (
            <Badge
              variant="outline"
              className="gap-1 border-[#45AC5E]/30 bg-[#45AC5E]/5 text-[#45AC5E] text-[11px]"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>@{staff.user.username}</span>
            </Badge>
          ) : (
            <span className="text-xs text-slate-400 italic">
              No login
            </span>
          );
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
        cell: ({ getValue }) => <StaffStatusBadge status={getValue<StaffStatusEnum>()} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
                onClick={() => handleOpenDetail(staff)}
                title="View Profile"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canUpdateStaff && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
                  onClick={() => handleOpenEdit(staff)}
                  title="Edit Staff"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {canDeleteStaff && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  onClick={() => handleOpenDelete(staff)}
                  title="Delete Staff"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdateStaff, canDeleteStaff]
  );

  const table = useReactTable({
    data: accumulatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search staff by name, code, phone..."
              value={search ?? ""}
              onChange={(e) => setValues({ search: e.target.value || undefined })}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Department Filter */}
          <select
            aria-label="Filter by department"
            value={department ?? ""}
            onChange={(e) =>
              setValues({
                department: (e.target.value as StaffDepartmentEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Departments</option>
            {Object.values(StaffDepartmentEnum).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Salary Type Filter */}
          <select
            aria-label="Filter by salary type"
            value={salaryType ?? ""}
            onChange={(e) =>
              setValues({
                salaryType: (e.target.value as StaffSalaryTypeEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Salary Types</option>
            <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Salary</option>
            <option value={StaffSalaryTypeEnum.HOURLY}>Hourly Rate</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            value={status ?? ""}
            onChange={(e) =>
              setValues({
                status: (e.target.value as StaffStatusEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            {Object.values(StaffStatusEnum).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {canCreateStaff && (
          <Button
            onClick={handleOpenCreate}
            className="bg-[#45AC5E] hover:bg-[#3b9450] text-white font-medium text-xs h-9 px-4 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load staff members."}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/80">
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
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#45AC5E]" />
                    <span>Loading staff directory...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Building2 className="h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No staff members found</p>
                    <p className="text-xs">Try adjusting your search criteria or add a new staff member.</p>
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

        {/* Infinite Scroll Indicator */}
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
              <span>Loading more staff members...</span>
            </div>
          )}
          {!hasNextPage && accumulatedData.length > 0 && (
            <p className="text-xs text-slate-400">
              All {totalCount} staff members loaded
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        staff={selectedStaffForEdit}
      />

      <StaffDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        staffId={detailStaffId}
      />

      <DeleteStaffDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        staff={deleteStaff}
      />
    </div>
  );
}

