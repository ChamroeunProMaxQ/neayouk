import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchStatusEnum, type SchoolProfileDto } from "@repo/contracts";
import { SchoolProfileCard } from "./school-profile-card";
import { apiClient } from "@/shared/lib/api-client";

const mockProfile: SchoolProfileDto = {
  id: 1,
  uuid: "11111111-1111-1111-1111-111111111111",
  name: "Neayouk Academy",
  nameKhmer: "សាលា នាយក",
  code: "NA-01",
  phone: "+85512345678",
  email: "admin@neayouk.edu.kh",
  website: "https://neayouk.edu.kh",
  motto: "Knowledge is Power",
  address: "Street 2004, Phnom Penh",
  logoUrl: "/uploads/logos/demo-logo.png",
  receiptFooterTerms: "Term 1: Non-refundable\nTerm 2: Keep receipt safe",
  receiptSignatureTitle: "Authorized Cashier",
  isDefault: true,
  status: BranchStatusEnum.ACTIVE,
};

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

describe("SchoolProfileCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders school profile form fields populated with profile data", () => {
    render(<SchoolProfileCard profile={mockProfile} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText(/school name \(english\)/i)).toHaveValue(
      "Neayouk Academy"
    );
    expect(screen.getByLabelText(/school name \(khmer\)/i)).toHaveValue("សាលា នាយក");
    expect(screen.getByLabelText(/branch code \/ identifier/i)).toHaveValue("NA-01");
    expect(screen.getByLabelText(/contact phone \/ hotline/i)).toHaveValue("+85512345678");
    expect(screen.getByLabelText(/official support email/i)).toHaveValue("admin@neayouk.edu.kh");
    expect(screen.getByLabelText(/school website url/i)).toHaveValue("https://neayouk.edu.kh");
    expect(screen.getByLabelText(/school motto \/ tagline/i)).toHaveValue("Knowledge is Power");
    expect(screen.getByLabelText(/campus physical address/i)).toHaveValue(
      "Street 2004, Phnom Penh"
    );
    expect(
      screen.getByLabelText(/custom receipt terms & policies/i)
    ).toHaveValue("Term 1: Non-refundable\nTerm 2: Keep receipt safe");
    expect(
      screen.getByLabelText(/cashier \/ signature box title/i)
    ).toHaveValue("Authorized Cashier");
  });

  it("submits updated profile data successfully and shows success message", async () => {
    const user = userEvent.setup();
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: {
        status: 200,
        message: "School profile updated successfully",
        data: {
          ...mockProfile,
          name: "Neayouk International School",
        },
      },
    });

    render(<SchoolProfileCard profile={mockProfile} />, {
      wrapper: createWrapper(),
    });

    const nameInput = screen.getByLabelText(/school name \(english\)/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Neayouk International School");

    const submitBtn = screen.getByRole("button", { name: /save profile changes/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/settings/profile"),
        expect.objectContaining({
          name: "Neayouk International School",
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/school profile updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("handles submission error gracefully", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "patch").mockRejectedValue({
      response: {
        data: {
          message: "Failed to update profile due to database error",
        },
      },
    });

    render(<SchoolProfileCard profile={mockProfile} />, {
      wrapper: createWrapper(),
    });

    const nameInput = screen.getByLabelText(/school name \(english\)/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    const submitBtn = screen.getByRole("button", { name: /save profile changes/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to update profile due to database error/i)
      ).toBeInTheDocument();
    });
  });
});
