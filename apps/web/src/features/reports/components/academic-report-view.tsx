import { useState, type FC } from 'react';
import {
  GraduationCap,
  Award,
  AlertTriangle,
  Download,
  Printer,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { API_ROUTE } from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';
import { useAcademicReportQuery } from '../hooks/use-academic-report';
import { ReportKpiCard } from './report-kpi-card';
import { GradeDistributionBarChart } from './charts/grade-distribution-bar-chart';
import { SubjectPerformanceRadarChart } from './charts/subject-performance-radar-chart';
import { ClassPerformanceChart } from './charts/class-performance-chart';

export const AcademicReportView: FC = () => {
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [semester, setSemester] = useState<string>('SEMESTER_1');
  const [month, setMonth] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'topPerformers' | 'atRisk'>('benchmarks');

  const queryParams = {
    academicYear: academicYear || undefined,
    semester: semester || undefined,
    month: month || undefined,
  };

  const { data, isLoading } = useAcademicReportQuery(queryParams);
  const summary = data?.data;

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.get<string>(API_ROUTE.REPORT.ACADEMIC_EXPORT, {
        params: queryParams,
        responseType: 'text',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `academic-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Academic Performance Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate cohort academic mastery, grade distributions, subject benchmarks, and student achievements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Academic Year Selector */}
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 shadow-xs focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="2025-2026">2025 - 2026</option>
            <option value="2024-2025">2024 - 2025</option>
          </select>

          {/* Semester Selector */}
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 shadow-xs focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="SEMESTER_1">Semester 1</option>
            <option value="SEMESTER_2">Semester 2</option>
          </select>

          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 shadow-xs focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="">All Months</option>
            <option value="2026-01">January 2026</option>
            <option value="2026-02">February 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-05">May 2026</option>
          </select>

          {/* Export Actions */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ReportKpiCard
          title="Students Assessed"
          value={isLoading ? '...' : (summary?.totalStudentsAssessed ?? 0)}
          subtitle="Cohort test evaluations"
          icon={<GraduationCap className="w-4 h-4" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        <ReportKpiCard
          title="Average Score"
          value={isLoading ? '...' : `${summary?.overallAverageScore ?? 0}%`}
          subtitle="Mean institutional grade"
          icon={<BookOpen className="w-4 h-4" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />

        <ReportKpiCard
          title="Pass Rate"
          value={isLoading ? '...' : `${summary?.passRate ?? 0}%`}
          subtitle="Score >= 50% threshold"
          icon={<Award className="w-4 h-4" />}
          iconBgColor="bg-[#EBF6EE]"
          iconColor="text-[#45AC5E]"
        />

        <ReportKpiCard
          title="Honor Roll (A/B)"
          value={isLoading ? '...' : (summary?.honorRollCount ?? 0)}
          subtitle={`${summary?.honorRollPercentage ?? 0}% of student body`}
          icon={<Trophy className="w-4 h-4" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <ReportKpiCard
          title="At-Risk Students"
          value={isLoading ? '...' : (summary?.atRiskCount ?? 0)}
          subtitle={`${summary?.atRiskPercentage ?? 0}% needing intervention`}
          icon={<AlertTriangle className="w-4 h-4" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Grade Letter Distribution</h2>
              <p className="text-xs text-slate-400">Student count across Grade A through F</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <GradeDistributionBarChart data={summary?.gradeDistribution ?? []} height={280} />
        </div>

        {/* Subject Mastery Radar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Subject Proficiency</h2>
              <p className="text-xs text-slate-400">Average score % across core subjects</p>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <SubjectPerformanceRadarChart data={summary?.subjectMastery ?? []} height={280} />
        </div>

        {/* Class Benchmarks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Class Benchmarks</h2>
              <p className="text-xs text-slate-400">Average score & pass rate comparison</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <ClassPerformanceChart data={summary?.classBenchmarks ?? []} height={280} />
        </div>
      </div>

      {/* Tabular Lists & Watchlists */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 px-5 pt-4 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`pb-3 transition-colors ${
              activeTab === 'benchmarks'
                ? 'text-[#45AC5E] border-b-2 border-[#45AC5E]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Class Academic Summary ({summary?.classBenchmarks?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('topPerformers')}
            className={`pb-3 transition-colors ${
              activeTab === 'topPerformers'
                ? 'text-[#45AC5E] border-b-2 border-[#45AC5E]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Honor Roll Leaders ({summary?.topPerformers?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('atRisk')}
            className={`pb-3 transition-colors ${
              activeTab === 'atRisk'
                ? 'text-[#45AC5E] border-b-2 border-[#45AC5E]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            At-Risk Intervention Watchlist ({summary?.atRiskStudents?.length ?? 0})
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          {activeTab === 'benchmarks' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Class Name</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">Enrolled</th>
                  <th className="p-3">Average Score</th>
                  <th className="p-3">Pass Rate</th>
                  <th className="p-3">Highest Score</th>
                  <th className="p-3">Lowest Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.classBenchmarks ?? []).map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{cls.className}</td>
                    <td className="p-3">Grade {cls.gradeLevel ?? '-'}</td>
                    <td className="p-3">{cls.totalStudents} students</td>
                    <td className="p-3 font-bold text-slate-800">{cls.averageScore}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold ${
                          cls.passRate >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : cls.passRate >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {cls.passRate}%
                      </span>
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold">{cls.highestScore}%</td>
                    <td className="p-3 text-rose-600 font-semibold">{cls.lowestScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'topPerformers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Khmer Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Score %</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.topPerformers ?? []).map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-amber-600">#{s.rank}</td>
                    <td className="p-3 font-semibold text-slate-800">{s.studentName}</td>
                    <td className="p-3 text-slate-500">{s.studentNameKm || '-'}</td>
                    <td className="p-3">{s.className}</td>
                    <td className="p-3 font-bold text-emerald-600">{s.percentage}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                        {s.gradeLetter}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'atRisk' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Khmer Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Score %</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Feedback / Intervention Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.atRiskStudents ?? []).map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{s.studentName}</td>
                    <td className="p-3 text-slate-500">{s.studentNameKm || '-'}</td>
                    <td className="p-3">{s.className}</td>
                    <td className="p-3 font-bold text-rose-600">{s.percentage}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">
                        {s.gradeLetter}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{s.feedback || 'Requires remedial instruction'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
