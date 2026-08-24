import { type FC } from "react";
import { useClassesQuery } from "@/features/classes/hooks/use-classes-infinite-query";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar as CalendarIcon,
} from "lucide-react";

interface ExaminationFilterBarProps {
  selectedClassId?: number;
  onSelectClassId: (id: number) => void;
  selectedYear: number;
  selectedMonth: number;
  onSelectMonth: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const ExaminationFilterBar: FC<ExaminationFilterBarProps> = ({
  selectedClassId,
  onSelectClassId,
  selectedYear,
  selectedMonth,
  onSelectMonth,
}) => {
  const { data: classesData, isLoading: isLoadingClasses } = useClassesQuery({
    pageSize: 100,
    status: "ACTIVE",
  });
  const classesList = classesData?.data ?? [];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onSelectMonth(selectedYear - 1, 12);
    } else {
      onSelectMonth(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onSelectMonth(selectedYear + 1, 1);
    } else {
      onSelectMonth(selectedYear, selectedMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    onSelectMonth(now.getFullYear(), now.getMonth() + 1);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      {/* Class Selector */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#45AC5E]/10 text-[#45AC5E]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select Class
          </label>
          <select
            value={selectedClassId ?? ""}
            onChange={(e) => onSelectClassId(Number(e.target.value))}
            disabled={isLoadingClasses}
            className="h-9 min-w-[200px] rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium text-slate-800 transition-colors focus:border-[#45AC5E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20"
          >
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-1">
            <CalendarIcon className="h-4 w-4 text-[#45AC5E]" />
            <span className="text-sm font-semibold text-slate-800">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentMonth}
          className="h-10 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          This Month
        </Button>
      </div>
    </div>
  );
};
