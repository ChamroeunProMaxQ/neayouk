import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PaymentMethodEnum,
  PayrollItemTypeEnum,
  PayrollStatusEnum,
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  UserTypeEnum,
  type PayrollAttribute,
} from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { PayrollListTable } from "./payroll-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth";

function createWrapper(initialEntries: string[] = ["/hr-payroll/salary"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

const mockPayrolls: PayrollAttribute[] = [
  {
    id: 10,
    uuid: "pr-uuid-10",
    payrollNumber: "PAY-202608-0001",
    staffId: 1,
    year: 2026,
    month: 8,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    workingDays: 22,
    holidayDays: 0,
    salaryType: StaffSalaryTypeEnum.HOURLY,
    baseSalary: 0,
    hourlyRate: 18.0,
    totalHoursWorked: 40.0,
    calculatedBaseAmount: 720.0,
    totalBonus: 50.0,
    totalDeduction: 20.0,
    grossSalary: 770.0,
    netSalary: 750.0,
    status: PayrollStatusEnum.PAID,
    paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
    paymentDate: "2026-08-31",
    paymentReference: "TRX-ABA-888999",
    notes: "Regular month salary",
    processedBy: 1,
    staff: {
      id: 1,
      uuid: "staff-uuid-1",
      staffCode: "STF-001",
      name: "Dara Som",
      nameKm: "ដារ៉ា សោម",
      department: StaffDepartmentEnum.ACADEMIC,
      designation: "Senior English Teacher",
    } as any,
    items: [
      {
        id: 1,
        uuid: "item-1",
        payrollId: 10,
        itemType: PayrollItemTypeEnum.BONUS,
        title: "Student Retention Bonus",
        amount: 50.0,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        uuid: "item-2",
        payrollId: 10,
        itemType: PayrollItemTypeEnum.ADVANCE_SALARY,
        title: "Salary Advance Repayment",
        amount: 20.0,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("PayrollListTable Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        userType: UserTypeEnum.ADMIN,
        roles: ["admin"],
        permissions: [
          { action: "manage", resource: "all" },
          { action: "read", resource: "hr" },
          { action: "create", resource: "hr" },
          { action: "update", resource: "hr" },
        ],
      },
      token: "mock-token",
      isAuthenticated: true,
    });

    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/hr/payrolls")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockPayrolls,
            pagination: {
              page: 1,
              pageSize: 20,
              total: 1,
              totalPage: 1,
            },
          },
        } as any);
      }
      return Promise.resolve({ data: { data: [] } } as any);
    });
  });

  it("should render payroll vouchers with voucher number, employee details, base and net salaries", async () => {
    render(<PayrollListTable year={2026} month={8} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("PAY-202608-0001")).toBeInTheDocument();
      expect(screen.getByText("Dara Som")).toBeInTheDocument();
    });

    expect(screen.getByText("+$50.00 bonus")).toBeInTheDocument();
    expect(screen.getByText("-$20.00 ded.")).toBeInTheDocument();
    expect(screen.getByText("$750.00")).toBeInTheDocument();
    expect(screen.getAllByText("Paid").length).toBeGreaterThanOrEqual(1);
  });
});
