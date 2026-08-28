import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReportsHubView } from './reports-hub-view';

vi.mock('../hooks/use-report-overview', () => ({
  useReportOverviewQuery: () => ({
    data: {
      data: {
        financial: {
          totalRevenue: 120000,
          totalExpenses: 45000,
          netMargin: 75000,
          collectionRate: 92.5,
        },
        academic: {
          totalStudents: 450,
          averageScore: 78.4,
          passRate: 88.2,
          honorRollCount: 65,
        },
        attendance: {
          studentRate: 94.5,
          teacherRate: 98.0,
          chronicAbsentCount: 12,
        },
      },
    },
    isLoading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ReportsHubView (Component)', () => {
  it('renders all 3 domain cards and quick statistics', () => {
    render(<ReportsHubView />, { wrapper: createWrapper() });

    expect(screen.getByText('Reports & Analytics Hub')).toBeInTheDocument();
    expect(screen.getByText('Financial Reports & Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Academic Reports & Grading')).toBeInTheDocument();
    expect(screen.getByText('Attendance Analytics & Truancy')).toBeInTheDocument();

    // Check financial quick metrics
    expect(screen.getByText('$120,000')).toBeInTheDocument();
    expect(screen.getByText('$75,000')).toBeInTheDocument();
    expect(screen.getByText('92.5%')).toBeInTheDocument();

    // Check academic quick metrics
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('78.4%')).toBeInTheDocument();
    expect(screen.getByText('88.2%')).toBeInTheDocument();

    // Check attendance quick metrics
    expect(screen.getByText('94.5%')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('12 students')).toBeInTheDocument();
  });
});
