import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AttendanceStatusEnum, LeaveStatusEnum, LeaveTypeEnum } from "@repo/contracts";
import {
  AttendanceStatusBadge,
  LeaveStatusBadge,
  LeaveTypeBadge,
} from "./attendance-status-badge";

describe("AttendanceStatusBadge", () => {
  it("renders Present status badge correctly", () => {
    render(<AttendanceStatusBadge status={AttendanceStatusEnum.PRESENT} />);
    expect(screen.getByText("Present")).toBeInTheDocument();
  });

  it("renders Absent status badge correctly", () => {
    render(<AttendanceStatusBadge status={AttendanceStatusEnum.ABSENT} />);
    expect(screen.getByText("Absent")).toBeInTheDocument();
  });

  it("renders Late status badge correctly", () => {
    render(<AttendanceStatusBadge status={AttendanceStatusEnum.LATE} />);
    expect(screen.getByText("Late")).toBeInTheDocument();
  });

  it("renders On Leave status badge correctly", () => {
    render(<AttendanceStatusBadge status={AttendanceStatusEnum.ON_LEAVE} />);
    expect(screen.getByText("On Leave")).toBeInTheDocument();
  });
});

describe("LeaveStatusBadge", () => {
  it("renders Pending status", () => {
    render(<LeaveStatusBadge status={LeaveStatusEnum.PENDING} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders Approved status", () => {
    render(<LeaveStatusBadge status={LeaveStatusEnum.APPROVED} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders Rejected status", () => {
    render(<LeaveStatusBadge status={LeaveStatusEnum.REJECTED} />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});

describe("LeaveTypeBadge", () => {
  it("renders Sick leave type", () => {
    render(<LeaveTypeBadge type={LeaveTypeEnum.SICK} />);
    expect(screen.getByText("SICK")).toBeInTheDocument();
  });

  it("renders Casual leave type", () => {
    render(<LeaveTypeBadge type={LeaveTypeEnum.CASUAL} />);
    expect(screen.getByText("CASUAL")).toBeInTheDocument();
  });
});
