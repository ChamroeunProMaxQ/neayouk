import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SemesterEnum, ShiftEnum, type ClassAttribute } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { ClassListTable } from "./class-list-table";
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

const mockClasses: ClassAttribute[] = [
  {
    id: 1,
    uuid: "cls-uuid-1",
    name: "Primary - Grade 1A",
    code: "G1-A",
    gradeLevel: "1",
    program: "Primary",
    section: "A",
    room: "Room 101",
    shift: ShiftEnum.MORNING,
    startTime: "07:30",
    endTime: "11:30",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
    monthlyFee: 65.0,
    academicYear: "2025-2026",
    semester: SemesterEnum.SEMESTER_1,
    status: "ACTIVE",
    studentCount: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    uuid: "cls-uuid-2",
    name: "Secondary - Grade 7A",
    code: "G7-A",
    gradeLevel: "7",
    program: "Secondary",
    section: "A",
    room: "Room 202",
    shift: ShiftEnum.AFTERNOON,
    startTime: "13:30",
    endTime: "17:30",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
    monthlyFee: 90.0,
    academicYear: "2025-2026",
    semester: SemesterEnum.SEMESTER_1,
    status: "ACTIVE",
    studentCount: 24,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ClassListTable", () => {
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

  it("renders search bar, filter dropdowns, create class button, and class rows with student counts", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockClasses,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<ClassListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search class, code, room/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create class/i })).toBeInTheDocument();

    // Verify rendered class names and student count badges
    expect(await screen.findByText(/primary - grade 1a/i)).toBeInTheDocument();
    expect(screen.getByText(/secondary - grade 7a/i)).toBeInTheDocument();
    expect(screen.getByText(/18 students/i)).toBeInTheDocument();
    expect(screen.getByText(/24 students/i)).toBeInTheDocument();
  });

  it("triggers search and updates fetch parameters when user types", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockClasses[0]],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPage: 1 },
      },
    } as any);

    render(<ClassListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search class, code, room/i);
    await user.type(searchInput, "Grade 1A");

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=Grade"),
        expect.anything()
      );
    });
  });

  it("opens Create Class dialog on button click", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockClasses,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<ClassListTable />, { wrapper: createWrapper() });

    const createBtn = screen.getByRole("button", { name: /create class/i });
    await user.click(createBtn);

    expect(screen.getByRole("heading", { name: /create new academic class/i })).toBeInTheDocument();
  });

  it("opens Promote Class dialog when clicking the promote row action", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url.includes("/students")) {
        return {
          data: {
            status: 200,
            message: "success",
            data: [
              {
                id: 101,
                studentId: 1,
                classId: 1,
                status: "ENROLLED",
                isPrimary: true,
                student: {
                  id: 1,
                  studentCode: "STU-001",
                  firstName: "Dara",
                  lastName: "Sok",
                  gender: "MALE",
                },
              },
            ],
          },
        } as any;
      }
      return {
        data: {
          status: 200,
          message: "success",
          data: mockClasses,
          pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
        },
      } as any;
    });

    render(<ClassListTable />, { wrapper: createWrapper() });

    const promoteButtons = await screen.findAllByTitle(/promote class/i);
    expect(promoteButtons.length).toBeGreaterThan(0);
    await user.click(promoteButtons[0]!);

    expect(await screen.findByRole("heading", { name: /promote class & cohort/i })).toBeInTheDocument();
    expect(screen.getAllByText(/primary - grade 1a/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/target next class/i)).toBeInTheDocument();
  });
});
