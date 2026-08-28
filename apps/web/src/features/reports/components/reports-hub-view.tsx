import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  GraduationCap,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';

import { useReportOverviewQuery } from '../hooks/use-report-overview';

export const ReportsHubView: FC = () => {
  const { data, isLoading } = useReportOverviewQuery();
  const overview = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Reports & Analytics Hub</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Executive reporting center providing institutional intelligence across Financials, Academics, and Attendance.
        </p>
      </div>

      {/* 3 Domain Hub Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Financial Reports Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#EBF6EE] rounded-xl text-[#45AC5E]">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Financials
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-800">Financial Reports & Cash Flow</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Tuition fee collections, outstanding receivables, operating expenses, and net profit margins.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl mb-5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Total Revenue</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `$${(overview?.financial?.totalRevenue ?? 0).toLocaleString()}`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Operating Outflows</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `$${(overview?.financial?.totalExpenses ?? 0).toLocaleString()}`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Net Balance</span>
                <div className="font-bold text-emerald-600 text-sm mt-0.5">
                  {isLoading ? '...' : `$${(overview?.financial?.netMargin ?? 0).toLocaleString()}`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Collection Rate</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.financial?.collectionRate ?? 0}%`}
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/reports/financial"
            className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-[#EBF6EE] hover:text-[#45AC5E] text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <span>Open Financial Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. Academic Reports Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Academics
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-800">Academic Reports & Grading</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Grade distributions, multi-subject proficiency radars, class benchmarks, and honor rolls.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl mb-5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Students Evaluated</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : (overview?.academic?.totalStudents ?? 0)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Mean Score</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.academic?.averageScore ?? 0}%`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Passing Rate</span>
                <div className="font-bold text-emerald-600 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.academic?.passRate ?? 0}%`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Honor Roll Achievers</span>
                <div className="font-bold text-amber-600 text-sm mt-0.5">
                  {isLoading ? '...' : (overview?.academic?.honorRollCount ?? 0)}
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/reports/academic"
            className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <span>Open Academic Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3. Attendance Reports Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attendance
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-800">Attendance Analytics & Truancy</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Daily check-in dynamics, teacher punctuality rates, weekday absence patterns, and at-risk alerts.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl mb-5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Student Rate</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.attendance?.studentRate ?? 0}%`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Faculty Rate</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.attendance?.teacherRate ?? 0}%`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Truancy Watchlist</span>
                <div className="font-bold text-rose-600 text-sm mt-0.5">
                  {isLoading ? '...' : `${overview?.attendance?.chronicAbsentCount ?? 0} students`}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Target Benchmark</span>
                <div className="font-bold text-[#45AC5E] text-sm mt-0.5">90% Target</div>
              </div>
            </div>
          </div>

          <Link
            to="/reports/attendance"
            className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-600 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <span>Open Attendance Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
