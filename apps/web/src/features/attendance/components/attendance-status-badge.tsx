import type { FC } from "react";
import { AttendanceStatusEnum, LeaveStatusEnum, LeaveTypeEnum } from "@repo/contracts";
import { Badge } from "@/components/ui/badge";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatusEnum | string;
  className?: string;
  size?: "sm" | "default";
}

export const AttendanceStatusBadge: FC<AttendanceStatusBadgeProps> = ({
  status,
  className = "",
  size = "default",
}) => {
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";

  switch (status) {
    case AttendanceStatusEnum.PRESENT:
      return (
        <Badge
          variant="outline"
          className={`border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold ${sizeClass} ${className}`}
        >
          Present
        </Badge>
      );
    case AttendanceStatusEnum.ABSENT:
      return (
        <Badge
          variant="outline"
          className={`border-rose-200 bg-rose-50 text-rose-700 font-semibold ${sizeClass} ${className}`}
        >
          Absent
        </Badge>
      );
    case AttendanceStatusEnum.LATE:
      return (
        <Badge
          variant="outline"
          className={`border-amber-200 bg-amber-50 text-amber-700 font-semibold ${sizeClass} ${className}`}
        >
          Late
        </Badge>
      );
    case AttendanceStatusEnum.EXCUSED:
      return (
        <Badge
          variant="outline"
          className={`border-blue-200 bg-blue-50 text-blue-700 font-semibold ${sizeClass} ${className}`}
        >
          Excused
        </Badge>
      );
    case AttendanceStatusEnum.HALF_DAY:
      return (
        <Badge
          variant="outline"
          className={`border-purple-200 bg-purple-50 text-purple-700 font-semibold ${sizeClass} ${className}`}
        >
          Half Day
        </Badge>
      );
    case AttendanceStatusEnum.ON_LEAVE:
      return (
        <Badge
          variant="outline"
          className={`border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold ${sizeClass} ${className}`}
        >
          On Leave
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`text-slate-600 ${sizeClass} ${className}`}>
          {status}
        </Badge>
      );
  }
};

export const LeaveStatusBadge: FC<{ status: LeaveStatusEnum | string; className?: string }> = ({
  status,
  className = "",
}) => {
  switch (status) {
    case LeaveStatusEnum.APPROVED:
      return (
        <Badge
          variant="outline"
          className={`border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 ${className}`}
        >
          Approved
        </Badge>
      );
    case LeaveStatusEnum.REJECTED:
      return (
        <Badge
          variant="outline"
          className={`border-rose-200 bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 ${className}`}
        >
          Rejected
        </Badge>
      );
    case LeaveStatusEnum.CANCELLED:
      return (
        <Badge
          variant="outline"
          className={`border-slate-200 bg-slate-50 text-slate-600 font-semibold px-2.5 py-1 ${className}`}
        >
          Cancelled
        </Badge>
      );
    case LeaveStatusEnum.PENDING:
    default:
      return (
        <Badge
          variant="outline"
          className={`border-amber-200 bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 ${className}`}
        >
          Pending
        </Badge>
      );
  }
};

export const LeaveTypeBadge: FC<{ type: LeaveTypeEnum | string; className?: string }> = ({
  type,
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 ${className}`}
    >
      {type}
    </span>
  );
};
