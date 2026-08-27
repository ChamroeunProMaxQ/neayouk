import { Badge } from "@/components/ui/badge";
import { PayrollStatusEnum } from "@repo/contracts";

interface PayrollStatusBadgeProps {
  status: string;
}

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  switch (status) {
    case PayrollStatusEnum.PAID:
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
        >
          Paid
        </Badge>
      );
    case PayrollStatusEnum.DRAFT:
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
        >
          Draft
        </Badge>
      );
    case PayrollStatusEnum.CANCELLED:
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
        >
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-muted bg-muted/20">
          {status}
        </Badge>
      );
  }
}
