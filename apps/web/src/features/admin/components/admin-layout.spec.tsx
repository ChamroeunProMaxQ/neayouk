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

  it("renders Neayouk header logo, CMS_ADMIN badge, and user session", () => {
    render(<AdminLayout><div>Child Content</div></AdminLayout>, { wrapper: createWrapper() });

    expect(screen.getByText("Neayouk")).toBeInTheDocument();
    expect(screen.getByText("CMS_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders sidebar navigation items", () => {
    render(<AdminLayout><div>Layout Content</div></AdminLayout>, { wrapper: createWrapper() });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByText("Academic Management")).toBeInTheDocument();
    expect(screen.getByText("School Operations")).toBeInTheDocument();
    expect(screen.getByText("System Management")).toBeInTheDocument();
  });

  it("allows expanding and collapsing sidebar navigation sections", async () => {
    const user = userEvent.setup();
    render(<AdminLayout><div>Content</div></AdminLayout>, { wrapper: createWrapper() });

    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    expect(screen.queryByText("Academic Years & Terms")).not.toBeInTheDocument();

    await user.click(academicsButton);
    expect(screen.getByText("Academic Years & Terms")).toBeInTheDocument();
    expect(screen.getByText("Classes & Sections")).toBeInTheDocument();
    expect(screen.getByText("Subjects & Courses")).toBeInTheDocument();
    expect(screen.getByText("Class Timetable")).toBeInTheDocument();
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

  it("navigates to sub-route when a sub-item is clicked", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<div>Dashboard Page</div>} />
              <Route path="/users" element={<div>Users Main Page</div>} />
              <Route path="/users/students" element={<div>Students Dummy Page</div>} />
            </Route>
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );

    const userMgmtButton = screen.getByRole("button", { name: /user management/i });
    await user.click(userMgmtButton);

    const studentsButton = screen.getByRole("button", { name: /students/i });
    await user.click(studentsButton);

    expect(screen.getByText("Students Dummy Page")).toBeInTheDocument();
  });
});
