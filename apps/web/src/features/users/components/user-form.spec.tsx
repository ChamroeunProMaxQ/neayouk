import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchStatusEnum, UserStatusEnum, UserTypeEnum, type BranchDto, type RoleDto } from "@repo/contracts";
import { UserForm } from "./user-form";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

const mockRoles: RoleDto[] = [
  { id: 1, name: "Teacher", slug: "teacher", permissions: [] },
  { id: 2, name: "Staff", slug: "staff", permissions: [] },
];

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("UserForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().setUser({
      id: 1,
      username: "superadmin",
      userType: UserTypeEnum.SUPER_ADMIN,
      roles: ["super_admin"],
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
          data: mockRoles,
        },
      } as unknown as import("axios").AxiosResponse);
    });
  });

  it("renders form fields with default values for create mode", () => {
    render(<UserForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/username/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password/i)).toHaveValue("");
    expect(screen.getByLabelText(/branch \/ campus/i)).toHaveValue("");
    expect(screen.getByLabelText(/user type \(portal\)/i)).toHaveValue(UserTypeEnum.CUSTOMER);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.ACTIVE);
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
  });

  it("populates fields when userToEdit is provided", async () => {
    const userToEdit = {
      id: 1,
      uuid: "uuid-1",
      username: "john_doe",
      password: "",
      userType: UserTypeEnum.ADMIN,
      status: UserStatusEnum.INACTIVE,
      branchId: 2,
      roles: ["teacher"],
      computedNameId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    render(<UserForm onSubmit={vi.fn()} userToEdit={userToEdit} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /south campus/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/username/i)).toHaveValue("john_doe");
    expect(screen.getByLabelText(/branch \/ campus/i)).toHaveValue("2");
    expect(screen.getByLabelText(/user type \(portal\)/i)).toHaveValue(UserTypeEnum.ADMIN);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.INACTIVE);
    expect(screen.getByRole("button", { name: /update user/i })).toBeInTheDocument();
  });

  it("submits valid form data including selected dynamic roles and assigned branch", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<UserForm onSubmit={handleSubmit} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /main campus/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/username/i), "new_user");
    await user.type(screen.getByLabelText(/^password/i), "securepass");
    await user.selectOptions(screen.getByLabelText(/branch \/ campus/i), "1");
    await user.selectOptions(screen.getByLabelText(/user type \(portal\)/i), UserTypeEnum.CMS);

    const teacherRoleBtn = await screen.findByRole("button", { name: "Teacher" });
    await user.click(teacherRoleBtn);

    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "new_user",
          password: "securepass",
          branchId: 1,
          userType: UserTypeEnum.CMS,
          status: UserStatusEnum.ACTIVE,
          roles: ["teacher"],
        })
      );
    });
  });

  it("cancels form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();

    render(<UserForm onSubmit={vi.fn()} onCancel={handleCancel} />, { wrapper: createWrapper() });

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalled();
  });

  it("auto-assigns branch when created by non-superadmin user", async () => {
    useAuthStore.getState().setUser({
      id: 2,
      username: "branch_admin",
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
      roles: ["admin"],
    });

    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<UserForm onSubmit={handleSubmit} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Main Campus")).toBeInTheDocument();
    });
    expect(screen.getByText(/auto-assigned/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/username/i), "campus_teacher");
    await user.type(screen.getByLabelText(/^password/i), "securepass");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "campus_teacher",
          branchId: 1,
        })
      );
    });
  });
});
