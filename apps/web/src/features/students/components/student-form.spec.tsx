import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentForm } from "./student-form";
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

describe("StudentForm", () => {
  it("renders form fields and validates required first and last name", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { status: 200, message: "success", data: [] },
    } as any);

    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<StudentForm onSubmit={handleSubmit} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/first name \(latin\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name \(latin\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ត្រកូល \(khmer last name\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/នាម \(khmer first name\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly payable day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly base discount/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /register student/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid student form data with Khmer names and discount", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { status: 200, message: "success", data: [] },
    } as any);

    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<StudentForm onSubmit={handleSubmit} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/first name \(latin\)/i), "Dara");
    await user.type(screen.getByLabelText(/last name \(latin\)/i), "Sok");
    await user.type(screen.getByLabelText(/នាម \(khmer first name\)/i), "ដារ៉ា");
    await user.type(screen.getByLabelText(/ត្រកូល \(khmer last name\)/i), "សុខ");

    const discountInput = screen.getByLabelText(/monthly base discount/i);
    await user.clear(discountInput);
    await user.type(discountInput, "15");

    const submitBtn = screen.getByRole("button", { name: /register student/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Dara",
          lastName: "Sok",
          firstNameKm: "ដារ៉ា",
          lastNameKm: "សុខ",
          discount: 15,
        })
      );
    });
  });
});
