import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleForm } from "./role-form";

describe("RoleForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form fields and static permission resource groups", () => {
    render(<RoleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

    // Verify static permission resources rendered
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Academic Management")).toBeInTheDocument();
    expect(screen.getByText("Student & Staff Attendance")).toBeInTheDocument();
    expect(screen.getByText("Fee & Billing")).toBeInTheDocument();
  });

  it("auto-generates slug when typing role name", async () => {
    const user = userEvent.setup();

    render(<RoleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const nameInput = screen.getByLabelText(/role name/i);
    const slugInput = screen.getByLabelText(/role slug/i) as HTMLInputElement;

    await user.type(nameInput, "Vice Principal");
    expect(slugInput.value).toBe("vice-principal");
  });

  it("submits valid form data with selected permissions", async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn();

    render(<RoleForm onSubmit={onSubmitMock} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/role name/i), "Accountant");
    await user.type(screen.getByLabelText(/description/i), "Financial management");

    // Click permission action buttons
    const readBtns = screen.getAllByRole("button", { name: /^read$/i });
    expect(readBtns[0]).toBeDefined();
    await user.click(readBtns[0]!); // User management read

    const submitBtn = screen.getByRole("button", { name: /create role/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Accountant",
          slug: "accountant",
          description: "Financial management",
          permissions: expect.arrayContaining([
            expect.objectContaining({ action: "read" }),
          ]),
        })
      );
    });
  });

  it("renders server error alert banner when error is provided (e.g. 409 Conflict)", () => {
    const conflictError = new Error('Role with slug "accountant" already exists');

    render(
      <RoleForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        error={conflictError}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Action Failed")).toBeInTheDocument();
    expect(screen.getByText('Role with slug "accountant" already exists')).toBeInTheDocument();
  });
});
