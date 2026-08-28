import { useState, useId, type FC } from 'react';
import {
  ClipboardCheck,
  UserCheck,
  UserX,
  AlertOctagon,
  CalendarDays,
  Download,
  Printer,
  Calendar,
  Phone,
} from 'lucide-react';
import { ReportDatePresetEnum, API_ROUTE } from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';
import { useAttendanceReportQuery } from '../hooks/use-attendance-report';
import { ReportKpiCard } from './report-kpi-card';
import { AttendanceTrendAreaChart } from './charts/attendance-trend-area-chart';
import { ClassAttendanceBarChart } from './charts/class-attendance-bar-chart';
import { WeekdayAbsenceChart } from './charts/weekday-absence-chart';

export const AttendanceReportView: FC = () => {
  const [preset, setPreset] = useState<ReportDatePresetEnum>(ReportDatePresetEnum.THIS_MONTH);
  const [targetType, setTargetType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'classes' | 'chronic'>('classes');
  const startDateInputId = useId();
  const endDateInputId = useId();

  const queryParams = {
    preset: preset === ReportDatePresetEnum.CUSTOM ? undefined : preset,
    startDate: preset === ReportDatePresetEnum.CUSTOM ? startDate : undefined,
    endDate: preset === ReportDatePresetEnum.CUSTOM ? endDate : undefined,
    targetType,
  };

  const { data, isLoading } = useAttendanceReportQuery(queryParams);
  const summary = data?.data;

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.get<string>(API_ROUTE.REPORT.ATTENDANCE_EXPORT, {
        params: queryParams,
        responseType: 'text',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
          <h1 className="text-xl font-bold text-slate-800">Attendance Analytics & Audits</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track daily student check-ins, teacher punctuality, weekday absence trends, and chronic truancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setTargetType('STUDENT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                targetType === 'STUDENT' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Student Attendance
            </button>
            <button
              onClick={() => setTargetType('TEACHER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                targetType === 'TEACHER' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Teacher Check-ins
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {[
              { label: 'This Month', value: ReportDatePresetEnum.THIS_MONTH },
              { label: 'Last Month', value: ReportDatePresetEnum.LAST_MONTH },
              { label: 'This Quarter', value: ReportDatePresetEnum.THIS_QUARTER },
              { label: 'This Year', value: ReportDatePresetEnum.THIS_YEAR },
              { label: 'Custom', value: ReportDatePresetEnum.CUSTOM },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  preset === p.value ? 'bg-white text-slate-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

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

      {/* Custom Date Range Picker */}
      {preset === ReportDatePresetEnum.CUSTOM && (
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor={startDateInputId} className="text-slate-500 font-medium">From:</label>
            <input
              id={startDateInputId}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-[#45AC5E]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor={endDateInputId} className="text-slate-500 font-medium">To:</label>
            <input
              id={endDateInputId}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-[#45AC5E]"
            />
          </div>
        </div>
      )}

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ReportKpiCard
          title="Student Attendance"
          value={isLoading ? '...' : `${summary?.studentAttendanceRate ?? 0}%`}
          subtitle={`${summary?.totalSessionsRecorded ?? 0} total sessions logged`}
          icon={<ClipboardCheck className="w-4 h-4" />}
          iconBgColor="bg-[#EBF6EE]"
          iconColor="text-[#45AC5E]"
        />

        <ReportKpiCard
          title="Teacher Attendance"
          value={isLoading ? '...' : `${summary?.teacherAttendanceRate ?? 0}%`}
          subtitle="Faculty check-in rate"
          icon={<UserCheck className="w-4 h-4" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />

        <ReportKpiCard
          title="Daily Average Absences"
          value={isLoading ? '...' : (summary?.averageDailyAbsences ?? 0)}
          subtitle="Unexcused absences / day"
          icon={<UserX className="w-4 h-4" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <ReportKpiCard
          title="Chronic Truancy"
          value={isLoading ? '...' : (summary?.chronicAbsenteeismCount ?? 0)}
          subtitle="Students with >10% absence"
          icon={<AlertOctagon className="w-4 h-4" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />

        <ReportKpiCard
          title="Approved Leaves"
          value={isLoading ? '...' : (summary?.totalApprovedLeaves ?? 0)}
          subtitle="Authorized staff & student leaves"
          icon={<CalendarDays className="w-4 h-4" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Attendance Dynamics Over Time</h2>
              <p className="text-xs text-slate-400">Daily attendance percentages with multi-status volume breakdown</p>
            </div>
            <div className="p-2 bg-[#EBF6EE] rounded-lg text-[#45AC5E]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>

          <AttendanceTrendAreaChart data={summary?.dailyTrends ?? []} height={320} />
        </div>

        {/* Weekday Absence Pattern (Right 1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Weekday Absence Spike</h2>
              <p className="text-xs text-slate-400">Absence distribution by day of the week</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>

          <WeekdayAbsenceChart data={summary?.weekdayAbsencePatterns ?? []} height={280} />
        </div>
      </div>

      {/* Class Comparison Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Class Attendance Health Comparison</h2>
            <p className="text-xs text-slate-400">Comparing attendance rate across cohorts with 90% benchmark indicator</p>
          </div>
          <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <ClassAttendanceBarChart data={summary?.classAttendanceList ?? []} height={300} />
      </div>

      {/* Tabular Lists */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 px-5 pt-4 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('classes')}
            className={`pb-3 transition-colors ${
              activeTab === 'classes'
                ? 'text-[#45AC5E] border-b-2 border-[#45AC5E]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Class Attendance Overview ({summary?.classAttendanceList?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('chronic')}
            className={`pb-3 transition-colors ${
              activeTab === 'chronic'
                ? 'text-[#45AC5E] border-b-2 border-[#45AC5E]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chronic Absenteeism Watchlist ({summary?.chronicAbsenteeismList?.length ?? 0})
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          {activeTab === 'classes' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Class Name</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3">Present Sessions</th>
                  <th className="p-3">Late Count</th>
                  <th className="p-3">Excused Count</th>
                  <th className="p-3">Absences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.classAttendanceList ?? []).map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{cls.className}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold ${
                          cls.attendanceRate >= 95
                            ? 'bg-emerald-50 text-emerald-700'
                            : cls.attendanceRate >= 90
                            ? 'bg-sky-50 text-sky-700'
                            : cls.attendanceRate >= 80
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {cls.attendanceRate}%
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-600">{cls.presentCount}</td>
                    <td className="p-3 text-amber-600 font-semibold">{cls.lateCount}</td>
                    <td className="p-3 text-sky-600">{cls.excusedCount}</td>
                    <td className="p-3 font-bold text-rose-600">{cls.absentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'chronic' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Khmer Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Total Absences</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(summary?.chronicAbsenteeismList ?? []).map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{stu.studentName}</td>
                    <td className="p-3 text-slate-500">{stu.studentNameKm || '-'}</td>
                    <td className="p-3">{stu.className}</td>
                    <td className="p-3 font-bold text-rose-600">{stu.absentDays} days missed</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">
                        {stu.attendanceRate}%
                      </span>
                    </td>
                    <td className="p-3">
                      {stu.parentPhone ? (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {stu.parentPhone}
                        </span>
                      ) : (
                        <span className="text-slate-400">No contact provided</span>
                      )}
                    </td>
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
