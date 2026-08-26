import { useState, useEffect, type FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordPaymentMutation } from "../hooks/use-payment-mutations";
import { PaymentMethodEnum, type StudentAttribute } from "@repo/contracts";
import { DollarSign, Loader2, Receipt, Printer } from "lucide-react";
import { SchoolReceiptModal } from "@/features/fee-management/components/school-receipt-modal";
import { type SchoolReceiptData } from "@/features/fee-management/components/school-receipt";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAttribute;
  defaultMonth?: number | null;
  defaultYear?: number | null;
  onSuccess?: () => void;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const RecordPaymentDialog: FC<RecordPaymentDialogProps> = ({
  isOpen,
  onClose,
  student,
  defaultMonth,
  defaultYear,
  onSuccess,
}) => {
  const currentDate = new Date();
  const currentMonth = defaultMonth || currentDate.getMonth() + 1;
  const currentYear = defaultYear || currentDate.getFullYear();

  const [billingMonth, setBillingMonth] = useState<number>(currentMonth);
  const [billingYear, setBillingYear] = useState<number>(currentYear);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showReceiptAfterPay, setShowReceiptAfterPay] = useState(false);
  const [receiptDataForPrint, setReceiptDataForPrint] = useState<SchoolReceiptData | null>(null);

  const baseFee = Number(student.primaryClass?.monthlyFee || 0);
  const discount = Number(student.discount || 0);
  const netDue = Math.max(0, baseFee - discount);

  useEffect(() => {
    if (isOpen) {
      setBillingMonth(defaultMonth || new Date().getMonth() + 1);
      setBillingYear(defaultYear || new Date().getFullYear());
      setAmountPaid(String(netDue > 0 ? netDue : 50));
      setPaymentMethod(PaymentMethodEnum.CASH);
      setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
      setNotes("");
      setShowReceiptAfterPay(false);
    }
  }, [isOpen, defaultMonth, defaultYear, netDue]);

  const recordPaymentMutation = useRecordPaymentMutation();

  const handleSave = (printReceipt: boolean) => {
    if (!amountPaid || isNaN(Number(amountPaid))) return;

    const paidNum = Number(amountPaid);
    const recNum = receiptNumber || `REC-${Date.now().toString().slice(-6)}`;

    recordPaymentMutation.mutate(
      {
        studentId: student.id,
        classId: student.primaryClass?.id,
        billingYear: Number(billingYear),
        billingMonth: Number(billingMonth),
        amountPaid: paidNum,
        discountApplied: discount,
        paymentMethod,
        receiptNumber: recNum,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          if (printReceipt) {
            setReceiptDataForPrint({
              studentName: `${student.firstName} ${student.lastName}`,
              className: student.primaryClass?.name || "General English",
              level: "5",
              date: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              receiptNumber: recNum,
              paymentMethod,
              items: [
                {
                  description: `Tuition Fee (${MONTHS.find((m) => m.value === Number(billingMonth))?.label} ${billingYear})`,
                  quantity: 1,
                  price: baseFee > 0 ? baseFee : paidNum,
                  total: baseFee > 0 ? baseFee : paidNum,
                },
              ],
              total: baseFee > 0 ? baseFee : paidNum,
              discount,
              subtotal: paidNum,
            });
            setShowReceiptAfterPay(true);
          } else {
            onClose();
          }
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 bg-white shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Receipt className="w-5 h-5 text-[#45AC5E]" />
            Record Tuition Fee Payment
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Student: <span className="font-semibold text-slate-800">{student.firstName} {student.lastName}</span> ({student.studentCode || `ID #${student.id}`})
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Billing Month</Label>
              <Select
                value={String(billingMonth)}
                onValueChange={(val) => setBillingMonth(Number(val))}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Billing Year</Label>
              <Input
                type="number"
                value={billingYear}
                onChange={(e) => setBillingYear(Number(e.target.value))}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Base Class Fee</span>
              <p className="text-sm font-bold text-slate-800">${baseFee.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Discount Applied</span>
              <p className="text-sm font-bold text-[#45AC5E]">-${discount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Calculated Net Due</span>
              <p className="text-sm font-black text-slate-900">${netDue.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Amount Paid ($)</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="pl-8 text-xs font-bold text-emerald-800 h-9"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethodEnum)}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethodEnum.CASH} className="text-xs">Cash</SelectItem>
                  <SelectItem value={PaymentMethodEnum.KHQR} className="text-xs">KHQR (Bakong)</SelectItem>
                  <SelectItem value={PaymentMethodEnum.BANK_TRANSFER} className="text-xs">Bank Transfer</SelectItem>
                  <SelectItem value={PaymentMethodEnum.CREDIT_CARD} className="text-xs">Credit Card</SelectItem>
                  <SelectItem value={PaymentMethodEnum.OTHER} className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Receipt / Reference Number</Label>
            <Input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="text-xs font-mono h-9"
              placeholder="e.g. REC-2026-0042"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Payment Notes / Remarks</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
              rows={2}
              placeholder="Add optional payment details..."
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={recordPaymentMutation.isPending}
                onClick={() => handleSave(true)}
                className="text-xs font-semibold h-9 border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Save &amp; Print A5
              </Button>
              <Button
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="bg-[#45AC5E] hover:bg-[#389350] text-white text-xs font-semibold h-9"
              >
                {recordPaymentMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                )}
                Save Payment
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Instant School Receipt Print Modal */}
      <SchoolReceiptModal
        isOpen={showReceiptAfterPay}
        onClose={() => {
          setShowReceiptAfterPay(false);
          onClose();
        }}
        receiptData={receiptDataForPrint}
      />
    </Dialog>
  );
};
