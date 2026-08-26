import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AttendanceStatusEnum,
  UserTypeEnum,
} from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { TeacherAttendanceTable } from "./teacher-attendance-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

const mockTeachers = [
  {
    id: 1,
    name: "John Sok",
    teacherCode: "TCH-0001",
    salaryInHour: 15.0,
    specialization: "Math",
    phone: "012345678",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Sreymom Chan",
    teacherCode: "TCH-0002",
    salaryInHour: 18.5,
    specialization: "English",
    phone: "098765432",
    status: "ACTIVE",
  },
];

const mockTeacherAttendances = [
  {
    id: 10,
    uuid: "att-uuid-1",
    teacherId: 1,
    date: "2026-08-17",
    checkInTime: "07:30",
    checkOutTime: "11:30",
    hoursWorked: 4.0,
    status: AttendanceStatusEnum.PRESENT,
    remarks: "Regular shift",
    recordedById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("TeacherAttendanceTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "admin",
        userType: UserTypeEnum.ADMIN,
        roles: ["admin"],
        permissions: [{ resource: "all", action: "manage" }],
      },
      token: "mock-token",
      isAuthenticated: true,
    });
  });

  it("renders teacher roster rows, check in/out inputs, and quick actions", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/teachers")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockTeachers,
          },
        } as any);
      }
      if (url.includes("/api/v1/admin/attendance/teachers")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockTeacherAttendances,
            pagination: { page: 1, pageSize: 100, totalCount: 1, totalPage: 1 },
          },
        } as any);
      }
      return Promise.resolve({ data: { data: [] } } as any);
    });

    render(<TeacherAttendanceTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("John Sok")).toBeInTheDocument();
      expect(screen.getByText("Sreymom Chan")).toBeInTheDocument();
      expect(screen.getByText("$15.00")).toBeInTheDocument();
      expect(screen.getByText("$18.50")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /fill standard shift/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save daily roster/i })).toBeInTheDocument();
  });

  it("allows marking all present with standard shift", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/teachers")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockTeachers,
          },
        } as any);
      }
      if (url.includes("/api/v1/admin/attendance/teachers")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: [],
            pagination: { page: 1, pageSize: 100, totalCount: 0, totalPage: 0 },
          },
        } as any);
      }
      return Promise.resolve({ data: { data: [] } } as any);
    });

    render(<TeacherAttendanceTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("John Sok")).toBeInTheDocument();
    });

    const fillBtn = screen.getByRole("button", { name: /fill standard shift/i });
    await user.click(fillBtn);

    expect(screen.getAllByText("4h").length).toBeGreaterThanOrEqual(2);
  });
});
