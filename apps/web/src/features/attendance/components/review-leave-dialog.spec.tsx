import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LeaveStatusEnum,
  LeaveTypeEnum,
  type LeaveRequestAttribute,
} from "@repo/contracts";
import { ReviewLeaveDialog } from "./review-leave-dialog";
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
  id: 10,
  uuid: "leave-uuid-10",
  teacherId: 1,
  teacherName: "John Sok",
  userId: 1,
  leaveType: LeaveTypeEnum.SICK,
  startDate: "2026-08-25",
  endDate: "2026-08-26",
  totalDays: 2.0,
  reason: "Medical appointment & flu recovery",
  attachmentUrl: null,
  status: LeaveStatusEnum.PENDING,
  reviewerId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ReviewLeaveDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders leave request details, duration, and decision buttons", () => {
    render(
      <ReviewLeaveDialog
        open={true}
        onOpenChange={() => {}}
        leaveRequest={mockLeaveRequest}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Review Leave Application")).toBeInTheDocument();
    expect(screen.getByText("John Sok")).toBeInTheDocument();
    expect(screen.getByText("2026-08-25 → 2026-08-26")).toBeInTheDocument();
    expect(screen.getByText("2 day(s)")).toBeInTheDocument();
    expect(screen.getByText("Medical appointment & flu recovery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve leave/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject request/i })).toBeInTheDocument();
  });

  it("submits approval with auto-sync attendance", async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {
        status: 200,
        message: "success",
        data: { ...mockLeaveRequest, status: LeaveStatusEnum.APPROVED },
      },
    } as any);

    const onOpenChange = vi.fn();
    render(
      <ReviewLeaveDialog
        open={true}
        onOpenChange={onOpenChange}
        leaveRequest={mockLeaveRequest}
      />,
      { wrapper: createWrapper() }
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm approval/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/admin/attendance/leave-requests/10/review"),
        expect.objectContaining({
          status: LeaveStatusEnum.APPROVED,
          syncAttendance: true,
        })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows rejection reason field when decision is REJECTED", async () => {
    const user = userEvent.setup();
    render(
      <ReviewLeaveDialog
        open={true}
        onOpenChange={() => {}}
        leaveRequest={mockLeaveRequest}
      />,
      { wrapper: createWrapper() }
    );

    const rejectBtn = screen.getByRole("button", { name: /reject request/i });
    await user.click(rejectBtn);

    expect(screen.getByText(/reason for rejection \*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/explain why this request cannot be approved/i)).toBeInTheDocument();
  });
});
