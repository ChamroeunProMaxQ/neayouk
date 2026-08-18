import { useState, type FC } from "react";
import {
  LeaveStatusEnum,
  type LeaveRequestAttribute,
} from "@repo/contracts";
import { useReviewLeaveRequestMutation } from "../hooks/use-leave-requests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { LeaveTypeBadge } from "./attendance-status-badge";

interface ReviewLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequestAttribute | null;
}

export const ReviewLeaveDialog: FC<ReviewLeaveDialogProps> = ({
  open,
  onOpenChange,
  leaveRequest,
}) => {
  const reviewMutation = useReviewLeaveRequestMutation();
  const [rejectionReason, setRejectionReason] = useState("");
  const [syncAttendance, setSyncAttendance] = useState(true);
  const [decision, setDecision] = useState<LeaveStatusEnum.APPROVED | LeaveStatusEnum.REJECTED>(
    LeaveStatusEnum.APPROVED
  );

  if (!leaveRequest) return null;

  const handleReview = async () => {
    try {
      await reviewMutation.mutateAsync({
        id: leaveRequest.id,
        payload: {
          status: decision,
          rejectionReason: decision === LeaveStatusEnum.REJECTED ? rejectionReason : undefined,
          syncAttendance: decision === LeaveStatusEnum.APPROVED ? syncAttendance : false,
        },
      });
      onOpenChange(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to review leave request:", err);
    }
  };

  const teacherName =
    leaveRequest.teacherName || (leaveRequest as any).teacher?.name || `Teacher #${leaveRequest.teacherId}`;
  const specialization = (leaveRequest as any).teacher?.specialization || "Instructor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-800">
            Review Leave Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Summary Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {teacherName}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {specialization}
                </span>
              </div>
              <LeaveTypeBadge type={leaveRequest.leaveType} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Date Range
                </span>
                <span className="font-medium text-slate-800">
                  {leaveRequest.startDate} → {leaveRequest.endDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Duration
                </span>
                <span className="font-medium text-slate-800">{leaveRequest.totalDays} day(s)</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Reason
              </span>
              <p className="text-slate-700 italic mt-0.5">{leaveRequest.reason}</p>
            </div>
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Approval Decision</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision(LeaveStatusEnum.APPROVED)}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-semibold transition-all ${
                  decision === LeaveStatusEnum.APPROVED
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Approve Leave
              </button>

              <button
                type="button"
                onClick={() => setDecision(LeaveStatusEnum.REJECTED)}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-semibold transition-all ${
                  decision === LeaveStatusEnum.REJECTED
                    ? "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                Reject Request
              </button>
            </div>
          </div>

          {/* If Approved: Auto-Sync Option */}
          {decision === LeaveStatusEnum.APPROVED && (
            <div className="flex items-center gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
              <Checkbox
                id="syncAtt"
                checked={syncAttendance}
                onCheckedChange={(c) => setSyncAttendance(Boolean(c))}
              />
              <Label htmlFor="syncAtt" className="text-slate-700 cursor-pointer font-medium">
                Auto-create <span className="font-bold text-emerald-800">ON_LEAVE</span> attendance
                records for {leaveRequest.startDate} to {leaveRequest.endDate}
              </Label>
            </div>
          )}

          {/* If Rejected: Rejection Reason */}
          {decision === LeaveStatusEnum.REJECTED && (
            <div className="space-y-1.5">
              <Label htmlFor="rejectionReason" className="font-semibold text-slate-700">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectionReason"
                rows={2}
                placeholder="Explain why this request cannot be approved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={reviewMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleReview}
            disabled={
              reviewMutation.isPending ||
              (decision === LeaveStatusEnum.REJECTED && !rejectionReason.trim())
            }
            className={`text-xs font-semibold ${
              decision === LeaveStatusEnum.APPROVED
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {reviewMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Confirm {decision === LeaveStatusEnum.APPROVED ? "Approval" : "Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
