import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star } from "lucide-react";
import type { ClassAttribute, StudentClassEnrollmentAttribute } from "@repo/contracts";

interface ClassBadgeListProps {
  enrollments?: StudentClassEnrollmentAttribute[];
  classes?: ClassAttribute[];
  primaryClass?: ClassAttribute | null;
  className?: string;
  maxDisplay?: number;
}

export const ClassBadgeList: FC<ClassBadgeListProps> = ({
  enrollments,
  classes,
  primaryClass,
  className = "",
  maxDisplay = 2,
}) => {
  const activeEnrollments = enrollments ? enrollments.filter((e) => e.status === "ENROLLED") : [];

  let items: { id: number; name: string; isPrimary: boolean }[] = [];

  if (activeEnrollments.length > 0) {
    items = activeEnrollments.map((e) => ({
      id: e.classId,
      name: e.class?.name || `Class #${e.classId}`,
      isPrimary: Boolean(e.isPrimary),
    }));
  } else if (classes && classes.length > 0) {
    items = classes.map((c, idx) => ({
      id: c.id,
      name: c.name,
      isPrimary: primaryClass ? primaryClass.id === c.id : idx === 0,
    }));
  } else if (primaryClass) {
    items = [{ id: primaryClass.id, name: primaryClass.name, isPrimary: true }];
  }

  if (items.length === 0) {
    return <span className="text-xs text-slate-400 italic">No class assigned</span>;
  }

  const displayedItems = items.slice(0, maxDisplay);
  const remainingCount = items.length - maxDisplay;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {displayedItems.map((item) => (
        <Badge
          key={item.id}
          variant="outline"
          className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors ${
            item.isPrimary
              ? "bg-[#EBF6EE] text-[#389350] border-[#45AC5E]/30 font-semibold"
              : "bg-slate-50 text-slate-700 border-slate-200"
          }`}
        >
          {item.isPrimary ? (
            <Star className="w-3 h-3 mr-1 text-[#45AC5E] fill-[#45AC5E]/20" />
          ) : (
            <BookOpen className="w-3 h-3 mr-1 text-slate-400" />
          )}
          {item.name}
        </Badge>
      ))}

      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 font-semibold"
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};
