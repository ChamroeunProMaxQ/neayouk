import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserTypeEnum, DefaultGradingComponents, DefaultGradeScale } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { GradebookMatrix } from "./gradebook-matrix";
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

const mockClasses = [
  { id: 1, name: "Primary - Grade 1A", code: "G1-A", gradeLevel: "1", status: "ACTIVE" },
];

const mockMatrixData = {
  classId: 1,
  className: "Primary - Grade 1A",
  classCode: "G1-A",
  gradeLevel: "1",
  month: "2026-08",
  academicYear: "2025-2026",
  semester: "SEMESTER_1",
  gradingRule: {
    id: 1,
    uuid: "rule-1",
    name: "Standard Scheme",
    code: "RULE-DEFAULT",
    components: DefaultGradingComponents,
    gradeScale: DefaultGradeScale,
    isDefault: true,
    status: "ACTIVE",
  },
  rows: [
    {
      studentId: 101,
      studentCode: "STU-001",
      firstName: "Sokha",
      lastName: "Chan",
      firstNameKm: "សុខា",
      lastNameKm: "ចាន់",
      gender: "FEMALE",
      scores: {
        reading: 9,
        vocab: 27,
        grammar: 18,
        listening: 18,
        speaking: 9,
        homework: 9,
      },
      totalRawScore: 90,
      totalWeightedScore: 90,
      percentage: 90,
      gradeLetter: "A",
      rank: 1,
      feedback: "Great work",
    },
  ],
  classStats: {
    totalStudents: 1,
    gradedCount: 1,
    averageScore: 90,
    highestScore: 90,
    lowestScore: 90,
    passCount: 1,
    failCount: 0,
    passRate: 100,
    gradeDistribution: { A: 1 },
  },
};

describe("GradebookMatrix", () => {
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
      if (url.includes("/api/v1/admin/classes")) {
        return Promise.resolve({
          data: {
            data: mockClasses,
            pagination: { page: 1, pageSize: 100, totalCount: 1, totalPages: 1 },
          },
        });
      }
      if (url.includes("/api/v1/admin/examinations/matrix")) {
        return Promise.resolve({
          data: {
            data: mockMatrixData,
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        data: mockMatrixData,
      },
    });
  });

  it("renders student roster, component score columns, and calculated totals", async () => {
    render(<GradebookMatrix />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Chan Sokha")).toBeInTheDocument();
    });

    // Check component columns header
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();

    // Check student score cell
    expect(screen.getAllByDisplayValue("9").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("27")).toBeInTheDocument();

    // Check calculated summary
    expect(screen.getByText("90.0%")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("updates scores when user types in cell and enables save action", async () => {
    render(<GradebookMatrix />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Chan Sokha")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("spinbutton");
    const readingInput = inputs[0]!;

    // Change reading score from 9 to 10
    fireEvent.change(readingInput, { target: { value: "10" } });

    // Verify unsaved indicator appears
    await waitFor(() => {
      expect(screen.getByText(/unsaved student score changes/i)).toBeInTheDocument();
    });

    // Click Save Changes
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/v1/admin/examinations/matrix/save",
      expect.objectContaining({
        classId: 1,
        month: expect.any(String),
      })
    );
  });

  it("disables the save button and shows warning when input score exceeds max points", async () => {
    render(<GradebookMatrix />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Chan Sokha")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("spinbutton");
    const readingInput = inputs[0]!;

    // Max score for reading is 10. Enter 15 (exceeds max)
    fireEvent.change(readingInput, { target: { value: "15" } });

    // Verify warning badge appears
    await waitFor(() => {
      expect(screen.getByText(/scores exceed maximum allowed limit/i)).toBeInTheDocument();
    });

    // Verify Save Changes button is disabled
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    // Now change it back to valid score 8
    fireEvent.change(readingInput, { target: { value: "8" } });

    // Save Changes should be enabled again
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });
});
