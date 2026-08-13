import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./login-form";
import { useAuthStore } from "../stores/use-auth-store";

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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  });

  it("renders username, password, role badges, and submit button", () => {
    render(<LoginForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("CMS")).toBeInTheDocument();
    expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
  });

  it("displays validation error when submitting empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("toggles password visibility when clicking show/hide toggle button", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: createWrapper() });

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput.type).toBe("text");

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    await user.click(hideButton);

    expect(passwordInput.type).toBe("password");
  });

  it("handles successful login flow and triggers onSuccess callback", async () => {
    const onSuccessMock = vi.fn();
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes("/auth/login")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: 201,
              message: "success",
              data: {
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
              },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (urlStr.includes("/auth/profile")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: 200,
              message: "success",
              data: {
                id: 1,
                username: "admin",
                userType: "ADMIN",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error("Unknown route"));
    });

    render(<LoginForm onSuccess={onSuccessMock} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/^password/i), "string");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });

    expect(useAuthStore.getState().token).toBe("test-access-token");
    expect(useAuthStore.getState().refreshToken).toBe("test-refresh-token");
    expect(useAuthStore.getState().user).toEqual({
      id: 1,
      username: "admin",
      userType: "ADMIN",
    });
  });

  it("displays error banner when authentication fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 401,
          message: "Invalid username or password",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<LoginForm />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/username/i), "invaliduser");
    await user.type(screen.getByLabelText(/^password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
  });
});
