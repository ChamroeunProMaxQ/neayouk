import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchStatusEnum, PaymentMethodEnum, type SchoolProfileDto } from "@repo/contracts";
import { SchoolReceipt, type SchoolReceiptData } from "./school-receipt";

const mockProfile: SchoolProfileDto = {
  id: 1,
  uuid: "11111111-1111-1111-1111-111111111111",
  name: "Neayouk Academy",
  nameKhmer: "សាលា នាយក",
  code: "NA-01",
  phone: "+855 12 345 678",
  email: "billing@neayouk.edu.kh",
  website: "https://neayouk.edu.kh",
  motto: "Discipline & Excellence",
  address: "Phnom Penh, Cambodia",
  logoUrl: "/uploads/logos/neayouk-crest.png",
  receiptFooterTerms: "Custom Rule 1: No refunds\nCustom Rule 2: Official copy",
  receiptSignatureTitle: "Lead Accountant",
  isDefault: true,
  status: BranchStatusEnum.ACTIVE,
};

const mockReceiptData: SchoolReceiptData = {
  studentName: "Sokha Chamroeun",
  className: "Grade 10A",
  level: "10",
  date: "07/09/2026",
  receiptNumber: "REC-2026-001",
  paymentMethod: PaymentMethodEnum.KHQR,
  items: [
    {
      description: "Semester 1 Tuition Fee",
      quantity: 1,
      price: 250,
      total: 250,
    },
    {
      description: "Textbooks & Materials",
      quantity: 2,
      price: 25,
      total: 50,
    },
  ],
  total: 300,
  discount: 30,
  subtotal: 270,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("SchoolReceipt", () => {
  it("binds universal school profile branding dynamically", () => {
    render(<SchoolReceipt data={mockReceiptData} profile={mockProfile} />, {
      wrapper: createWrapper(),
    });

    // English & Khmer names
    expect(screen.getAllByText("Neayouk Academy").length).toBeGreaterThan(0);
    expect(screen.getByText("សាលា នាយក")).toBeInTheDocument();

    // Logo
    const logoImg = screen.getByAltText("Neayouk Academy");
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute("src", "/uploads/logos/neayouk-crest.png");

    // Address & Contact
    expect(screen.getByText(/Phnom Penh, Cambodia/i)).toBeInTheDocument();
    expect(screen.getByText(/Tel: \+855 12 345 678/i)).toBeInTheDocument();

    // Student Information
    expect(screen.getByText("Sokha Chamroeun")).toBeInTheDocument();
    expect(screen.getByText("Grade 10A")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("No: REC-2026-001")).toBeInTheDocument();

    // Line items and pricing
    expect(screen.getByText("Semester 1 Tuition Fee")).toBeInTheDocument();
    expect(screen.getByText("Textbooks & Materials")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("$30")).toBeInTheDocument();
    expect(screen.getByText("$270")).toBeInTheDocument();

    // Custom receipt terms and signature title
    expect(screen.getByText("Custom Rule 1: No refunds")).toBeInTheDocument();
    expect(screen.getByText("Custom Rule 2: Official copy")).toBeInTheDocument();
    expect(screen.getByText("Lead Accountant")).toBeInTheDocument();
  });
});
