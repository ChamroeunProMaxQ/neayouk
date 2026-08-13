import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { AdminLayout } from "./admin-layout";
import { useAuthStore } from "@/features/auth";

describe("AdminLayout", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, username: "admin", userType: "ADMIN" },
      token: "test-token",
      refreshToken: "test-refresh-token",
      isAuthenticated: true,
    });
  });

  it("renders D1 header logo, CMS_ADMIN badge, and user session", () => {
    render(<AdminLayout />);

    expect(screen.getByText("D1")).toBeInTheDocument();
    expect(screen.getByText("CMS_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("Open Orders")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders sidebar navigation items and sets Customer List as active tab", () => {
    render(<AdminLayout />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Customer Orders")).toBeInTheDocument();
    expect(screen.getByText("Customer List")).toBeInTheDocument();
    expect(screen.getByText("Store Managements")).toBeInTheDocument();
    expect(screen.getByText("System Management")).toBeInTheDocument();

    // Table header proves Customer List view is rendered
    expect(screen.getByText("Upload Bulk Users")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search\.\.\./i)).toBeInTheDocument();
  });

  it("allows expanding and collapsing sidebar navigation sections", async () => {
    const user = userEvent.setup();
    render(<AdminLayout />);

    const promoButton = screen.getByRole("button", { name: /promo and campaign/i });
    expect(screen.queryByText("Campaign List")).not.toBeInTheDocument();

    await user.click(promoButton);
    expect(screen.getByText("Campaign List")).toBeInTheDocument();
    expect(screen.getByText("Promotions")).toBeInTheDocument();
  });

  it("switches view when clicking a different navigation item", async () => {
    const user = userEvent.setup();
    render(<AdminLayout />);

    const dashboardButton = screen.getByRole("button", { name: /dashboard/i });
    await user.click(dashboardButton);

    expect(screen.getByText(/dashboard view/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to customer list/i })).toBeInTheDocument();
  });
});
