import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./admin-layout";
import { useAuthStore } from "@/features/auth";

function createWrapper(initialEntries = ["/dashboard"]) {
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

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: { id: 1, username: "admin", userType: "ADMIN" },
      token: "test-token",
      refreshToken: "test-refresh-token",
      isAuthenticated: true,
    });
  });

  it("renders D1 header logo, CMS_ADMIN badge, and user session", () => {
    render(<AdminLayout><div>Child Content</div></AdminLayout>, { wrapper: createWrapper() });

    expect(screen.getByText("D1")).toBeInTheDocument();
    expect(screen.getByText("CMS_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("Open Orders")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders sidebar navigation items", () => {
    render(<AdminLayout><div>Layout Content</div></AdminLayout>, { wrapper: createWrapper() });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Customer Orders")).toBeInTheDocument();
    expect(screen.getByText("User List")).toBeInTheDocument();
    expect(screen.getByText("Store Managements")).toBeInTheDocument();
    expect(screen.getByText("System Management")).toBeInTheDocument();
  });

  it("allows expanding and collapsing sidebar navigation sections", async () => {
    const user = userEvent.setup();
    render(<AdminLayout><div>Content</div></AdminLayout>, { wrapper: createWrapper() });

    const promoButton = screen.getByRole("button", { name: /promo and campaign/i });
    expect(screen.queryByText("Campaign List")).not.toBeInTheDocument();

    await user.click(promoButton);
    expect(screen.getByText("Campaign List")).toBeInTheDocument();
    expect(screen.getByText("Promotions")).toBeInTheDocument();
  });

  it("renders nested route content via Outlet", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<div>Dashboard Outlet Content</div>} />
              <Route path="/users" element={<div>Users Outlet Content</div>} />
            </Route>
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard Outlet Content")).toBeInTheDocument();
  });
});
