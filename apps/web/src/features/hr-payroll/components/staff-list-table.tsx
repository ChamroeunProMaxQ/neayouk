import { useMemo, useState } from "react";
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
} from "lucide-react";
import { usePermission } from "@/features/auth";

export function StaffListTable() {
  const { can } = usePermission();
  const canCreateStaff = can("create", "hr") || can("manage", "hr") || can("create", "teacher");
  const canUpdateStaff = can("update", "hr") || can("manage", "hr") || can("update", "teacher");
  const canDeleteStaff = can("delete", "hr") || can("manage", "hr") || can("delete", "teacher");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindStaffSchema);
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
  } = useStaffInfiniteQuery(queryParams);

  // 3. Page Flattening
  const accumulatedData = useMemo<StaffAttribute[]>(
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

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search staff by name, code, phone..."
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value || undefined })}
              className="pl-8"
            />
          </div>

          {/* Department Filter */}
          <select
            aria-label="Filter by department"
            value={values.department ?? ""}
            onChange={(e) =>
              setValues({
                department: (e.target.value as StaffDepartmentEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            value={values.salaryType ?? ""}
            onChange={(e) =>
              setValues({
                salaryType: (e.target.value as StaffSalaryTypeEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Salary Types</option>
            <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Salary</option>
            <option value={StaffSalaryTypeEnum.HOURLY}>Hourly Rate</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Filter by status"
            value={values.status ?? ""}
            onChange={(e) =>
              setValues({
                status: (e.target.value as StaffStatusEnum) || undefined,
              })
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Staff Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[120px]">Staff Code</TableHead>
              <TableHead>Staff Member</TableHead>
              <TableHead>Department & Role</TableHead>
              <TableHead>Compensation</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading staff directory...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">No staff members found</p>
                    <p className="text-xs">Try adjusting your search criteria or add a new staff member.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {staff.staffCode || `#${staff.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <span>{staff.name}</span>
                        {staff.nameKm && (
                          <span className="text-xs text-muted-foreground">
                            ({staff.nameKm})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {staff.phone && <span>{staff.phone}</span>}
                        {staff.phone && staff.email && <span>•</span>}
                        {staff.email && <span>{staff.email}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-xs">{staff.designation}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {staff.department}
                        </Badge>
                        {staff.specialization && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                            {staff.specialization}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      {staff.salaryType === StaffSalaryTypeEnum.HOURLY ? (
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span>${staff.hourlyRate?.toFixed(2)} / hr</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                          <span>${staff.baseSalary?.toFixed(2)} / mo</span>
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {staff.employmentType?.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {staff.user ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/20 bg-primary/5 text-primary text-[11px]"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>@{staff.user.username}</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No login
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StaffStatusBadge status={staff.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenDetail(staff)}
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdateStaff && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleOpenDelete(staff)}
                          title="Delete Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Infinite Scroll Indicator */}
        <div ref={sentinelRef} className="py-4 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading more staff members...</span>
            </div>
          )}
          {!hasNextPage && accumulatedData.length > 0 && (
            <p className="text-xs text-muted-foreground">
              All {accumulatedData.length} staff members loaded
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
