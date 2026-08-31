import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminSidebar } from "./admin-sidebar";
import { useAuthStore } from "@/features/auth";
import { UserTypeEnum } from "@repo/contracts";

function renderSidebar(initialEntries = ["/dashboard"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AdminSidebar />
    </MemoryRouter>
  );
}

describe("AdminSidebar RBAC", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("enables all navigation items for SUPER_ADMIN platform user", async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: "superadmin",
        userType: UserTypeEnum.SUPER_ADMIN,
        roles: ["super_admin"],
        permissions: [],
      },
      isAuthenticated: true,
    });

    renderSidebar();

    const userMgmtButton = screen.getByRole("button", { name: /user management/i });
    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    const hrButton = screen.getByRole("button", { name: /hr & payroll/i });

    expect(userMgmtButton).not.toBeDisabled();
    expect(academicsButton).not.toBeDisabled();
    expect(hrButton).not.toBeDisabled();
  });

  it("enables all navigation items for ADMIN superuser", async () => {
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

    renderSidebar();

    const userMgmtButton = screen.getByRole("button", { name: /user management/i });
    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    const hrButton = screen.getByRole("button", { name: /hr & payroll/i });

    expect(userMgmtButton).not.toBeDisabled();
    expect(academicsButton).not.toBeDisabled();
    expect(hrButton).not.toBeDisabled();
  });

  it("enables permitted items and disables unauthorized items for a teacher user", async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: {
        id: 2,
        username: "teacher_jane",
        userType: UserTypeEnum.CMS,
        roles: ["teacher"],
        permissions: [
          { resource: "dashboard", action: "read" },
          { resource: "academic", action: "read" },
          { resource: "attendance", action: "read" },
        ],
      },
      isAuthenticated: true,
    });

    renderSidebar();

    // Permitted items
    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    const attendanceButton = screen.getByRole("button", { name: /attendance/i });
    expect(academicsButton).not.toBeDisabled();
    expect(attendanceButton).not.toBeDisabled();

    // Unauthorized items
    const hrButton = screen.getByRole("button", { name: /hr & payroll/i });
    const feeButton = screen.getByRole("button", { name: /fee & billing/i });
    const settingsButton = screen.getByRole("button", { name: /settings/i });

    expect(hrButton).toBeDisabled();
    expect(feeButton).toBeDisabled();
    expect(settingsButton).toBeDisabled();

    // Clicking disabled button should not open collapsible content
    await user.click(hrButton);
    expect(screen.queryByText("Staff Directory")).not.toBeInTheDocument();

    // Clicking permitted button should open collapsible content
    await user.click(academicsButton);
    expect(screen.getByText("Academic Years & Terms")).toBeInTheDocument();
  });

  it("disables administrative items for a regular customer/portal user", async () => {
    useAuthStore.setState({
      user: {
        id: 3,
        username: "customer_bob",
        userType: UserTypeEnum.CUSTOMER,
        roles: ["customer"],
        permissions: [],
      },
      isAuthenticated: true,
    });

    renderSidebar();

    const userMgmtButton = screen.getByRole("button", { name: /user management/i });
    const hrButton = screen.getByRole("button", { name: /hr & payroll/i });

    expect(userMgmtButton).toBeDisabled();
    expect(hrButton).toBeDisabled();
  });

  it("collapses and expands section when clicking on an active collapsible header", async () => {
    const user = userEvent.setup();

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

    renderSidebar(["/academics/classes"]);

    // Auto-expanded because /academics/classes is the active path
    expect(screen.getByText("Classes & Cohorts")).toBeInTheDocument();
    expect(screen.getByText("Academic Years & Terms")).toBeInTheDocument();

    // Click to collapse
    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    await user.click(academicsButton);

    expect(screen.queryByText("Classes & Cohorts")).not.toBeInTheDocument();
    expect(screen.queryByText("Academic Years & Terms")).not.toBeInTheDocument();

    // Click again to re-expand
    await user.click(academicsButton);
    expect(screen.getByText("Classes & Cohorts")).toBeInTheDocument();
    expect(screen.getByText("Academic Years & Terms")).toBeInTheDocument();
  });

  it("enables only permitted subItems for granular attendance permissions", async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: {
        id: 5,
        username: "teacher_tom",
        userType: UserTypeEnum.CMS,
        roles: ["teacher"],
        permissions: [
          { resource: "student_attendance", action: "read" },
        ],
      },
      isAuthenticated: true,
    });

    renderSidebar();

    const attendanceButton = screen.getByRole("button", { name: /attendance/i });
    expect(attendanceButton).not.toBeDisabled();

    await user.click(attendanceButton);

    const studentSubItem = screen.getByRole("button", { name: /student attendance/i });
    const teacherSubItem = screen.getByRole("button", { name: /teacher attendance/i });
    const leaveSubItem = screen.getByRole("button", { name: /leave requests/i });

    expect(studentSubItem).not.toBeDisabled();
    expect(teacherSubItem).toBeDisabled();
    expect(leaveSubItem).toBeDisabled();
  });

  it("enables only permitted subItems for granular academic permissions", async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: {
        id: 6,
        username: "curriculum_officer",
        userType: UserTypeEnum.CMS,
        roles: ["officer"],
        permissions: [
          { resource: "program", action: "read" },
        ],
      },
      isAuthenticated: true,
    });

    renderSidebar();

    const academicsButton = screen.getByRole("button", { name: /academics & classes/i });
    expect(academicsButton).not.toBeDisabled();

    await user.click(academicsButton);

    const programsSubItem = screen.getByRole("button", { name: /programs & curriculum books/i });
    const classesSubItem = screen.getByRole("button", { name: /classes & cohorts/i });
    const academicYearsSubItem = screen.getByRole("button", { name: /academic years & terms/i });

    expect(programsSubItem).not.toBeDisabled();
    expect(classesSubItem).toBeDisabled();
    expect(academicYearsSubItem).toBeDisabled();
  });
});

