import { forwardRef } from "react";
import { type StudentInvoiceAttribute, PaymentMethodEnum } from "@repo/contracts";

export interface SchoolReceiptData {
  studentName: string;
  className: string;
  level?: string | number;
  date: string;
  receiptNumber?: string;
  paymentMethod?: PaymentMethodEnum | string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  discount: number;
  subtotal: number;
  customTerms?: string[];
}

interface SchoolReceiptProps {
  data?: SchoolReceiptData;
  invoice?: StudentInvoiceAttribute;
  className?: string;
}

const formatDateSafe = (rawDate?: string | Date | null): string => {
  if (!rawDate) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  }

  // Handle YYYY-MM-DD or ISO string directly
  if (typeof rawDate === "string") {
    const cleanStr = rawDate.split("T")[0] || "";
    const parts = cleanStr.split("-");
    if (parts.length === 3 && parts[0] && parts[1] && parts[2] && parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  }

  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const SchoolReceipt = forwardRef<HTMLDivElement, SchoolReceiptProps>(
  ({ data, invoice, className = "" }, ref) => {
    // Determine level from class name or program if available
    let derivedLevel = "5";
    if (invoice?.className) {
      const match = invoice.className.match(/(?:grade|level|g|l)\s*(\d+)/i);
      if (match && match[1]) {
        derivedLevel = match[1];
      }
    }

    const receiptData: SchoolReceiptData = data || {
      studentName: invoice?.studentName || `Student #${invoice?.studentId || ""}`,
      className: invoice?.className || "General English Program",
      level: derivedLevel,
      date: formatDateSafe(invoice?.issueDate || invoice?.createdAt),
      receiptNumber: invoice?.invoiceNumber || `REC-${Date.now().toString().slice(-6)}`,
      paymentMethod: PaymentMethodEnum.CASH,
      items:
        invoice?.items && invoice.items.length > 0
          ? invoice.items.map((item) => ({
              description: item.title,
              quantity: 1,
              price: Number(item.amount),
              total: Number(item.amount),
            }))
          : [
              {
                description: `Tuition Fee - ${invoice?.className || "Monthly"}`,
                quantity: 1,
                price: Number(invoice?.subtotal || invoice?.totalAmount || 0),
                total: Number(invoice?.subtotal || invoice?.totalAmount || 0),
              },
            ],
      total: Number(invoice?.subtotal || invoice?.totalAmount || 0),
      discount: Number(invoice?.discountAmount || 0),
      subtotal: Number(invoice?.amountPaid || invoice?.totalAmount || 0),
    };

    const paymentMethodText =
      receiptData.paymentMethod === PaymentMethodEnum.KHQR
        ? "KHQR (Bakong)"
        : receiptData.paymentMethod === PaymentMethodEnum.BANK_TRANSFER
        ? "bank transfer"
        : receiptData.paymentMethod === PaymentMethodEnum.CREDIT_CARD
        ? "credit card"
        : "cash";

    const terms = receiptData.customTerms || [
      `The above has been paid by the student by ${paymentMethodText}.`,
      "The school has received the student's full payment.",
    ];

    const formatCurrency = (val: number) => {
      const num = Number(val || 0);
      return num % 1 === 0 ? `$${num}` : `$${num.toFixed(2)}`;
    };

    return (
      <div
        ref={ref}
        id="printable-receipt"
        className={`bg-white text-slate-900 mx-auto font-serif selection:bg-rose-100 receipt-a5-container ${className}`}
        style={{
          width: "100%",
          maxWidth: "500px",
          minHeight: "680px",
          padding: "28px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header Branding */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Logo Badge */}
          <div className="flex flex-col items-center flex-shrink-0 text-center">
            <span className="text-[10px] font-bold text-[#b91c1c] mb-1 font-serif tracking-tight">
              ELC Language Center
            </span>
            <div className="relative w-16 h-16 rounded-full border-2 border-[#1e40af] bg-sky-50/50 flex flex-col items-center justify-center p-1 shadow-xs">
              <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none">
                <path
                  d="M32 18c-5-2-11-2-15 1v22c4-2 10-2 15 0 5-2 11-2 15 0V19c-4-3-10-3-15-1z"
                  fill="#bae6fd"
                  stroke="#0369a1"
                  strokeWidth="1.75"
                />
                <path d="M32 18v23" stroke="#0369a1" strokeWidth="1.75" />
                <path
                  d="M20 14l12-5 12 5-12 5-12-5z"
                  fill="#0284c7"
                  stroke="#0369a1"
                  strokeWidth="1.2"
                />
                <circle cx="22" cy="22" r="1.5" fill="#f59e0b" />
                <circle cx="42" cy="22" r="1.5" fill="#10b981" />
                <circle cx="32" cy="19" r="1.5" fill="#ef4444" />
              </svg>
              <div className="absolute -bottom-1.5 bg-[#1d4ed8] text-white text-[5.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-xs whitespace-nowrap">
                Morality Quality Virtue
              </div>
            </div>
          </div>

          {/* School Titles */}
          <div className="flex-1 text-center pr-2">
            <h2
              className="text-lg sm:text-xl font-bold text-[#b91c1c] tracking-normal mb-0.5 leading-tight"
              style={{
                fontFamily:
                  "'Khmer OS Muol Light', 'Siemreap', 'Battambang', serif",
              }}
            >
              មជ្ឈមណ្ឌលសិក្សា អ៊ី អិល ស៊ី
            </h2>
            <h3 className="text-base sm:text-lg font-bold text-[#b91c1c] font-serif tracking-tight">
              English Learning Center
            </h3>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-5">
          <h1 className="text-2xl font-bold text-[#dc2626] underline underline-offset-4 decoration-1 tracking-normal font-serif inline-block">
            School Receipt
          </h1>
        </div>

        {/* Student Metadata Information */}
        <div className="space-y-1.5 text-xs text-slate-900 mb-6 font-serif">
          <div className="flex items-center">
            <span className="w-16 font-semibold text-slate-700">Name:</span>
            <span className="font-bold text-slate-900">{receiptData.studentName}</span>
          </div>
          <div className="flex items-center">
            <span className="w-16 font-semibold text-slate-700">Class:</span>
            <span className="font-bold text-slate-900">{receiptData.className}</span>
          </div>
          {receiptData.level !== undefined && (
            <div className="flex items-center">
              <span className="w-16 font-semibold text-slate-700">Level:</span>
              <span className="font-bold text-slate-900">{receiptData.level}</span>
            </div>
          )}
          <div className="flex items-center">
            <span className="w-16 font-semibold text-slate-700">Date:</span>
            <span className="font-bold text-slate-900">{receiptData.date}</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-6">
          <table className="w-full text-xs font-serif border-collapse">
            <thead>
              <tr className="border-y border-slate-300">
                <th className="py-2 text-left font-bold text-slate-900 w-1/2">
                  Description
                </th>
                <th className="py-2 text-center font-bold text-slate-900 w-1/6">
                  Quantity
                </th>
                <th className="py-2 text-right font-bold text-slate-900 w-1/6">
                  Price
                </th>
                <th className="py-2 text-right font-bold text-slate-900 w-1/6">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receiptData.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2.5 text-left text-slate-800 font-medium">
                    {item.description}
                  </td>
                  <td className="py-2.5 text-center text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 text-right text-slate-800">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-8 font-serif text-xs">
          <div className="w-44 space-y-1.5">
            <div className="flex justify-between items-center text-slate-900 font-bold">
              <span>Total:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
            {receiptData.discount > 0 && (
              <div className="flex justify-between items-center text-slate-900 font-bold">
                <span>Discount:</span>
                <span>{formatCurrency(receiptData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[#dc2626] font-bold pt-1">
              <span>Subtotal:</span>
              <span className="text-[#dc2626] font-bold">
                {formatCurrency(receiptData.subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mt-8 font-serif text-xs">
          <h4 className="font-bold text-slate-900 mb-2">Term &amp; Conditions</h4>
          <ul className="space-y-1 text-slate-800 pl-4 list-disc marker:text-slate-600 text-[11px] leading-relaxed">
            {terms.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
);

SchoolReceipt.displayName = "SchoolReceipt";
