import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { RoleListTable } from "./role-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { UserTypeEnum, type RoleDto } from "@repo/contracts";
import { useAuthStore } from "@/features/auth";

const mockRoles: RoleDto[] = [
  {
    id: 1,
    uuid: "role-1",
    name: "System Administrator",
    slug: "admin",
    description: "Full system superuser access",
    permissions: [{ id: 1, resource: "all", action: "manage" }],
  },
  {
    id: 2,
    uuid: "role-2",
    name: "Teacher",
    slug: "teacher",
    description: "Academic classroom manager",
    permissions: [
      { id: 2, resource: "academic", action: "read" },
      { id: 3, resource: "attendance", action: "read" },
    ],
  },
];

function createWrapper(initialEntries: string[] = ["/users/roles"]) {
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

describe("RoleListTable", () => {
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
      isAuthenticated: true,
    });
  });

  it("renders search bar, add role button, table headers, and role rows", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockRoles,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<RoleListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search roles\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add role/i })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^id/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^role name & slug/i })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Assigned Permissions")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Verify mock roles rendered
    expect(await screen.findByText("System Administrator")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument(); // System badge on admin
  });

  it("triggers search and passes search query parameter", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockRoles[1]],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<RoleListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search roles\.\.\./i);
    await user.type(searchInput, "teacher");

    await waitFor(
      () => {
        expect(getSpy).toHaveBeenCalledWith(
          expect.stringContaining("search=teacher"),
          expect.anything()
        );
      },
      { timeout: 2000 }
    );
  });

  it("opens Add Role dialog when clicking Add Role button", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockRoles,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<RoleListTable />, { wrapper: createWrapper() });

    const addRoleBtn = screen.getByRole("button", { name: /add role/i });
    await user.click(addRoleBtn);

    expect(screen.getByRole("heading", { name: /create new role/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
  });

  it("does not render delete button for system admin role", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockRoles,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<RoleListTable />, { wrapper: createWrapper() });

    expect(await screen.findByText("System Administrator")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete System Administrator" })).not.toBeInTheDocument();

    const deleteTeacherBtn = screen.getByRole("button", { name: "Delete Teacher" });
    expect(deleteTeacherBtn).toBeInTheDocument();
  });

  it("disables Add, Edit, and Delete buttons when user lacks permissions", async () => {
    useAuthStore.setState({
      user: {
        id: 2,
        username: "readonly_user",
        userType: UserTypeEnum.CUSTOMER,
        roles: ["customer"],
        permissions: [{ resource: "role", action: "read" }],
      },
      isAuthenticated: true,
    });

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockRoles[1]],
        pagination: { page: 1, pageSize: 20, totalCount: 1, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<RoleListTable />, { wrapper: createWrapper() });

    expect(await screen.findByText("Teacher")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add role/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit Teacher" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete Teacher" })).toBeDisabled();
  });
});
