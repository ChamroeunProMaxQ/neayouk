import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  PaymentMethodEnum,
  PayrollItemTypeEnum,
  PayrollStatusEnum,
  StaffDepartmentEnum,
  StaffSalaryTypeEnum,
  type PayrollAttribute,
} from "@repo/contracts";
import { PayslipModal } from "./payslip-modal";

const samplePayroll: PayrollAttribute = {
  id: 10,
  uuid: "pr-uuid-10",
  payrollNumber: "PAY-202608-0001",
  staffId: 1,
  year: 2026,
  month: 8,
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  workingDays: 22,
  holidayDays: 0,
  salaryType: StaffSalaryTypeEnum.HOURLY,
  baseSalary: 0,
  hourlyRate: 18.0,
  totalHoursWorked: 40.0,
  calculatedBaseAmount: 720.0,
  totalBonus: 50.0,
  totalDeduction: 20.0,
  grossSalary: 770.0,
  netSalary: 750.0,
  status: PayrollStatusEnum.PAID,
  paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
  paymentDate: "2026-08-31",
  paymentReference: "TRX-ABA-888999",
  notes: "Regular month salary",
  processedBy: 1,
  staff: {
    id: 1,
    uuid: "staff-uuid-1",
    staffCode: "STF-001",
    name: "Dara Som",
    nameKm: "ដារ៉ា សោម",
    department: StaffDepartmentEnum.ACADEMIC,
    designation: "Senior English Teacher",
  } as any,
  items: [
    {
      id: 1,
      uuid: "item-1",
      payrollId: 10,
      itemType: PayrollItemTypeEnum.BONUS,
      title: "Student Retention Bonus",
      amount: 50.0,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      uuid: "item-2",
      payrollId: 10,
      itemType: PayrollItemTypeEnum.ADVANCE_SALARY,
      title: "Salary Advance Repayment",
      amount: 20.0,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("PayslipModal Component", () => {
  it("should render official A5 bilingual payslip with ELC branding, earnings, deductions, and dual signatures", () => {
    render(
      <PayslipModal
        open={true}
        onOpenChange={vi.fn()}
        payroll={samplePayroll}
      />
    );

    expect(screen.getByText("ELC LANGUAGE CENTER")).toBeInTheDocument();
    expect(screen.getByText("មជ្ឈមណ្ឌលភាសា អ៊ី អិល ស៊ី")).toBeInTheDocument();
    expect(screen.getByText("PAYSLIP / ប័ណ្ណបើកប្រាក់បៀវត្សរ៍")).toBeInTheDocument();
    expect(screen.getByText("PAY-202608-0001")).toBeInTheDocument();
    expect(screen.getByText(/Dara Som/)).toBeInTheDocument();
    expect(screen.getByText("Student Retention Bonus")).toBeInTheDocument();
    expect(screen.getByText("Salary Advance Repayment")).toBeInTheDocument();
    expect(screen.getByText("$750.00 USD")).toBeInTheDocument();
    expect(screen.getByText("Authorized Management / Accountant")).toBeInTheDocument();
    expect(screen.getByText("Employee Signature & Date")).toBeInTheDocument();
  });
});
