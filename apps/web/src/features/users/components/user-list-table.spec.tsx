import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchStatusEnum, UserStatusEnum, UserTypeEnum, type BranchDto, type UserAttribute } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { UserListTable } from "./user-list-table";
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

const mockBranches: BranchDto[] = [
  {
    id: 1,
    uuid: "11111111-1111-1111-1111-111111111111",
    name: "Main Campus",
    code: "MAIN",
    isDefault: true,
    status: BranchStatusEnum.ACTIVE,
  },
  {
    id: 2,
    uuid: "22222222-2222-2222-2222-222222222222",
    name: "South Campus",
    code: "SOUTH",
    isDefault: false,
    status: BranchStatusEnum.ACTIVE,
  },
];

const mockUsers: UserAttribute[] = [
  {
    id: 1,
    uuid: "uuid-1",
    username: "alice_admin",
    password: "",
    userType: UserTypeEnum.ADMIN,
    status: UserStatusEnum.ACTIVE,
    branchId: 1,
    branch: mockBranches[0],
    computedNameId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T10:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 2,
    uuid: "uuid-2",
    username: "bob_editor",
    password: "",
    userType: UserTypeEnum.CMS,
    status: UserStatusEnum.ACTIVE,
    branchId: 2,
    branch: mockBranches[1],
    computedNameId: "user-2",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T12:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 3,
    uuid: "uuid-3",
    username: "charlie_customer",
    password: "",
    userType: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.INACTIVE,
    branchId: null,
    branch: null,
    computedNameId: "user-3",
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T14:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 4,
    uuid: "uuid-4",
    username: "deleted_user",
    password: "",
    userType: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.ACTIVE,
    branchId: null,
    branch: null,
    computedNameId: "user-4",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-08T16:00:00.000Z"),
    deletedAt: new Date("2026-01-09T00:00:00.000Z"),
  },
];

describe("UserListTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        userType: UserTypeEnum.SUPER_ADMIN,
        roles: ["super_admin"],
        permissions: [{ resource: "all", action: "manage" }],
      },
      isAuthenticated: true,
    });
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url.includes("/branches")) {
        return Promise.resolve({
          data: {
            status: 200,
            message: "success",
            data: mockBranches,
          },
        } as unknown as import("axios").AxiosResponse);
      }
      return Promise.resolve({
        data: {
          status: 200,
          message: "success",
          data: mockUsers,
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: mockUsers.length,
            totalPage: 1,
          },
        },
      } as unknown as import("axios").AxiosResponse);
    });
  });

  it("renders search bar, role and branch filters, action buttons, pagination, and user rows with branch details", async () => {
    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search user name\.\.\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by user role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();

    expect(screen.getByText("Avatar")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^username/i })).toBeInTheDocument();
    expect(screen.getByText("Branch / Campus")).toBeInTheDocument();
    expect(screen.getByText("User Type")).toBeInTheDocument();
    expect(screen.getByText("Roles")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /updated at/i })).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Verify mock users rendered with their branches
    expect(await screen.findByText("alice_admin")).toBeInTheDocument();
    expect(screen.getByText("Main Campus")).toBeInTheDocument();
    expect(screen.getByText("Code: MAIN")).toBeInTheDocument();

    expect(screen.getByText("bob_editor")).toBeInTheDocument();
    expect(screen.getByText("South Campus")).toBeInTheDocument();
    expect(screen.getByText("Code: SOUTH")).toBeInTheDocument();

    expect(screen.getByText("charlie_customer")).toBeInTheDocument();
    expect(screen.getAllByText("Global / All Campuses")[0]).toBeInTheDocument();
  });

  it("triggers search and updates fetch parameters when typing", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get");

    render(<UserListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search user name\.\.\./i);
    await user.type(searchInput, "alice");

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=alice"),
        expect.anything()
      );
    });
  });

  it("changes role filter and queries with userType", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get");

    render(<UserListTable />, { wrapper: createWrapper() });

    const roleSelect = screen.getByLabelText(/filter by user role/i);
    await user.selectOptions(roleSelect, UserTypeEnum.ADMIN);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("userType=ADMIN"),
        expect.anything()
      );
    });
  });

  it("changes branch filter and queries with branchId", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get");

    render(<UserListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /main campus/i })).toBeInTheDocument();
    });

    const branchSelect = screen.getByLabelText(/filter by branch/i);
    await user.selectOptions(branchSelect, "1");

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("branchId=1"),
        expect.anything()
      );
    });
  });

  it("toggles sorting when clicking Username and Updated At headers", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockUsers,
        pagination: { page: 1, pageSize: 10, totalCount: 4, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<UserListTable />, { wrapper: createWrapper() });

    const usernameSortBtn = screen.getByRole("button", { name: /^username/i });
    await user.click(usernameSortBtn);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=username"),
        expect.anything()
      );
    });
  });

  it("opens Add User dialog and creates user on form submission", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockUsers,
        pagination: { page: 1, pageSize: 10, totalCount: 4, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 201,
        message: "success",
        data: {
          id: 5,
          username: "new_created_user",
          userType: UserTypeEnum.CUSTOMER,
          status: UserStatusEnum.ACTIVE,
          computedNameId: "user-5",
        },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<UserListTable />, { wrapper: createWrapper() });

    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    await user.click(addUserBtn);

    expect(screen.getByRole("heading", { name: /create new user/i })).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/e\.g\. john_doe/i);
    const passwordInput = screen.getByPlaceholderText(/at least 6 characters/i);

    await user.type(usernameInput, "new_created_user");
    await user.type(passwordInput, "secret123");

    const submitBtn = screen.getByRole("button", { name: /create user/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/api/v1/admin/users",
        expect.objectContaining({
          username: "new_created_user",
        })
      );
    });
  });

  it("opens Delete User confirmation and soft-deletes user", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockUsers[0]],
        pagination: { page: 1, pageSize: 10, totalCount: 1, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: { id: 1, success: true },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<UserListTable />, { wrapper: createWrapper() });

    const deleteBtn = await screen.findByRole("button", { name: "Delete alice_admin" });
    await user.click(deleteBtn);

    expect(screen.getByRole("heading", { name: /delete user/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete user/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/api/v1/admin/users/1");
    });
  });

  it("disables Add, Edit, and Delete buttons when user lacks permissions", async () => {
    useAuthStore.setState({
      user: {
        id: 2,
        username: "readonly_user",
        userType: UserTypeEnum.CUSTOMER,
        roles: ["customer"],
        permissions: [{ resource: "user", action: "read" }],
      },
      isAuthenticated: true,
    });

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockUsers[0]],
        pagination: { page: 1, pageSize: 10, totalCount: 1, totalPage: 1 },
      },
    } as unknown as import("axios").AxiosResponse);

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(await screen.findByText("alice_admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add user/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit alice_admin" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete alice_admin" })).toBeDisabled();
  });

  it("hides branch filter dropdown for non-superadmin users", async () => {
    useAuthStore.setState({
      user: {
        id: 3,
        username: "branch_admin",
        userType: UserTypeEnum.ADMIN,
        branchId: 1,
        roles: ["admin"],
        permissions: [{ resource: "all", action: "manage" }],
      },
      isAuthenticated: true,
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.queryByLabelText(/filter by branch/i)).not.toBeInTheDocument();
  });
});
