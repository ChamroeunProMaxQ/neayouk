import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface ClassAttendanceItem {
  classId: number;
  className: string;
  enrolledCount: number;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}

interface ClassAttendanceBarChartProps {
  data: ClassAttendanceItem[];
  height?: string | number;
}

export const ClassAttendanceBarChart: FC<ClassAttendanceBarChartProps> = ({
  data,
  height = 300,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const sorted = [...data].sort((a, b) => a.attendanceRate - b.attendanceRate);
    const names = sorted.map((d) => d.className);
    const rates = sorted.map((d) => d.attendanceRate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = sorted[params[0]?.dataIndex];
          return `<div class="font-bold text-slate-800">${item?.className}</div>
            <div class="text-xs text-slate-600 mt-1">Attendance Rate: <b>${item?.attendanceRate}%</b></div>
            <div class="text-xs text-slate-500">Present: ${item?.presentCount} | Absent: ${item?.absentCount}</div>
            <div class="text-xs text-slate-500">Late: ${item?.lateCount} | Excused: ${item?.excusedCount}</div>`;
        },
      },
      grid: {
        top: 20,
        left: 40,
        right: 40,
        bottom: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11, fontWeight: 500 },
      },
      series: [
        {
          type: 'bar',
          data: rates.map((val) => ({
            value: val,
            itemStyle: {
              color: val >= 95 ? '#10B981' : val >= 90 ? '#45AC5E' : val >= 80 ? '#F59E0B' : '#EF4444',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barMaxWidth: 18,
          label: {
            show: true,
            position: 'right',
            color: '#64748B',
            fontSize: 11,
            fontWeight: 'bold',
            formatter: '{c}%',
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: 90,
                lineStyle: { color: '#EF4444', type: 'dashed', width: 1.5 },
                label: { formatter: '90% Target', color: '#EF4444', fontSize: 10 },
              },
            ],
          },
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
