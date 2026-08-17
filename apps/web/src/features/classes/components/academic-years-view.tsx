import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAcademicYearsSummaryQuery } from "../hooks/use-classes-infinite-query";
import {
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AcademicSession {
  year: string;
  isCurrent: boolean;
  status: "ACTIVE" | "UPCOMING" | "ARCHIVED";
  startDate: string;
  endDate: string;
  terms: {
    name: string;
    code: string;
    status: "ACTIVE" | "UPCOMING" | "COMPLETED";
    startDate: string;
    endDate: string;
    weeks: number;
  }[];
}

const SESSIONS: AcademicSession[] = [
  {
    year: "2025-2026",
    isCurrent: true,
    status: "ACTIVE",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
    terms: [
      {
        name: "Semester 1",
        code: "SEMESTER_1",
        status: "ACTIVE",
        startDate: "01-Sep-2025",
        endDate: "15-Jan-2026",
        weeks: 19,
      },
      {
        name: "Semester 2",
        code: "SEMESTER_2",
        status: "UPCOMING",
        startDate: "01-Feb-2026",
        endDate: "30-Jun-2026",
        weeks: 20,
      },
      {
        name: "Summer Term",
        code: "SUMMER",
        status: "UPCOMING",
        startDate: "05-Jul-2026",
        endDate: "20-Aug-2026",
        weeks: 7,
      },
    ],
  },
  {
    year: "2026-2027",
    isCurrent: false,
    status: "UPCOMING",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
    terms: [
      {
        name: "Semester 1",
        code: "SEMESTER_1",
        status: "UPCOMING",
        startDate: "01-Sep-2026",
        endDate: "15-Jan-2027",
        weeks: 19,
      },
      {
        name: "Semester 2",
        code: "SEMESTER_2",
        status: "UPCOMING",
        startDate: "01-Feb-2027",
        endDate: "30-Jun-2027",
        weeks: 20,
      },
    ],
  },
];

export function AcademicYearsView() {
  const navigate = useNavigate();
  const { data: summaryResponse, isLoading } = useAcademicYearsSummaryQuery();
  const summaryList = summaryResponse?.data ?? [];

  const [selectedYear, setSelectedYear] = useState<string>("2025-2026");

  const currentSession = SESSIONS.find((s) => s.year === selectedYear) ?? SESSIONS[0];

  // Fast aggregated statistics from server
  const yearStats = summaryList.filter((s) => s.academicYear === selectedYear);
  const activeClassesInYear = yearStats.reduce((acc, curr) => acc + curr.classCount, 0);
  const enrolledStudentsInYear = yearStats.reduce((acc, curr) => acc + curr.studentCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-[#45AC5E]" />
            Academic Years & Terms
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure school calendar sessions, semester timelines, and term progression.
          </p>
        </div>

        <Button
          onClick={() => navigate("/academics/classes")}
          className="bg-[#45AC5E] hover:bg-[#3d9853] text-white gap-2 font-semibold shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          View All Classes
        </Button>
      </div>

      {/* Academic Year Selector Pills */}
      <div className="flex flex-wrap items-center gap-3">
        {SESSIONS.map((session) => {
          const isSelected = session.year === selectedYear;
          return (
            <button
              key={session.year}
              onClick={() => setSelectedYear(session.year)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Academic Year {session.year}</span>
              {session.isCurrent && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#45AC5E] text-white font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Session Details Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Session {currentSession.year} Overview
              </h2>
              <Badge className="bg-emerald-50 text-[#45AC5E] hover:bg-emerald-50 text-xs">
                {currentSession.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Full Term Duration: <strong>{currentSession.startDate}</strong> &rarr;{" "}
                <strong>{currentSession.endDate}</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Total Terms</p>
              <p className="text-base font-bold text-slate-800">{currentSession.terms.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Active Classes</p>
              <p className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" /> : activeClassesInYear}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Enrolled Students</p>
              <p className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" /> : enrolledStudentsInYear}
              </p>
            </div>
          </div>
        </div>

        {/* Term Cards Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Scheduled Terms & Semesters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentSession.terms.map((term) => {
              const termStat = yearStats.find((s) => s.semester === term.code);
              const termClassesCount = termStat?.classCount ?? 0;
              const termStudentsCount = termStat?.studentCount ?? 0;

              return (
                <div
                  key={term.code}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{term.name}</h4>
                    <Badge
                      className={`text-[10px] ${
                        term.status === "ACTIVE"
                          ? "bg-[#45AC5E] text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {term.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-400">Date Range</span>
                      <span className="font-semibold text-slate-800">
                        {term.startDate} - {term.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-400">Instruction Weeks</span>
                      <span className="font-semibold text-slate-800">{term.weeks} Weeks</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-400">Classes Running</span>
                      <span className="font-bold text-[#45AC5E]">{termClassesCount} Classes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Students Enrolled</span>
                      <span className="font-medium text-slate-700">{termStudentsCount} Students</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/academics/classes?academicYear=${currentSession.year}&semester=${term.code}`
                      )
                    }
                    className="w-full text-xs font-semibold h-8 gap-1 mt-2 text-slate-700 hover:text-[#45AC5E]"
                  >
                    <span>View Term Classes</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Calendar Guidelines / Milestone Info */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#45AC5E]" />
            Session Guidelines & Semester Progression
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            During semester transitions, students can be batch-promoted or transferred to the next term via the <strong>Student Management</strong> promotion engine. All attendance records and historical class enrollment logs remain archived and queryable per academic year session.
          </p>
        </div>
      </div>
    </div>
  );
}
