import type { FC, ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface ReportKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const ReportKpiCard: FC<ReportKpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = 'bg-[#EBF6EE]',
  iconColor = 'text-[#45AC5E]',
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>

        <div className="flex items-center justify-between mt-2 text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}

          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 font-semibold ${
                trend.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {trend.value >= 0 ? `+${trend.value}%` : `${trend.value}%`}{' '}
                {trend.label ? <span className="text-slate-400 font-normal">{trend.label}</span> : null}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
