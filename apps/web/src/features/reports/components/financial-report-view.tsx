import { useState, useId, type FC } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { ReportDatePresetEnum, API_ROUTE } from '@repo/contracts';
import { apiClient } from '@/shared/lib/api-client';
import { useFinancialReportQuery } from '../hooks/use-financial-report';
import { ReportKpiCard } from './report-kpi-card';
import { RevenueExpenseTrendChart } from './charts/revenue-expense-trend-chart';
import { PaymentMethodPieChart } from './charts/payment-method-pie-chart';
import { ExpenseCategoryChart } from './charts/expense-category-chart';

export const FinancialReportView: FC = () => {
  const [preset, setPreset] = useState<ReportDatePresetEnum>(ReportDatePresetEnum.THIS_MONTH);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const startDateInputId = useId();
  const endDateInputId = useId();

  const queryParams = {
    preset: preset === ReportDatePresetEnum.CUSTOM ? undefined : preset,
    startDate: preset === ReportDatePresetEnum.CUSTOM ? startDate : undefined,
    endDate: preset === ReportDatePresetEnum.CUSTOM ? endDate : undefined,
  };

  const { data, isLoading } = useFinancialReportQuery(queryParams);
  const summary = data?.data;

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.get<string>(API_ROUTE.REPORT.FINANCIAL_EXPORT, {
        params: queryParams,
        responseType: 'text',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
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
          <h1 className="text-xl font-bold text-slate-800">Financial Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor institutional cash flows, tuition collections, operational expenses, and net margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* Custom Date Range Picker when CUSTOM preset is active */}
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
          title="Total Revenue"
          value={isLoading ? '...' : `$${(summary?.totalRevenue ?? 0).toLocaleString()}`}
          subtitle={`${summary?.paidInvoicesCount ?? 0} invoices settled`}
          trend={
            summary?.revenueGrowthRate !== undefined
              ? { value: summary.revenueGrowthRate, label: 'vs. prev period', isPositive: summary.revenueGrowthRate >= 0 }
              : undefined
          }
          icon={<DollarSign className="w-4 h-4" />}
          iconBgColor="bg-[#EBF6EE]"
          iconColor="text-[#45AC5E]"
        />

        <ReportKpiCard
          title="Outstanding Fees"
          value={isLoading ? '...' : `$${(summary?.totalOutstanding ?? 0).toLocaleString()}`}
          subtitle={`${(summary?.unpaidInvoicesCount ?? 0) + (summary?.overdueInvoicesCount ?? 0)} pending invoices`}
          icon={<AlertCircle className="w-4 h-4" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <ReportKpiCard
          title="Operating Costs"
          value={isLoading ? '...' : `$${((summary?.totalExpenses ?? 0) + (summary?.totalPayroll ?? 0)).toLocaleString()}`}
          subtitle={`Expenses: $${(summary?.totalExpenses ?? 0).toLocaleString()} | Payroll: $${(summary?.totalPayroll ?? 0).toLocaleString()}`}
          icon={<CreditCard className="w-4 h-4" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />

        <ReportKpiCard
          title="Net Operating Margin"
          value={isLoading ? '...' : `$${(summary?.netOperatingMargin ?? 0).toLocaleString()}`}
          subtitle={
            (summary?.netOperatingMargin ?? 0) >= 0 ? 'Operating at surplus' : 'Operating at deficit'
          }
          icon={<TrendingUp className="w-4 h-4" />}
          iconBgColor={(summary?.netOperatingMargin ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
          iconColor={(summary?.netOperatingMargin ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />

        <ReportKpiCard
          title="Collection Rate"
          value={isLoading ? '...' : `${summary?.collectionRate ?? 0}%`}
          subtitle="Billed vs Collected velocity"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Trends */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Monthly Cash Flow Trend</h2>
              <p className="text-xs text-slate-400">Comparing Revenue Inflows against Operating Costs and Payroll</p>
            </div>
            <div className="p-2 bg-[#EBF6EE] rounded-lg text-[#45AC5E]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <RevenueExpenseTrendChart data={summary?.monthlyTrends ?? []} height={320} />
        </div>

        {/* Right 1 Col: Revenue Streams Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Revenue Streams</h2>
              <p className="text-xs text-slate-400">Income distribution by fee category</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <ExpenseCategoryChart data={summary?.revenueByCategory ?? []} height={280} />
        </div>
      </div>

      {/* Bottom Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Expense Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Operating Cost Distribution</h2>
              <p className="text-xs text-slate-400">Breakdown of utilities, supplies, maintenance, and salaries</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <ExpenseCategoryChart data={summary?.expenseByCategory ?? []} height={280} />
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Payment Methods</h2>
              <p className="text-xs text-slate-400">Transactions collected via Cash, Bank Transfer, and Cards</p>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <PaymentMethodPieChart data={summary?.paymentMethodsDistribution ?? []} height={280} />
        </div>
      </div>
    </div>
  );
};
