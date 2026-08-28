import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface TrendItem {
  month: string;
  revenue: number;
  expense: number;
  payroll: number;
  net: number;
}

interface RevenueExpenseTrendChartProps {
  data: TrendItem[];
  height?: string | number;
}

export const RevenueExpenseTrendChart: FC<RevenueExpenseTrendChartProps> = ({
  data,
  height = 320,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const months = data.map((d) => d.month);
    const revenues = data.map((d) => d.revenue);
    const expenses = data.map((d) => d.expense);
    const payrolls = data.map((d) => d.payroll);
    const nets = data.map((d) => d.net);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const title = params[0]?.name || '';
          let text = `<div class="font-bold text-slate-800 mb-1">${title}</div>`;
          params.forEach((p: any) => {
            const val = Number(p.value).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            });
            text += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
              <span class="flex items-center gap-1.5">${p.marker} <span>${p.seriesName}</span></span>
              <span class="font-semibold text-slate-700">${val}</span>
            </div>`;
          });
          return text;
        },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 12 },
        data: ['Revenue (Inflow)', 'School Expenses', 'Staff Payroll', 'Net Margin'],
      },
      grid: {
        top: 20,
        left: 50,
        right: 20,
        bottom: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          formatter: (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
        },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [
        {
          name: 'Revenue (Inflow)',
          type: 'bar',
          data: revenues,
          itemStyle: { color: '#45AC5E', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 24,
        },
        {
          name: 'School Expenses',
          type: 'bar',
          data: expenses,
          itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 24,
        },
        {
          name: 'Staff Payroll',
          type: 'bar',
          data: payrolls,
          itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 24,
        },
        {
          name: 'Net Margin',
          type: 'line',
          data: nets,
          itemStyle: { color: '#3B82F6' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
