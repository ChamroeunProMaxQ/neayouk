import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AttendanceStatusEnum,
  UserTypeEnum,
  type StudentAttendanceMatrixDto,
} from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { StudentAttendanceSheet } from "./student-attendance-sheet";
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

const mockClasses = [
  { id: 10, name: "Grade 10A", code: "CLS-10A", gradeLevel: "Grade 10", status: "ACTIVE" },
];

const mockMatrixData: StudentAttendanceMatrixDto = {
  classId: 10,
  className: "Grade 10A",
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  dates: ["2026-08-17", "2026-08-18"],
  totalStudents: 2,
  rows: [
    {
      studentId: 101,
      studentCode: "STU-0001",
      firstName: "Dara",
      lastName: "Sok",
      firstNameKm: "តារា",
      lastNameKm: "សុខ",
      gender: "MALE",
      totalPresent: 1,
      totalAbsent: 1,
      totalLate: 0,
      totalExcused: 0,
      totalHalfDay: 0,
      attendanceRate: 50,
      attendances: {
        "2026-08-17": {
          status: AttendanceStatusEnum.PRESENT,
          remarks: "On time",
        },
        "2026-08-18": {
          status: AttendanceStatusEnum.ABSENT,
          remarks: "Unexcused",
        },
      },
    },
    {
      studentId: 102,
      studentCode: "STU-0002",
      firstName: "Bopha",
      lastName: "Keo",
      firstNameKm: "បុប្ផា",
      lastNameKm: "កែវ",
      gender: "FEMALE",
      totalPresent: 1,
      totalAbsent: 0,
      totalLate: 1,
      totalExcused: 0,
      totalHalfDay: 0,
      attendanceRate: 75,
      attendances: {
        "2026-08-17": {
          status: AttendanceStatusEnum.LATE,
          remarks: "Late 5 mins",
        },
        "2026-08-18": {
          status: AttendanceStatusEnum.PRESENT,
          remarks: null,
        },
      },
    },
  ],
};

describe("StudentAttendanceSheet", () => {
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

  it("renders class selector, statistics KPIs, student rows, and attendance cells", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/classes")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockClasses,
          },
        } as any);
      }
      if (url.includes("/api/v1/admin/attendance/students/matrix")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockMatrixData,
          },
        } as any);
      }
      return Promise.resolve({ data: { data: null } } as any);
    });

    render(<StudentAttendanceSheet />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Sok Dara")).toBeInTheDocument();
      expect(screen.getByText("Keo Bopha")).toBeInTheDocument();
      expect(screen.getByText("STU-0001")).toBeInTheDocument();
      expect(screen.getByText("STU-0002")).toBeInTheDocument();
    });

    // Check KPI counters
    expect(screen.getByText("Enrolled Students")).toBeInTheDocument();
    expect(screen.getByText("Attendance Rate")).toBeInTheDocument();
  });

  it("cycles cell status on click and enables Save Changes button", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/classes")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockClasses,
          },
        } as any);
      }
      if (url.includes("/api/v1/admin/attendance/students/matrix")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockMatrixData,
          },
        } as any);
      }
      return Promise.resolve({ data: { data: null } } as any);
    });

    const user = userEvent.setup();
    render(<StudentAttendanceSheet />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Sok Dara")).toBeInTheDocument();
    });

    // Find the cell button for Dara's PRESENT status (P)
    const cellButtons = screen.getAllByRole("button", { name: "P" });
    expect(cellButtons.length).toBeGreaterThan(0);

    // Clicking 'P' should cycle to 'A' (Absent)
    if (cellButtons[0]) {
      await user.click(cellButtons[0]);
    }

    // Save button should show pending changes
    expect(screen.getByRole("button", { name: /save changes \(1\)/i })).toBeInTheDocument();
  });
});
