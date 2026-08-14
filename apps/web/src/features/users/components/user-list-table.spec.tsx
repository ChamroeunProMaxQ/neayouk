import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserStatusEnum, UserTypeEnum, type UserAttribute } from "@repo/contracts";
import { MemoryRouter } from "react-router-dom";
import { UserListTable } from "./user-list-table";

function createWrapper(initialEntries: string[] = ["/"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

const mockUsers: UserAttribute[] = [
  {
    id: 1,
    uuid: "uuid-1",
    username: "alice_admin",
    password: "",
    userType: UserTypeEnum.ADMIN,
    status: UserStatusEnum.ACTIVE,
    computedNameId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T10:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 2,
    uuid: "uuid-2",
    username: "bob_editor",
    password: "",
    userType: UserTypeEnum.CMS,
    status: UserStatusEnum.ACTIVE,
    computedNameId: "user-2",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T12:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 3,
    uuid: "uuid-3",
    username: "charlie_customer",
    password: "",
    userType: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.INACTIVE,
    computedNameId: "user-3",
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T14:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: 4,
    uuid: "uuid-4",
    username: "deleted_user",
    password: "",
    userType: UserTypeEnum.CUSTOMER,
    status: UserStatusEnum.ACTIVE,
    computedNameId: "user-4",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-08T16:00:00.000Z"),
    deletedAt: new Date("2026-01-09T00:00:00.000Z"),
  },
];

describe("UserListTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders search bar, role filter, action buttons, pagination, and user rows", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: mockUsers.slice(0, 3),
            pagination: {
              page: 1,
              pageSize: 10,
              totalCount: 3,
              totalPage: 1,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<UserListTable />, { wrapper: createWrapper() });

    expect(screen.getByPlaceholderText(/search user name\.\.\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by user role/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();

    expect(screen.getByText("Avatar")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^username/i })).toBeInTheDocument();
    expect(screen.getByText("userType")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /updated at/i })).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Verify mock users rendered
    expect(await screen.findByText("alice_admin")).toBeInTheDocument();
    expect(screen.getByText("bob_editor")).toBeInTheDocument();
    expect(screen.getByText("charlie_customer")).toBeInTheDocument();
  });

  it("triggers search and updates fetch parameters when typing", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: [mockUsers[0]],
            pagination: { page: 1, pageSize: 10, totalCount: 1, totalPage: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<UserListTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search user name\.\.\./i);
    await user.type(searchInput, "alice");

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=alice"),
        expect.anything()
      );
    });
  });

  it("changes role filter and queries with userType", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: [mockUsers[0]],
            pagination: { page: 1, pageSize: 10, totalCount: 1, totalPage: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<UserListTable />, { wrapper: createWrapper() });

    const roleSelect = screen.getByLabelText(/filter by user role/i);
    await user.selectOptions(roleSelect, UserTypeEnum.ADMIN);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("userType=ADMIN"),
        expect.anything()
      );
    });
  });

  it("toggles sorting when clicking Username and Updated At headers", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: mockUsers,
            pagination: { page: 1, pageSize: 10, totalCount: 4, totalPage: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<UserListTable />, { wrapper: createWrapper() });

    const usernameSortBtn = screen.getByRole("button", { name: /^username/i });
    await user.click(usernameSortBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=username"),
        expect.anything()
      );
    });
  });

  it("opens Add User dialog and creates user on form submission", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      const method = init?.method || "GET";
      if (method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: 201,
              message: "success",
              data: {
                id: 5,
                username: "new_created_user",
                userType: UserTypeEnum.CUSTOMER,
                status: UserStatusEnum.ACTIVE,
                computedNameId: "user-5",
              },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: mockUsers,
            pagination: { page: 1, pageSize: 10, totalCount: 4, totalPage: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    await user.click(addUserBtn);

    expect(screen.getByRole("heading", { name: /create new user/i })).toBeInTheDocument();

    const usernameInput = screen.getByPlaceholderText(/e\.g\. john_doe/i);
    const passwordInput = screen.getByPlaceholderText(/at least 6 characters/i);

    await user.type(usernameInput, "new_created_user");
    await user.type(passwordInput, "secret123");

    const submitBtn = screen.getByRole("button", { name: /create user/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/v1/users",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("new_created_user"),
        })
      );
    });
  });

  it("opens Delete User confirmation and soft-deletes user", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      const method = init?.method || "DELETE";
      if (method === "DELETE") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: 200,
              message: "success",
              data: { id: 1, success: true },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 200,
            message: "success",
            data: [mockUsers[0]],
            pagination: { page: 1, pageSize: 10, totalCount: 1, totalPage: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });

    render(<UserListTable />, { wrapper: createWrapper() });

    const deleteBtn = await screen.findByRole("button", { name: "Delete alice_admin" });
    await user.click(deleteBtn);

    expect(screen.getByRole("heading", { name: /delete user/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete user/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/v1/users/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });
});
