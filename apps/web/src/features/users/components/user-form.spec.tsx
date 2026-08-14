import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { UserStatusEnum, UserTypeEnum } from "@repo/contracts";
import { UserForm } from "./user-form";

describe("UserForm", () => {
  it("renders form fields with default values for create mode", () => {
    render(<UserForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/username/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password/i)).toHaveValue("");
    expect(screen.getByLabelText(/user role/i)).toHaveValue(UserTypeEnum.CUSTOMER);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.ACTIVE);
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
  });

  it("populates fields when userToEdit is provided", () => {
    const userToEdit = {
      id: 1,
      uuid: "uuid-1",
      username: "john_doe",
      password: "",
      userType: UserTypeEnum.ADMIN,
      status: UserStatusEnum.INACTIVE,
      computedNameId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    render(<UserForm onSubmit={vi.fn()} userToEdit={userToEdit} />);

    expect(screen.getByLabelText(/username/i)).toHaveValue("john_doe");
    expect(screen.getByLabelText(/user role/i)).toHaveValue(UserTypeEnum.ADMIN);
    expect(screen.getByLabelText(/account status/i)).toHaveValue(UserStatusEnum.INACTIVE);
    expect(screen.getByRole("button", { name: /update user/i })).toBeInTheDocument();
  });

  it("submits valid form data", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<UserForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/username/i), "new_user");
    await user.type(screen.getByLabelText(/^password/i), "securepass");
    await user.selectOptions(screen.getByLabelText(/user role/i), UserTypeEnum.CMS);
    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "new_user",
          password: "securepass",
          userType: UserTypeEnum.CMS,
          status: UserStatusEnum.ACTIVE,
        })
      );
    });
  });

  it("cancels form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();

    render(<UserForm onSubmit={vi.fn()} onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalled();
  });
});
