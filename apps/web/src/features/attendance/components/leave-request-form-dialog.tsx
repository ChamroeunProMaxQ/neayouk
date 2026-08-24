import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateLeaveRequestSchema,
  UpdateLeaveRequestSchema,
  type CreateLeaveRequestDto,
  type UpdateLeaveRequestDto,
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
import { Loader2, AlertCircle } from "lucide-react";

interface LeaveRequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest?: LeaveRequestAttribute | null;
}

export function LeaveRequestFormDialog({
  open,
  onOpenChange,
  leaveRequest,
}: LeaveRequestFormDialogProps) {
  const isEdit = !!leaveRequest;
  const createMutation = useCreateLeaveRequestMutation();
  const updateMutation = useUpdateLeaveRequestMutation();

  const { data: teachersData } = useTeachersQuery({ status: "ACTIVE" });
  const teachers = Array.isArray(teachersData) ? teachersData : [];

  const today = new Date().toISOString().slice(0, 10);
  const activeSchema = isEdit ? UpdateLeaveRequestSchema : CreateLeaveRequestSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeaveRequestDto>({
    resolver: zodResolver<CreateLeaveRequestDto>(activeSchema),
    mode: "onChange",
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
      setValue("totalDays", diffDays, { shouldValidate: true });
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (open) {
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
    }
  }, [leaveRequest, open, reset, today]);

  const onSubmit = async (data: CreateLeaveRequestDto) => {
    try {
      const payload = {
        ...data,
        attachmentUrl: data.attachmentUrl ? data.attachmentUrl.trim() : null,
      };

      if (isEdit && leaveRequest) {
        await updateMutation.mutateAsync({
          id: leaveRequest.id,
          payload: payload as UpdateLeaveRequestDto,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save leave request:", err);
    }
  };

  const errorMessage =
    createMutation.error?.message || updateMutation.error?.message;

  const validationErrorsList = Object.entries(errors)
    .map(([_, err]) => (err as any)?.message)
    .filter(Boolean);

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            {isEdit ? "Edit Leave Request" : "Submit Leave Application"}
          </DialogTitle>
        </DialogHeader>

        {/* API Server Error Banner */}
        {errorMessage && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Zod Validation Errors Summary Banner */}
        {validationErrorsList.length > 0 && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Please resolve the following form errors:</span>
            </div>
            <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5 text-rose-600">
              {validationErrorsList.map((msg, i) => (
                <li key={i}>{String(msg)}</li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, (invalid) => {
            console.warn("LeaveRequestFormDialog validation failed:", invalid);
          })}
          className="space-y-4 py-2"
        >
          {/* Teacher Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="teacherId" className="text-xs font-semibold text-slate-700">
              Instructor / Teacher <span className="text-rose-500">*</span>
            </Label>
            <select
              id="teacherId"
              {...register("teacherId", { valueAsNumber: true })}
              className={`h-9 w-full rounded-md border bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 ${
                errors.teacherId
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 focus:ring-[#45AC5E]"
              }`}
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
              Leave Category <span className="text-rose-500">*</span>
            </Label>
            <select
              id="leaveType"
              {...register("leaveType")}
              className={`h-9 w-full rounded-md border bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 ${
                errors.leaveType
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 focus:ring-[#45AC5E]"
              }`}
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
                Start Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                id="startDate"
                {...register("startDate")}
                className={`text-xs ${errors.startDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
              />
              {errors.startDate && (
                <p className="text-xs text-rose-500">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold text-slate-700">
                End Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                id="endDate"
                {...register("endDate")}
                className={`text-xs ${errors.endDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
              />
              {errors.endDate && (
                <p className="text-xs text-rose-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Total Days */}
          <div className="space-y-1.5">
            <Label htmlFor="totalDays" className="text-xs font-semibold text-slate-700">
              Duration (Days) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              id="totalDays"
              {...register("totalDays", { valueAsNumber: true })}
              className={`text-xs ${errors.totalDays ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
            />
            {errors.totalDays && (
              <p className="text-xs text-rose-500">{errors.totalDays.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
              Reason / Justification <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Provide context for absence or medical appointment..."
              {...register("reason")}
              className={`text-xs ${errors.reason ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
            />
            {errors.reason && (
              <p className="text-xs text-rose-500 font-medium">{errors.reason.message}</p>
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
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs font-semibold bg-[#45AC5E] hover:bg-[#3d9853] text-white"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              {isEdit ? "Update Request" : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


