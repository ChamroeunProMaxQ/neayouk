import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LeaveStatusEnum,
  LeaveTypeEnum,
  type LeaveRequestAttribute,
} from "@repo/contracts";
import { LeaveRequestFormDialog } from "./leave-request-form-dialog";
import { apiClient } from "@/shared/lib/api-client";

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

const mockLeaveRequest: LeaveRequestAttribute = {
  id: 1,
  uuid: "leave-uuid-1",
  teacherId: 1,
  teacherName: "Sok John",
  userId: 1,
  leaveType: LeaveTypeEnum.CASUAL,
  startDate: "2026-08-25",
  endDate: "2026-08-26",
  totalDays: 2.0,
  reason: "Family personal matters",
  attachmentUrl: null,
  status: LeaveStatusEnum.PENDING,
  reviewerId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("LeaveRequestFormDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: [
          { id: 1, name: "Sok John", teacherCode: "TCH-001" },
          { id: 2, name: "Dara Chan", teacherCode: "TCH-002" },
        ],
      },
    } as never);
  });

  it("renders the dialog with required form fields in create mode", () => {
    render(
      <LeaveRequestFormDialog
        open={true}
        onOpenChange={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Submit Leave Application")).toBeInTheDocument();
    expect(screen.getByLabelText(/instructor \/ teacher/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/leave category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(days\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason \/ justification/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit application/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting with empty reason instead of silently doing nothing", async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(apiClient, "post");

    render(
      <LeaveRequestFormDialog
        open={true}
        onOpenChange={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    const submitBtn = screen.getByRole("button", { name: /submit application/i });
    await user.click(submitBtn);

    // Should display the validation error message and validation error banner
    await waitFor(() => {
      expect(
        screen.getAllByText(/reason must be at least 3 characters/i).length
      ).toBeGreaterThanOrEqual(1);
    });

    // API should NOT be called
    expect(postSpy).not.toHaveBeenCalled();
  });

  it("submits the form successfully when a valid reason is provided", async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 201,
        message: "success",
        data: mockLeaveRequest,
      },
    } as never);

    const onOpenChange = vi.fn();
    render(
      <LeaveRequestFormDialog
        open={true}
        onOpenChange={onOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    const reasonInput = screen.getByLabelText(/reason \/ justification/i);
    await user.type(reasonInput, "Medical doctor appointment at hospital");

    const submitBtn = screen.getByRole("button", { name: /submit application/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/admin/attendance/leave-requests"),
        expect.objectContaining({
          reason: "Medical doctor appointment at hospital",
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("populates existing data in edit mode and allows updating", async () => {
    const user = userEvent.setup();
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: { ...mockLeaveRequest, reason: "Updated reason for leave" },
      },
    } as never);

    const onOpenChange = vi.fn();
    render(
      <LeaveRequestFormDialog
        open={true}
        onOpenChange={onOpenChange}
        leaveRequest={mockLeaveRequest}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Edit Leave Request")).toBeInTheDocument();
    const reasonInput = screen.getByLabelText(/reason \/ justification/i);
    expect(reasonInput).toHaveValue("Family personal matters");

    await user.clear(reasonInput);
    await user.type(reasonInput, "Updated reason for leave");

    const updateBtn = screen.getByRole("button", { name: /update request/i });
    await user.click(updateBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/admin/attendance/leave-requests/1"),
        expect.objectContaining({
          reason: "Updated reason for leave",
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
