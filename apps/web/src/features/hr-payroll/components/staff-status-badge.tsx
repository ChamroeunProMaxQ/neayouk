import { Badge } from "@/components/ui/badge";
import { StaffStatusEnum } from "@repo/contracts";

interface StaffStatusBadgeProps {
  status: string;
}

export function StaffStatusBadge({ status }: StaffStatusBadgeProps) {
  switch (status) {
    case StaffStatusEnum.ACTIVE:
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          Active
        </Badge>
      );
    case StaffStatusEnum.ON_LEAVE:
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          On Leave
        </Badge>
      );
    case StaffStatusEnum.INACTIVE:
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted/50 text-muted-foreground"
        >
          Inactive
        </Badge>
      );
    case StaffStatusEnum.TERMINATED:
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        >
          Terminated
        </Badge>
      );
    case StaffStatusEnum.ARCHIVED:
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted/50 text-muted-foreground"
        >
          Archived
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
