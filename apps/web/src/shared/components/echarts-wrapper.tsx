import { useEffect, useRef, type FC, type HTMLAttributes } from 'react';
import * as echarts from 'echarts';

export interface EChartsWrapperProps extends HTMLAttributes<HTMLDivElement> {
  option: echarts.EChartsOption;
  height?: string | number;
  width?: string | number;
  loading?: boolean;
  theme?: string | object;
}

export const EChartsWrapper: FC<EChartsWrapperProps> = ({
  option,
  height = '320px',
  width = '100%',
  loading = false,
  theme,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(containerRef.current, theme, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstanceRef.current;
    chart.setOption(option, { notMerge: true, lazyUpdate: true });

    if (loading) {
      chart.showLoading({
        text: 'Loading chart...',
        color: '#45AC5E',
        textColor: '#64748B',
        maskColor: 'rgba(255, 255, 255, 0.7)',
      });
    } else {
      chart.hideLoading();
    }

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [option, loading, theme]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        ...style,
      }}
      {...rest}
    />
  );
};
