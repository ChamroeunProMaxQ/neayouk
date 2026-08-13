import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CustomerListTable } from "./customer-list-table";

describe("CustomerListTable", () => {
  it("renders search bar, bulk upload button, pagination, and customer list columns", () => {
    render(<CustomerListTable />);

    expect(screen.getByPlaceholderText(/search\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload bulk users/i })).toBeInTheDocument();
    expect(screen.getByText(/1-10 of 33,272/i)).toBeInTheDocument();

    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Gender")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Verify sample mock data rows from screenshot
    expect(screen.getByText("Kim")).toBeInTheDocument();
    expect(screen.getByText("Sopheavattey Chhon")).toBeInTheDocument();
    expect(screen.getByText("Ladli Seng")).toBeInTheDocument();
    expect(screen.getByText("C0000336")).toBeInTheDocument();
  });

  it("filters customer list dynamically when typing into search input", async () => {
    const user = userEvent.setup();
    render(<CustomerListTable />);

    const searchInput = screen.getByPlaceholderText(/search\.\.\./i);
    await user.type(searchInput, "Ladli");

    expect(screen.getByText("Ladli Seng")).toBeInTheDocument();
    expect(screen.queryByText("Sopheavattey Chhon")).not.toBeInTheDocument();
    expect(screen.queryByText("Sophia Martin Uy")).not.toBeInTheDocument();
  });

  it("shows empty state message when search query matches no users", async () => {
    const user = userEvent.setup();
    render(<CustomerListTable />);

    const searchInput = screen.getByPlaceholderText(/search\.\.\./i);
    await user.type(searchInput, "NonExistentUser123");

    expect(screen.getByText(/no customers found matching "nonexistentuser123"/i)).toBeInTheDocument();
  });

  it("removes user row and triggers onDeleteUser callback when clicking Delete", async () => {
    const user = userEvent.setup();
    const onDeleteUserMock = vi.fn();

    render(<CustomerListTable onDeleteUser={onDeleteUserMock} />);

    expect(screen.getByText("Kim")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "Delete Kim" });

    await user.click(deleteButton);

    expect(onDeleteUserMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Kim")).not.toBeInTheDocument();
  });

  it("triggers onEditUser callback when clicking Edit button", async () => {
    const user = userEvent.setup();
    const onEditUserMock = vi.fn();

    render(<CustomerListTable onEditUser={onEditUserMock} />);

    const editButton = screen.getByRole("button", { name: "Edit Kim" });
    await user.click(editButton);

    expect(onEditUserMock).toHaveBeenCalledTimes(1);
  });
});
