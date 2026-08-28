import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface DailyTrendItem {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  attendanceRate: number;
}

interface AttendanceTrendAreaChartProps {
  data: DailyTrendItem[];
  height?: string | number;
}

export const AttendanceTrendAreaChart: FC<AttendanceTrendAreaChartProps> = ({
  data,
  height = 320,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const dates = data.map((d) => d.date);
    const rates = data.map((d) => d.attendanceRate);
    const presents = data.map((d) => d.present);
    const absents = data.map((d) => d.absent);
    const lates = data.map((d) => d.late);
    const excuseds = data.map((d) => d.excused);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const title = params[0]?.name || '';
          const d = data[params[0]?.dataIndex];
          return `<div class="font-bold text-slate-800 mb-1">${title}</div>
            <div class="text-xs text-slate-700 py-0.5">Attendance Rate: <b class="text-[#45AC5E]">${d?.attendanceRate}%</b></div>
            <div class="text-xs text-slate-600 py-0.5">Present: <b>${d?.present}</b> | Late: <b>${d?.late}</b></div>
            <div class="text-xs text-slate-600 py-0.5">Absent: <b class="text-rose-500">${d?.absent}</b> | Excused: <b>${d?.excused}</b></div>`;
        },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 12 },
        data: ['Attendance Rate %', 'Present', 'Absent', 'Late', 'Excused'],
      },
      grid: {
        top: 25,
        left: 45,
        right: 45,
        bottom: 35,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Rate %',
          max: 100,
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 11, formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        {
          type: 'value',
          name: 'Students',
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Attendance Rate %',
          type: 'line',
          yAxisIndex: 0,
          data: rates,
          smooth: true,
          lineStyle: { width: 3, color: '#45AC5E' },
          itemStyle: { color: '#45AC5E' },
          areaStyle: {
            color: 'rgba(69, 172, 94, 0.15)',
          },
        },
        {
          name: 'Present',
          type: 'bar',
          yAxisIndex: 1,
          stack: 'sessions',
          data: presents,
          itemStyle: { color: '#10B981' },
          barMaxWidth: 16,
        },
        {
          name: 'Late',
          type: 'bar',
          yAxisIndex: 1,
          stack: 'sessions',
          data: lates,
          itemStyle: { color: '#F59E0B' },
          barMaxWidth: 16,
        },
        {
          name: 'Excused',
          type: 'bar',
          yAxisIndex: 1,
          stack: 'sessions',
          data: excuseds,
          itemStyle: { color: '#3B82F6' },
          barMaxWidth: 16,
        },
        {
          name: 'Absent',
          type: 'bar',
          yAxisIndex: 1,
          stack: 'sessions',
          data: absents,
          itemStyle: { color: '#EF4444' },
          barMaxWidth: 16,
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
