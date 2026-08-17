import { Badge } from "@/components/ui/badge";

interface TeacherStatusBadgeProps {
  status: string;
  className?: string;
}

export function TeacherStatusBadge({ status, className }: TeacherStatusBadgeProps) {
  const normalizedStatus = (status || "ACTIVE").toUpperCase();

  switch (normalizedStatus) {
    case "ACTIVE":
      return (
        <Badge
          variant="outline"
          className={`border-emerald-200 bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-50 ${className ?? ""}`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </Badge>
      );
    case "ON_LEAVE":
      return (
        <Badge
          variant="outline"
          className={`border-amber-200 bg-amber-50 font-medium text-amber-700 hover:bg-amber-50 ${className ?? ""}`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
          On Leave
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge
          variant="outline"
          className={`border-slate-200 bg-slate-100 font-medium text-slate-600 hover:bg-slate-100 ${className ?? ""}`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
          Inactive
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge
          variant="outline"
          className={`border-rose-200 bg-rose-50 font-medium text-rose-700 hover:bg-rose-50 ${className ?? ""}`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
