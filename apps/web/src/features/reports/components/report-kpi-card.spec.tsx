import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DollarSign } from 'lucide-react';
import { ReportKpiCard } from './report-kpi-card';

describe('ReportKpiCard (Component)', () => {
  it('renders title, value, and subtitle correctly', () => {
    render(
      <ReportKpiCard
        title="Total Revenue"
        value="$125,000"
        subtitle="150 invoices settled"
        icon={<DollarSign data-testid="kpi-icon" />}
      />,
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$125,000')).toBeInTheDocument();
    expect(screen.getByText('150 invoices settled')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument();
  });

  it('renders positive trend indicator with green styling', () => {
    render(
      <ReportKpiCard
        title="Revenue"
        value="$50,000"
        trend={{ value: 12.5, label: 'vs. prev month', isPositive: true }}
        icon={<DollarSign />}
      />,
    );

    expect(screen.getByText(/\+12.5%/)).toBeInTheDocument();
    expect(screen.getByText('vs. prev month')).toBeInTheDocument();
  });

  it('renders negative trend indicator with red styling', () => {
    render(
      <ReportKpiCard
        title="Revenue"
        value="$30,000"
        trend={{ value: -5.2, label: 'vs. prev month', isPositive: false }}
        icon={<DollarSign />}
      />,
    );

    expect(screen.getByText(/-5.2%/)).toBeInTheDocument();
  });
});
