import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TeacherGenderEnum,
  TeacherStatusEnum,
  UserTypeEnum,
  UserStatusEnum,
  type TeacherAttribute,
} from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { TeacherListTable } from "./teacher-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth";

function createWrapper(initialEntries: string[] = ["/teachers"]) {
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

const mockTeachers: TeacherAttribute[] = [
  {
    id: 1,
    uuid: "tch-uuid-1",
    name: "John Sok",
    nameKm: "សុខ ចន",
    teacherCode: "TCH-0001",
    gender: TeacherGenderEnum.MALE,
    dateOfBirth: "1988-04-15",
    phone: "012345678",
    email: "john@school.edu.kh",
    salaryInHour: 15.0,
    specialization: "Mathematics & Primary",
    status: TeacherStatusEnum.ACTIVE,
    classCount: 2,
    classes: [
      { id: 10, uuid: "cls-10", name: "Primary Grade 1A", studentCount: 18 },
      { id: 11, uuid: "cls-11", name: "Primary Grade 2B", studentCount: 20 },
    ],
    user: {
      id: 101,
      uuid: "usr-101",
      username: "teacher_john",
      userType: UserTypeEnum.CMS,
      status: UserStatusEnum.ACTIVE,
      computedNameId: "user-101",
      password: "",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    uuid: "tch-uuid-2",
    name: "Sreymom Chan",
    nameKm: "ចាន់ ស្រីមុំ",
    teacherCode: "TCH-0002",
    gender: TeacherGenderEnum.FEMALE,
    dateOfBirth: "1992-08-22",
    phone: "098765432",
    email: "sreymom@school.edu.kh",
    salaryInHour: 18.5,
    specialization: "English & GEP",
    status: TeacherStatusEnum.ACTIVE,
    classCount: 1,
    classes: [{ id: 12, uuid: "cls-12", name: "GEP Level 3", studentCount: 15 }],
    user: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("TeacherListTable", () => {
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

  it("renders search input, filter controls, Add Teacher button, and teacher directory rows", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockTeachers,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<TeacherListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search by name, code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add teacher/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Sok")).toBeInTheDocument();
      expect(screen.getByText("Sreymom Chan")).toBeInTheDocument();
      expect(screen.getByText("$15.00")).toBeInTheDocument();
      expect(screen.getByText("$18.50")).toBeInTheDocument();
      expect(screen.getByText("2 Classes")).toBeInTheDocument();
      expect(screen.getByText("teacher_john")).toBeInTheDocument();
      expect(screen.getByText("No Login")).toBeInTheDocument();
    });
  });

  it("opens create teacher modal when clicking Add Teacher", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [],
        pagination: { page: 1, pageSize: 20, totalCount: 0, totalPage: 0 },
      },
    } as any);

    const user = userEvent.setup();
    render(<TeacherListTable />, { wrapper: createWrapper() });

    const addBtn = screen.getByRole("button", { name: /add teacher/i });
    await user.click(addBtn);

    expect(screen.getByRole("heading", { name: /add new teacher/i })).toBeInTheDocument();
  });

  it("opens teacher detail dialog when clicking teacher name", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/api/v1/admin/teachers/1")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockTeachers[0],
          },
        } as any);
      }
      return Promise.resolve({
        data: {
          status: 200,
          message: "success",
          data: mockTeachers,
          pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
        },
      } as any);
    });

    const user = userEvent.setup();
    render(<TeacherListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("John Sok")).toBeInTheDocument();
    });

    await user.click(screen.getByText("John Sok"));

    await waitFor(() => {
      expect(screen.getByText("Primary Grade 1A")).toBeInTheDocument();
      expect(screen.getByText("18 Students")).toBeInTheDocument();
    });
  });
});
