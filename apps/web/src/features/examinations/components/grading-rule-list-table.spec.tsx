import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserTypeEnum, DefaultGradingComponents, DefaultGradeScale } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { GradingRuleListTable } from "./grading-rule-list-table";
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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

const mockRules = [
  {
    id: 1,
    name: "Standard Evaluation Scheme",
    code: "RULE-DEFAULT",
    academicYear: "2025-2026",
    semester: "SEMESTER_1",
    isDefault: true,
    status: "ACTIVE",
    components: DefaultGradingComponents,
    gradeScale: DefaultGradeScale,
  },
];

describe("GradingRuleListTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 1,
        username: "admin",
        userType: UserTypeEnum.ADMIN,
        permissions: [],
      },
      token: "mock-token",
    });

    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url.includes("/api/v1/admin/examinations/rules")) {
        return Promise.resolve({
          data: {
            data: {
              data: mockRules,
              pagination: { page: 1, pageSize: 50, totalCount: 1, totalPages: 1 },
            },
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });
  });

  it("renders rule details and disables 'New Grading Scheme' button when a rule is already set", async () => {
    render(<GradingRuleListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Standard Evaluation Scheme")).toBeInTheDocument();
    });

    expect(screen.getByText("RULE-DEFAULT")).toBeInTheDocument();
    expect(screen.getByText("Default System Rule")).toBeInTheDocument();

    // Verify New Grading Scheme button is disabled because rule is already configured
    const newButton = screen.getByRole("button", { name: /new grading scheme/i });
    expect(newButton).toBeDisabled();

    // Verify Edit button is enabled
    const editButton = screen.getByTitle("Edit Scheme");
    expect(editButton).toBeEnabled();

    // Click Edit button and verify dialog opens
    await userEvent.click(editButton);
    expect(screen.getByText("Edit Grading Scheme")).toBeInTheDocument();
  });
});
