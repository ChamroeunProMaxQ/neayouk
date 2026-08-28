import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface SubjectItem {
  subjectId: string;
  subjectName: string;
  maxScore: number;
  averageScore: number;
  averagePercentage: number;
  passingCount: number;
}

interface SubjectPerformanceRadarChartProps {
  data: SubjectItem[];
  height?: string | number;
}

export const SubjectPerformanceRadarChart: FC<SubjectPerformanceRadarChartProps> = ({
  data,
  height = 300,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const indicators = data.map((d) => ({
      name: d.subjectName,
      max: 100,
    }));

    const values = data.map((d) => d.averagePercentage);

    return {
      tooltip: {
        trigger: 'item',
        formatter: () => {
          let text = '<div class="font-bold text-slate-800 mb-1">Subject Proficiency Averages</div>';
          data.forEach((d) => {
            text += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
              <span class="text-slate-600">${d.subjectName}:</span>
              <span class="font-semibold text-slate-800">${d.averagePercentage}% (${d.averageScore}/${d.maxScore})</span>
            </div>`;
          });
          return text;
        },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#64748B',
          fontSize: 11,
          fontWeight: 600,
        },
        splitLine: {
          lineStyle: { color: '#E2E8F0' },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['#F8FAFC', '#FFFFFF'],
          },
        },
        axisLine: {
          lineStyle: { color: '#CBD5E1' },
        },
      },
      series: [
        {
          name: 'Subject Mastery',
          type: 'radar',
          data: [
            {
              value: values,
              name: 'Institutional Average',
              areaStyle: {
                color: 'rgba(69, 172, 94, 0.25)',
              },
              lineStyle: {
                color: '#45AC5E',
                width: 2.5,
              },
              itemStyle: {
                color: '#45AC5E',
              },
            },
          ],
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
