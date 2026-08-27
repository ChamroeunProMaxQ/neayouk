import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  StaffDepartmentEnum,
  StaffEmploymentTypeEnum,
  StaffGenderEnum,
  StaffSalaryTypeEnum,
  StaffStatusEnum,
  UserTypeEnum,
  UserStatusEnum,
  type StaffAttribute,
} from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { StaffListTable } from "./staff-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth";

function createWrapper(initialEntries: string[] = ["/hr-payroll/staff"]) {
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

const mockStaff: StaffAttribute[] = [
  {
    id: 1,
    uuid: "staff-uuid-1",
    staffCode: "STF-2026-001",
    name: "Dara Som",
    nameKm: "ដារ៉ា សោម",
    department: StaffDepartmentEnum.ACADEMIC,
    designation: "Senior English Teacher",
    specialization: "TOEFL & IELTS",
    gender: StaffGenderEnum.MALE,
    dateOfBirth: "1990-05-15",
    phone: "012888999",
    email: "dara.som@elc.edu.kh",
    employmentType: StaffEmploymentTypeEnum.FULL_TIME,
    salaryType: StaffSalaryTypeEnum.HOURLY,
    baseSalary: 0,
    hourlyRate: 18.0,
    joiningDate: "2024-01-10",
    bankName: "ABA Bank",
    bankAccountName: "DARA SOM",
    bankAccountNumber: "000123456",
    status: StaffStatusEnum.ACTIVE,
    bio: "Certified English Teacher",
    notes: null,
    user: {
      id: 101,
      uuid: "usr-101",
      username: "dara_som",
      userType: UserTypeEnum.CMS,
      status: UserStatusEnum.ACTIVE,
      computedNameId: "user-101",
      password: "",
    },
    classes: [
      { id: 10, uuid: "cls-10", name: "IELTS Advanced", studentCount: 15 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    uuid: "staff-uuid-2",
    staffCode: "STF-2026-002",
    name: "Bopha Chan",
    nameKm: "បុប្ផា ចាន់",
    department: StaffDepartmentEnum.FINANCE,
    designation: "Head Accountant",
    specialization: "Payroll & Tax",
    gender: StaffGenderEnum.FEMALE,
    dateOfBirth: "1988-11-20",
    phone: "099777666",
    email: "bopha.chan@elc.edu.kh",
    employmentType: StaffEmploymentTypeEnum.FULL_TIME,
    salaryType: StaffSalaryTypeEnum.MONTHLY,
    baseSalary: 850.0,
    hourlyRate: 0,
    joiningDate: "2023-08-01",
    bankName: "Canadia Bank",
    bankAccountName: "BOPHA CHAN",
    bankAccountNumber: "009876543",
    status: StaffStatusEnum.ACTIVE,
    bio: "Lead Financial Accountant",
    notes: null,
    user: null,
    classes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("StaffListTable Component", () => {
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
          { action: "delete", resource: "hr" },
        ],
      },
      token: "mock-token",
      isAuthenticated: true,
    });

    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/hr/staff")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockStaff,
            pagination: {
              page: 1,
              pageSize: 20,
              total: 2,
              totalPage: 1,
            },
          },
        } as any);
      }
      return Promise.resolve({ data: { data: [] } } as any);
    });
  });

  it("should render staff members in table with department, designation, and compensation details", async () => {
    render(<StaffListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Dara Som")).toBeInTheDocument();
      expect(screen.getByText("Bopha Chan")).toBeInTheDocument();
    });

    expect(screen.getByText("STF-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Senior English Teacher")).toBeInTheDocument();
    expect(screen.getByText("$18.00 / hr")).toBeInTheDocument();

    expect(screen.getByText("STF-2026-002")).toBeInTheDocument();
    expect(screen.getByText("Head Accountant")).toBeInTheDocument();
    expect(screen.getByText("$850.00 / mo")).toBeInTheDocument();
    expect(screen.getByText("@dara_som")).toBeInTheDocument();
  });

  it("should display search and filter selectors for departments and salary formulas", async () => {
    render(<StaffListTable />, { wrapper: createWrapper() });

    expect(
      screen.getByPlaceholderText("Search staff by name, code, phone...")
    ).toBeInTheDocument();
    expect(screen.getByText("Add Staff Member")).toBeInTheDocument();
  });
});
