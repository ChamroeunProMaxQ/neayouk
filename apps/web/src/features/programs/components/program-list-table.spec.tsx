import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ProgramAttribute } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { ProgramListTable } from "./program-list-table";
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

const mockPrograms: ProgramAttribute[] = [
  {
    id: 1,
    uuid: "prog-uuid-1",
    name: "Primary Education",
    code: "PRI",
    books: ["Oxford Discover"],
    gradeLevels: ["1", "2", "3", "4", "5", "6"],
    status: "ACTIVE",
    classCount: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    uuid: "prog-uuid-2",
    name: "General English Program",
    code: "GEP",
    books: ["Solutions"],
    gradeLevels: ["1", "2", "3"],
    status: "ACTIVE",
    classCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ProgramListTable", () => {
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

  it("renders search bar, status dropdown, create program button, and program rows with grade levels", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockPrograms,
        pagination: { page: 1, pageSize: 50, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<ProgramListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search program, code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create program/i })).toBeInTheDocument();

    // Verify program names and codes
    expect(await screen.findByText(/primary education/i)).toBeInTheDocument();
    expect(screen.getByText(/general english program/i)).toBeInTheDocument();
    expect(screen.getAllByText("PRI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("GEP").length).toBeGreaterThanOrEqual(1);

    // Verify books and grade level badges
    expect(screen.getByText("Oxford Discover")).toBeInTheDocument();
    expect(screen.getByText("Solutions")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("triggers search and updates fetch parameters when user types", async () => {
    const user = userEvent.setup();
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [mockPrograms[0]],
        pagination: { page: 1, pageSize: 50, totalCount: 1, totalPage: 1 },
      },
    } as any);

    render(<ProgramListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search program, code/i);
    await user.type(searchInput, "Primary");

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=Primary")
      );
    });
  });

  it("opens Create Program dialog on button click", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: mockPrograms,
        pagination: { page: 1, pageSize: 50, totalCount: 2, totalPage: 1 },
      },
    } as any);

    render(<ProgramListTable />, { wrapper: createWrapper() });

    const createBtn = screen.getByRole("button", { name: /create program/i });
    await user.click(createBtn);

    expect(screen.getByRole("heading", { name: /create academic program/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/program name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/program code/i)).toBeInTheDocument();
  });
});
