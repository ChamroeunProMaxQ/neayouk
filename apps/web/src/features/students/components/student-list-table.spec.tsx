import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentStatusEnum, SemesterEnum, type StudentAttribute } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { StudentListTable } from "./student-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth";

function createWrapper(initialEntries: string[] = ["/"]) {
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

const mockStudents: StudentAttribute[] = [
  {
    id: 1,
    uuid: "stu-uuid-1",
    studentCode: "STU-2026-0001",
    firstName: "Sokha",
    lastName: "Chan",
    firstNameKm: "សុខា",
    lastNameKm: "ចាន់",
    gender: "MALE",
    dateOfBirth: "2010-05-15",
    contact: "012345678",
    guardianName: "Dara Chan",
    guardianPhone: "098765432",
    payableDate: 5,
    discount: 10.0,
    status: StudentStatusEnum.ACTIVE,
    primaryClass: {
      id: 101,
      uuid: "class-uuid-1",
      name: "Grade 10 - Section A",
      code: "G10-A",
      monthlyFee: 50.0,
      semester: SemesterEnum.SEMESTER_1,
      capacity: 30,
      status: "ACTIVE",
    },
    paymentSummary: {
      studentId: 1,
      totalPaidAmount: 50.0,
      totalUnpaidMonths: 0,
      unpaidMonthsList: [],
      totalOutstandingAmount: 0,
      lastPaymentDate: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 2,
    uuid: "stu-uuid-2",
    studentCode: "STU-2026-0002",
    firstName: "Bopha",
    lastName: "Keo",
    firstNameKm: "បុប្ផា",
    lastNameKm: "កែវ",
    gender: "FEMALE",
    dateOfBirth: "2010-08-20",
    contact: "099887766",
    guardianName: "Sarith Keo",
    guardianPhone: "011223344",
    payableDate: 1,
    discount: 0,
    status: StudentStatusEnum.ACTIVE,
    primaryClass: {
      id: 102,
      uuid: "class-uuid-2",
      name: "Grade 11 - Section B",
      code: "G11-B",
      monthlyFee: 60.0,
      semester: SemesterEnum.SEMESTER_1,
      capacity: 30,
      status: "ACTIVE",
    },
    paymentSummary: {
      studentId: 2,
      totalPaidAmount: 0,
      totalUnpaidMonths: 2,
      unpaidMonthsList: [
        { year: 2026, month: 7, monthName: "July 2026", amountDue: 60, status: "UNPAID" as any },
        { year: 2026, month: 8, monthName: "August 2026", amountDue: 60, status: "UNPAID" as any },
      ],
      totalOutstandingAmount: 120.0,
      lastPaymentDate: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

describe("StudentListTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "admin",
        userType: "ADMIN" as any,
        roles: ["admin"],
        permissions: [{ resource: "all", action: "manage" }],
      },
      isAuthenticated: true,
    });
  });

  it("renders search bar, filter dropdowns, register button, and student rows", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url.includes("/api/v1/admin/classes")) {
        return Promise.resolve({
          data: { status: 200, message: "success", data: [] },
        } as any);
      }
      return Promise.resolve({
        data: {
          status: 200,
          message: "success",
          data: mockStudents,
          pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
        },
      } as any);
    });

    render(<StudentListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by payment status/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register student/i })).toBeInTheDocument();

    // Verify columns and mock student rows
    expect(await screen.findByText(/sokha chan/i)).toBeInTheDocument();
    expect(screen.getByText(/bopha keo/i)).toBeInTheDocument();
    expect(screen.getByText(/fully paid/i)).toBeInTheDocument();
    expect(screen.getByText(/2 months unpaid/i)).toBeInTheDocument();
  });

  it("triggers search and updates fetch parameters when typing", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockStudents[0]],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPage: 1 },
      },
    } as any);

    render(<StudentListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    await user.type(searchInput, "Sokha");

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=Sokha"),
        expect.anything()
      );
    });
  });

  it("opens Register Student dialog on button click", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockStudents,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<StudentListTable />, { wrapper: createWrapper() });

    const registerBtn = screen.getByRole("button", { name: /register student/i });
    await user.click(registerBtn);

    expect(screen.getByRole("heading", { name: /register new student/i })).toBeInTheDocument();
  });
});
