import { type FC } from "react";
import type { ClassGradeStatsDto } from "@repo/contracts";
import {
  Award,
  TrendingUp,
  CheckCircle2,
  BarChart2,
} from "lucide-react";

interface GradeAnalyticsCardsProps {
  stats?: ClassGradeStatsDto;
  className?: string;
}

export const GradeAnalyticsCards: FC<GradeAnalyticsCardsProps> = ({
  stats,
  className = "",
}) => {
  if (!stats || stats.totalStudents === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const gradeColors: Record<string, string> = {
    A: "bg-emerald-500 text-white",
    B: "bg-blue-500 text-white",
    C: "bg-indigo-500 text-white",
    D: "bg-amber-500 text-white",
    E: "bg-orange-500 text-white",
    F: "bg-rose-500 text-white",
  };

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Average Score */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Class Average
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.averageScore.toFixed(1)}%
            </span>
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${getScoreColor(
                stats.averageScore
              )}`}
            >
              Avg
            </span>
          </div>
        </div>
      </div>

      {/* Pass Rate */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Passing Rate
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.passRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              ({stats.passCount}/{stats.totalStudents} passed)
            </span>
          </div>
        </div>
      </div>

      {/* High / Low Range */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Highest / Lowest
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600">
              {stats.highestScore.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xl font-bold text-rose-500">
              {stats.lowestScore.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grade Distribution mini chart */}
      <div className="flex flex-col justify-center rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Grade Distribution
          </p>
          <BarChart2 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {["A", "B", "C", "D", "E", "F"].map((letter) => {
            const count = stats.gradeDistribution?.[letter] || 0;
            return (
              <div
                key={letter}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${letter}: ${count} students`}
              >
                <div
                  className={`flex h-6 w-full items-center justify-center rounded text-xs font-bold ${
                    count > 0
                      ? gradeColors[letter]
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {count}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {letter}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
