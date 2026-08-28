import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface ClassBenchmarkItem {
  classId: number;
  className: string;
  gradeLevel?: number | null;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

interface ClassPerformanceChartProps {
  data: ClassBenchmarkItem[];
  height?: string | number;
}

export const ClassPerformanceChart: FC<ClassPerformanceChartProps> = ({
  data,
  height = 300,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const classNames = data.map((d) => d.className);
    const avgScores = data.map((d) => d.averageScore);
    const passRates = data.map((d) => d.passRate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const cls = data[params[0]?.dataIndex];
          return `<div class="font-bold text-slate-800">${cls?.className}</div>
            <div class="text-xs text-slate-600 mt-1">Class Average: <b>${cls?.averageScore}%</b></div>
            <div class="text-xs text-slate-600">Pass Rate: <b>${cls?.passRate}%</b></div>
            <div class="text-xs text-slate-500">Enrolled Students: ${cls?.totalStudents}</div>
            <div class="text-xs text-slate-400">Score Range: ${cls?.lowestScore}% - ${cls?.highestScore}%</div>`;
        },
      },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 12 },
        data: ['Class Average %', 'Pass Rate %'],
      },
      grid: {
        top: 20,
        left: 40,
        right: 20,
        bottom: 35,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: classNames,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 0, rotate: data.length > 6 ? 25 : 0 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [
        {
          name: 'Class Average %',
          type: 'bar',
          data: avgScores,
          itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 20,
        },
        {
          name: 'Pass Rate %',
          type: 'bar',
          data: passRates,
          itemStyle: { color: '#45AC5E', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 20,
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
