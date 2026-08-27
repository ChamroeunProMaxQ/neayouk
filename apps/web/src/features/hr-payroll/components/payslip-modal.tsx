import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PayrollItemTypeEnum,
  StaffSalaryTypeEnum,
  type PayrollAttribute,
} from "@repo/contracts";
import { Printer } from "lucide-react";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollAttribute | null;
}

export function PayslipModal({ open, onOpenChange, payroll }: PayslipModalProps) {
  const payslipRef = useRef<HTMLDivElement>(null);

  if (!payroll) return null;

  const earnings = [
    {
      title:
        payroll.salaryType === StaffSalaryTypeEnum.HOURLY
          ? `Base Salary (${payroll.totalHoursWorked} hrs @ $${payroll.hourlyRate}/hr)`
          : "Monthly Base Salary",
      amount: Number(payroll.calculatedBaseAmount || 0),
    },
    ...(payroll.items
      ?.filter(
        (i) =>
          i.itemType === PayrollItemTypeEnum.BONUS ||
          i.itemType === PayrollItemTypeEnum.ALLOWANCE ||
          i.itemType === PayrollItemTypeEnum.OVERTIME
      )
      .map((i) => ({ title: i.title, amount: Number(i.amount || 0) })) ?? []),
  ];

  const deductions =
    payroll.items
      ?.filter(
        (i) =>
          i.itemType === PayrollItemTypeEnum.DEDUCTION ||
          i.itemType === PayrollItemTypeEnum.TAX ||
          i.itemType === PayrollItemTypeEnum.ADVANCE_SALARY ||
          i.itemType === PayrollItemTypeEnum.OTHER
      )
      .map((i) => ({ title: i.title, amount: Number(i.amount || 0) })) ?? [];

  const handlePrint = () => {
    window.print();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Official Payslip Voucher (A5 Format)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                Print A5 Payslip
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Payslip Root Container (A5: 148mm x 210mm style) */}
        <div
          ref={payslipRef}
          id="printable-payslip"
          className="bg-white text-black p-6 sm:p-8 rounded-lg border shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 font-sans text-xs"
          style={{ minHeight: "190mm" }}
        >
          {/* Header & Logo */}
          <div className="text-center border-b pb-3 mb-3 border-gray-300">
            <h1 className="text-base font-bold text-gray-900 tracking-wide uppercase font-serif">
              ELC LANGUAGE CENTER
            </h1>
            <h2 className="text-xs font-semibold text-gray-700 font-khmer mt-0.5">
              មជ្ឈមណ្ឌលភាសា អ៊ី អិល ស៊ី
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Phnom Penh, Kingdom of Cambodia • Tel: 012 345 678 • info@elc.edu.kh
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded bg-gray-100 text-gray-900 font-bold tracking-widest text-[11px] border border-gray-300 uppercase">
              PAYSLIP / ប័ណ្ណបើកប្រាក់បៀវត្សរ៍
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pb-3 mb-3 border-b border-gray-200 text-[11px]">
            <div>
              <span className="text-gray-500">Employee Name: </span>
              <strong className="text-gray-900">
                {payroll.staff?.name}{" "}
                {payroll.staff?.nameKm && `(${payroll.staff.nameKm})`}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Voucher #: </span>
              <strong className="font-mono text-gray-900">
                {payroll.payrollNumber}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">Staff Code: </span>
              <span className="font-mono font-medium">
                {payroll.staff?.staffCode || `#${payroll.staffId}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Pay Period: </span>
              <strong className="text-gray-900">
                {monthNames[payroll.month - 1]} {payroll.year}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">Designation / Role: </span>
              <span>
                {payroll.staff?.designation} ({payroll.staff?.department})
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Working / Holidays: </span>
              <span>
                {payroll.workingDays} Days / {payroll.holidayDays} Holidays
              </span>
            </div>

            <div>
              <span className="text-gray-500">Salary Type: </span>
              <span>
                {payroll.salaryType === StaffSalaryTypeEnum.HOURLY
                  ? `Hourly Rate ($${payroll.hourlyRate}/hr)`
                  : `Monthly Fixed ($${payroll.baseSalary}/mo)`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Status: </span>
              <span className="font-semibold uppercase text-gray-800">
                {payroll.status}
              </span>
            </div>
          </div>

          {/* Earnings & Deductions Two-Column Table */}
          <div className="grid grid-cols-2 gap-4 pb-3 mb-3 border-b border-gray-200">
            {/* Earnings Column */}
            <div>
              <div className="font-bold text-[11px] uppercase bg-gray-100 px-2 py-1 border border-gray-300 text-gray-800 flex justify-between">
                <span>Earnings (ប្រាក់ចំណូល)</span>
                <span>Amount</span>
              </div>
              <div className="divide-y divide-gray-100 border-x border-b border-gray-200">
                {earnings.map((e, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between px-2 py-1.5 text-[10px]"
                  >
                    <span className="text-gray-700">{e.title}</span>
                    <span className="font-medium text-gray-900">
                      ${e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-2 py-1 bg-gray-50 font-bold text-[10px] border border-t-0 border-gray-300 text-gray-900">
                <span>Gross Earnings</span>
                <span>${payroll.grossSalary.toFixed(2)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <div className="font-bold text-[11px] uppercase bg-gray-100 px-2 py-1 border border-gray-300 text-gray-800 flex justify-between">
                <span>Deductions (ការកាត់កង)</span>
                <span>Amount</span>
              </div>
              <div className="divide-y divide-gray-100 border-x border-b border-gray-200 min-h-[50px]">
                {deductions.length === 0 ? (
                  <div className="px-2 py-2 text-[10px] text-gray-400 italic text-center">
                    No Deductions
                  </div>
                ) : (
                  deductions.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between px-2 py-1.5 text-[10px]"
                    >
                      <span className="text-gray-700">{d.title}</span>
                      <span className="font-medium text-red-600">
                        -${d.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between px-2 py-1 bg-gray-50 font-bold text-[10px] border border-t-0 border-gray-300 text-gray-900">
                <span>Total Deductions</span>
                <span className="text-red-600">
                  -${payroll.totalDeduction.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="flex items-center justify-between p-3 rounded bg-gray-50 border border-gray-300 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-700 block">
                NET SALARY PAYABLE (ប្រាក់បៀវត្សរ៍សុទ្ធទទួល)
              </span>
              <span className="text-[10px] text-gray-500">
                Payment Method: {payroll.paymentMethod?.replace("_", " ") ?? "Bank Transfer"} •{" "}
                {payroll.paymentReference ? `Ref: ${payroll.paymentReference}` : "Pending Payment"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-gray-900 font-mono">
                ${payroll.netSalary.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-300 text-[10px] text-center">
            <div className="space-y-12">
              <p className="font-semibold text-gray-700">
                Authorized Management / Accountant
                <br />
                <span className="font-normal font-khmer text-gray-500">
                  ហត្ថលេខាអ្នករៀបចំ និងអនុម័ត
                </span>
              </p>
              <div className="border-b border-gray-400 w-36 mx-auto" />
            </div>

            <div className="space-y-12">
              <p className="font-semibold text-gray-700">
                Employee Signature & Date
                <br />
                <span className="font-normal font-khmer text-gray-500">
                  ហត្ថលេខាបុគ្គលិកទទួល
                </span>
              </p>
              <div className="border-b border-gray-400 w-36 mx-auto" />
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[9px] text-gray-400 pt-6 mt-4 border-t border-dashed border-gray-200">
            This payslip is a system-generated document from ELC Education Management System.
          </div>
        </div>

        {/* Print Stylesheet */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-payslip, #printable-payslip * {
              visibility: visible;
            }
            #printable-payslip {
              position: absolute;
              left: 0;
              top: 0;
              width: 148mm;
              height: 210mm;
              padding: 10mm;
              margin: 0;
              background: white !important;
              color: black !important;
            }
            @page {
              size: A5 portrait;
              margin: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
