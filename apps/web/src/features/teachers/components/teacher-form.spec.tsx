import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserTypeEnum } from "@repo/contracts";
import { TeacherFormDialog } from "./teacher-form-dialog";
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("TeacherFormDialog", () => {
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

  it("submits create teacher payload with personal & salary fields", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 201,
        message: "success",
        data: { id: 1, name: "Alice Smith", salaryInHour: 20 },
      },
    });

    const user = userEvent.setup();
    render(<TeacherFormDialog open={true} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    const nameInput = screen.getByPlaceholderText("e.g. Sok John");
    await user.type(nameInput, "Alice Smith");

    // Click employment tab
    const empTab = screen.getByRole("button", { name: /2\. Academic & Salary/i });
    await user.click(empTab);

    const salaryInput = screen.getByPlaceholderText("0.00");
    await user.clear(salaryInput);
    await user.type(salaryInput, "20");

    const submitBtn = screen.getByRole("button", { name: /create teacher/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/admin/teachers"),
        expect.objectContaining({
          name: "Alice Smith",
          salaryInHour: 20,
        })
      );
    });
  });
});
