import { useEffect, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateLeaveRequestSchema,
  type CreateLeaveRequestDto,
  type LeaveRequestAttribute,
  LeaveTypeEnum,
} from "@repo/contracts";
import { useTeachersQuery } from "@/features/teachers/hooks/use-teachers-query";
import {
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
} from "../hooks/use-leave-requests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface LeaveRequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest?: LeaveRequestAttribute | null;
}

export const LeaveRequestFormDialog: FC<LeaveRequestFormDialogProps> = ({
  open,
  onOpenChange,
  leaveRequest,
}) => {
  const isEdit = Boolean(leaveRequest);
  const { data: teachers = [] } = useTeachersQuery({ status: "ACTIVE" });

  const createMutation = useCreateLeaveRequestMutation();
  const updateMutation = useUpdateLeaveRequestMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLeaveRequestDto>({
    resolver: zodResolver(CreateLeaveRequestSchema),
    defaultValues: {
      teacherId: teachers[0]?.id || 1,
      leaveType: LeaveTypeEnum.CASUAL,
      startDate: today,
      endDate: today,
      totalDays: 1,
      reason: "",
      attachmentUrl: "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // Auto-calculate total days when dates change
  useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setValue("totalDays", diffDays);
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (leaveRequest) {
      reset({
        teacherId: leaveRequest.teacherId,
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        totalDays: Number(leaveRequest.totalDays),
        reason: leaveRequest.reason,
        attachmentUrl: leaveRequest.attachmentUrl || "",
      });
    } else {
      reset({
        teacherId: teachers[0]?.id || 1,
        leaveType: LeaveTypeEnum.CASUAL,
        startDate: today,
        endDate: today,
        totalDays: 1,
        reason: "",
        attachmentUrl: "",
      });
    }
  }, [leaveRequest, open, reset, teachers, today]);

  const onSubmit = async (data: CreateLeaveRequestDto) => {
    try {
      if (isEdit && leaveRequest) {
        await updateMutation.mutateAsync({
          id: leaveRequest.id,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to submit leave request:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            {isEdit ? "Edit Leave Request" : "Submit Leave Application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Teacher Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="teacherId" className="text-xs font-semibold text-slate-700">
              Instructor / Teacher *
            </Label>
            <select
              id="teacherId"
              {...register("teacherId", { valueAsNumber: true })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.teacherCode || `ID:${t.id}`})
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <p className="text-xs text-rose-500">{errors.teacherId.message}</p>
            )}
          </div>

          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label htmlFor="leaveType" className="text-xs font-semibold text-slate-700">
              Leave Category *
            </Label>
            <select
              id="leaveType"
              {...register("leaveType")}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
            >
              <option value={LeaveTypeEnum.CASUAL}>Casual Leave</option>
              <option value={LeaveTypeEnum.SICK}>Sick / Medical Leave</option>
              <option value={LeaveTypeEnum.MATERNITY}>Maternity / Paternity</option>
              <option value={LeaveTypeEnum.BEREAVEMENT}>Bereavement</option>
              <option value={LeaveTypeEnum.OFFICIAL}>Official Duty / Training</option>
              <option value={LeaveTypeEnum.UNPAID}>Unpaid Leave</option>
              <option value={LeaveTypeEnum.OTHER}>Other</option>
            </select>
            {errors.leaveType && (
              <p className="text-xs text-rose-500">{errors.leaveType.message}</p>
            )}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold text-slate-700">
                Start Date *
              </Label>
              <Input type="date" id="startDate" {...register("startDate")} className="text-xs" />
              {errors.startDate && (
                <p className="text-xs text-rose-500">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold text-slate-700">
                End Date *
              </Label>
              <Input type="date" id="endDate" {...register("endDate")} className="text-xs" />
              {errors.endDate && (
                <p className="text-xs text-rose-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Total Days */}
          <div className="space-y-1.5">
            <Label htmlFor="totalDays" className="text-xs font-semibold text-slate-700">
              Duration (Days) *
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              id="totalDays"
              {...register("totalDays", { valueAsNumber: true })}
              className="text-xs"
            />
            {errors.totalDays && (
              <p className="text-xs text-rose-500">{errors.totalDays.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
              Reason / Justification *
            </Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Provide context for absence or medical appointment..."
              {...register("reason")}
              className="text-xs"
            />
            {errors.reason && (
              <p className="text-xs text-rose-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Supporting Document / Attachment URL */}
          <div className="space-y-1.5">
            <Label htmlFor="attachmentUrl" className="text-xs font-semibold text-slate-700">
              Attachment Link / Document URL (Optional)
            </Label>
            <Input
              type="url"
              id="attachmentUrl"
              placeholder="https://..."
              {...register("attachmentUrl")}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold bg-[#45AC5E] hover:bg-[#3d9853] text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              {isEdit ? "Update Request" : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
