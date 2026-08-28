import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface WeekdayAbsenceItem {
  dayOfWeek: string;
  dayIndex: number;
  absenceCount: number;
  averageAbsenceRate: number;
}

interface WeekdayAbsenceChartProps {
  data: WeekdayAbsenceItem[];
  height?: string | number;
}

export const WeekdayAbsenceChart: FC<WeekdayAbsenceChartProps> = ({
  data,
  height = 280,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const days = data.map((d) => d.dayOfWeek);
    const counts = data.map((d) => d.absenceCount);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = data[params[0]?.dataIndex];
          return `<div class="font-bold text-slate-800">${item?.dayOfWeek}</div>
            <div class="text-xs text-slate-600 mt-1">Total Absences: <b>${item?.absenceCount}</b></div>
            <div class="text-xs text-slate-500">Absence Rate: ${item?.averageAbsenceRate}%</div>`;
        },
      },
      grid: {
        top: 20,
        left: 30,
        right: 20,
        bottom: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11, fontWeight: 500 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [
        {
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#F59E0B',
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 28,
          label: {
            show: true,
            position: 'top',
            color: '#64748B',
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
