import { useMemo, useState, type FC } from "react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import {
  FindLeaveRequestsSchema,
  LeaveStatusEnum,
  LeaveTypeEnum,
  type LeaveRequestAttribute,
} from "@repo/contracts";
import {
  useLeaveRequestsInfiniteQuery,
  useDeleteLeaveRequestMutation,
} from "../hooks/use-leave-requests";
import { useTeachersQuery } from "@/features/teachers/hooks/use-teachers-query";
import { usePermission } from "@/features/auth";
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
import {
  Loader2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  UserCheck,
} from "lucide-react";
import {
  LeaveStatusBadge,
  LeaveTypeBadge,
} from "./attendance-status-badge";
import { LeaveRequestFormDialog } from "./leave-request-form-dialog";
import { ReviewLeaveDialog } from "./review-leave-dialog";

export const LeaveRequestListTable: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "attendance") || can("create", "attendance");
  const canReview = can("manage", "attendance") || can("update", "attendance");

  // 1. URL Filters & Debounced Search
  const { values, setValues } = useUrlFilters(FindLeaveRequestsSchema);
  const debouncedSearch = useDebounce(values.search, 600);

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
  } = useLeaveRequestsInfiniteQuery(queryParams);

  const { data: teachersData } = useTeachersQuery();
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const deleteMutation = useDeleteLeaveRequestMutation();

  // 3. Flatten Pages
  const accumulatedData = useMemo<LeaveRequestAttribute[]>(
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

  // Modal dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLeaveForEdit, setSelectedLeaveForEdit] = useState<LeaveRequestAttribute | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState<LeaveRequestAttribute | null>(null);

  const handleOpenCreate = () => {
    setSelectedLeaveForEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (leave: LeaveRequestAttribute) => {
    setSelectedLeaveForEdit(leave);
    setFormOpen(true);
  };

  const handleOpenReview = (leave: LeaveRequestAttribute) => {
    setSelectedLeaveForReview(leave);
    setReviewOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this leave application?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={values.search ?? ""}
              onChange={(e) => setValues({ search: e.target.value })}
              placeholder="Search teacher, reason..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={values.status ?? ""}
            onChange={(e) => setValues({ status: (e.target.value as LeaveStatusEnum) || undefined })}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="">All Statuses</option>
            <option value={LeaveStatusEnum.PENDING}>Pending</option>
            <option value={LeaveStatusEnum.APPROVED}>Approved</option>
            <option value={LeaveStatusEnum.REJECTED}>Rejected</option>
            <option value={LeaveStatusEnum.CANCELLED}>Cancelled</option>
          </select>

          {/* Leave Type Filter */}
          <select
            value={values.leaveType ?? ""}
            onChange={(e) => setValues({ leaveType: (e.target.value as LeaveTypeEnum) || undefined })}
            aria-label="Filter by leave type"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="">All Types</option>
            <option value={LeaveTypeEnum.CASUAL}>Casual</option>
            <option value={LeaveTypeEnum.SICK}>Sick</option>
            <option value={LeaveTypeEnum.MATERNITY}>Maternity</option>
            <option value={LeaveTypeEnum.BEREAVEMENT}>Bereavement</option>
            <option value={LeaveTypeEnum.OFFICIAL}>Official Duty</option>
            <option value={LeaveTypeEnum.UNPAID}>Unpaid</option>
          </select>

          {/* Teacher Filter */}
          <select
            value={values.teacherId ? String(values.teacherId) : ""}
            onChange={(e) =>
              setValues({ teacherId: e.target.value ? Number(e.target.value) : undefined })
            }
            aria-label="Filter by teacher"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name} {t.teacherCode ? `[${t.teacherCode}]` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Leave Button */}
        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="bg-[#45AC5E] hover:bg-[#3d9853] text-white font-medium text-xs h-9 px-4 shadow-sm shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Apply Leave
          </Button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700 py-3.5 w-12">#</TableHead>
              <TableHead className="font-semibold text-slate-700 min-w-[180px]">
                Teacher Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 w-32">Leave Type</TableHead>
              <TableHead className="font-semibold text-slate-700 min-w-[180px]">
                Date Range
              </TableHead>
              <TableHead className="font-semibold text-slate-700 w-24">Days</TableHead>
              <TableHead className="font-semibold text-slate-700 min-w-[200px]">Reason</TableHead>
              <TableHead className="font-semibold text-slate-700 w-28">Status</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 min-w-[120px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#45AC5E]" />
                  <p className="mt-2 text-xs text-slate-500 font-medium">Loading leave requests...</p>
                </TableCell>
              </TableRow>
            ) : accumulatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-slate-500">
                  <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No leave requests found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting search query or status filter.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              accumulatedData.map((leave, idx) => (
                <TableRow key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-xs">
                        {leave.teacherName || `Teacher #${leave.teacherId}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {leave.teacherCode || `ID:${leave.teacherId}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <LeaveTypeBadge type={leave.leaveType} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                    {leave.startDate} → {leave.endDate}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {leave.totalDays}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600 line-clamp-1" title={leave.reason}>
                      {leave.reason}
                    </p>
                    {leave.rejectionReason && (
                      <p className="text-[10px] text-rose-600 italic">
                        Rejection: {leave.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <LeaveStatusBadge status={leave.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Review / Decision button if pending */}
                      {canReview && leave.status === LeaveStatusEnum.PENDING && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenReview(leave)}
                          className="h-7 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Review
                        </Button>
                      )}

                      {/* Edit button if pending */}
                      {canManage && leave.status === LeaveStatusEnum.PENDING && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(leave)}
                          title="Edit Request"
                          className="h-7 w-7 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Delete button */}
                      {canManage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(leave.id)}
                          title="Delete Request"
                          className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-3 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#45AC5E]" />
        ) : !hasNextPage && accumulatedData.length > 0 ? (
          `All ${accumulatedData.length} records loaded`
        ) : null}
      </div>

      {/* Modals */}
      <LeaveRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        leaveRequest={selectedLeaveForEdit}
      />

      <ReviewLeaveDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        leaveRequest={selectedLeaveForReview}
      />
    </div>
  );
};
