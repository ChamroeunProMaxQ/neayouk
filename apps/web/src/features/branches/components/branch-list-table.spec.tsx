import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { BranchStatusEnum, UserTypeEnum, type BranchDto } from "@repo/contracts";
import { BranchListTable } from "./branch-list-table";
import { apiClient } from "@/shared/lib/api-client";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

const mockBranches: BranchDto[] = [
  {
    id: 1,
    uuid: "11111111-1111-1111-1111-111111111111",
    name: "Main Campus",
    code: "MAIN",
    address: "Building 1, Main Road",
    phone: "+85512345678",
    email: "info@maincampus.edu",
    isDefault: true,
    status: BranchStatusEnum.ACTIVE,
  },
  {
    id: 2,
    uuid: "22222222-2222-2222-2222-222222222222",
    name: "South Campus",
    code: "SOUTH",
    address: "Building 2, South Road",
    phone: "+85587654321",
    email: "info@southcampus.edu",
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
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BranchListTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Provision Branch button and calls superadmin endpoint for SUPER_ADMIN", async () => {
    useAuthStore.getState().setUser({
      id: 1,
      username: "superadmin",
      userType: UserTypeEnum.SUPER_ADMIN,
      roles: ["super_admin"],
    });

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockBranches,
      },
    } as unknown as import("axios").AxiosResponse);

    render(<BranchListTable />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /provision branch/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Main Campus")).toBeInTheDocument();
      expect(screen.getByText("South Campus")).toBeInTheDocument();
    });

    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/superadmin/branches"),
      expect.any(Object)
    );
  });

  it("hides Provision Branch button and calls admin endpoint for Branch ADMIN", async () => {
    useAuthStore.getState().setUser({
      id: 2,
      username: "branch_admin",
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
      roles: ["admin"],
    });

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockBranches[0]],
      },
    } as unknown as import("axios").AxiosResponse);

    render(<BranchListTable />, { wrapper: createWrapper() });

    expect(screen.queryByRole("button", { name: /provision branch/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Main Campus")).toBeInTheDocument();
    });

    expect(screen.queryByText("South Campus")).not.toBeInTheDocument();

    expect(getSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/branches"),
      expect.any(Object)
    );
  });

  it("opens Edit Branch dialog when clicking Edit button", async () => {
    const user = userEvent.setup();

    useAuthStore.getState().setUser({
      id: 2,
      username: "branch_admin",
      userType: UserTypeEnum.ADMIN,
      branchId: 1,
      roles: ["admin"],
    });

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockBranches[0]],
      },
    } as unknown as import("axios").AxiosResponse);

    render(<BranchListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Main Campus")).toBeInTheDocument();
    });

    const editBtn = screen.getByRole("button", { name: /edit/i });
    await user.click(editBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /edit branch information/i })).toBeInTheDocument();
    });
  });
});
