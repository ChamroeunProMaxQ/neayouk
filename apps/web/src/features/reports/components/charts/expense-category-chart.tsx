import { useMemo, type FC } from 'react';
import type * as echarts from 'echarts';
import { EChartsWrapper } from '@/shared/components/echarts-wrapper';

interface CategoryItem {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpenseCategoryChartProps {
  data: CategoryItem[];
  height?: string | number;
}

export const ExpenseCategoryChart: FC<ExpenseCategoryChartProps> = ({
  data,
  height = 280,
}) => {
  const option = useMemo<echarts.EChartsOption>(() => {
    const pieData = data.map((d) => ({
      name: d.category.replace('_', ' '),
      value: d.amount,
      percentage: d.percentage,
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const val = Number(params.value).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          });
          return `<div class="font-bold text-slate-800">${params.name}</div>
            <div class="text-xs text-slate-600 mt-1">Disbursed: <b>${val}</b> (${params.percent}%)</div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748B', fontSize: 12 },
      },
      color: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#F97316', '#64748B'],
      series: [
        {
          name: 'Operating Expense Breakdown',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              formatter: '{b}\n{d}%',
            },
          },
          data: pieData,
        },
      ],
    };
  }, [data]);

  return <EChartsWrapper option={option} height={height} />;
};
