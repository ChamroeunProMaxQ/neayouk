import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface GradeItem {
  gradeLetter: string;
  count: number;
  percentage: number;
}

interface GradeDistributionBarChartProps {
  data: GradeItem[];
  height?: string | number;
}

export const GradeDistributionBarChart: FC<GradeDistributionBarChartProps> = ({
  data,
  height = 280,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const grades = data.map((d) => `Grade ${d.gradeLetter}`);

    const colorMap: Record<string, string> = {
      'Grade A': '#10B981',
      'Grade B': '#06B6D4',
      'Grade C': '#3B82F6',
      'Grade D': '#F59E0B',
      'Grade E': '#F97316',
      'Grade F': '#EF4444',
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const gradeData = data.find((d) => `Grade ${d.gradeLetter}` === item.name);
          return `<div class="font-bold text-slate-800">${item.name}</div>
            <div class="text-xs text-slate-600 mt-1">Students: <b>${item.value}</b> (${gradeData?.percentage || 0}%)</div>`;
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
        data: grades,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B', fontWeight: 600, fontSize: 11 },
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
          data: data.map((d) => ({
            value: d.count,
            itemStyle: {
              color: colorMap[`Grade ${d.gradeLetter}`] || '#45AC5E',
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barMaxWidth: 36,
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
