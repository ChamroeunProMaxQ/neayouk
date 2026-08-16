import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserStatusEnum, UserTypeEnum, type RoleDto } from "@repo/contracts";
import { UserForm } from "./user-form";
import { apiClient } from "@/shared/lib/api-client";

const mockRoles: RoleDto[] = [
  { id: 1, name: "Teacher", slug: "teacher", permissions: [] },
  { id: 2, name: "Staff", slug: "staff", permissions: [] },
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
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockRoles,
      },
    } as unknown as import("axios").AxiosResponse);
  });

  it("renders form fields with default values for create mode", () => {
    render(<UserForm onSubmit={vi.fn()} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/username/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password/i)).toHaveValue("");
    expect(screen.getByLabelText(/user type \(portal\)/i)).toHaveValue(UserTypeEnum.CUSTOMER);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.ACTIVE);
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
  });

  it("populates fields when userToEdit is provided", () => {
    const userToEdit = {
      id: 1,
      uuid: "uuid-1",
      username: "john_doe",
      password: "",
      userType: UserTypeEnum.ADMIN,
      status: UserStatusEnum.INACTIVE,
      roles: ["teacher"],
      computedNameId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    render(<UserForm onSubmit={vi.fn()} userToEdit={userToEdit} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/username/i)).toHaveValue("john_doe");
    expect(screen.getByLabelText(/user type \(portal\)/i)).toHaveValue(UserTypeEnum.ADMIN);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.INACTIVE);
    expect(screen.getByRole("button", { name: /update user/i })).toBeInTheDocument();
  });

  it("submits valid form data including selected dynamic roles", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<UserForm onSubmit={handleSubmit} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/username/i), "new_user");
    await user.type(screen.getByLabelText(/^password/i), "securepass");
    await user.selectOptions(screen.getByLabelText(/user type \(portal\)/i), UserTypeEnum.CMS);

    const teacherRoleBtn = await screen.findByRole("button", { name: "Teacher" });
    await user.click(teacherRoleBtn);

    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "new_user",
          password: "securepass",
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
});
