import { FC, useState, useEffect } from "react";
import { PaymentMethodEnum, type StudentInvoiceAttribute } from "@repo/contracts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecordInvoicePaymentMutation } from "../hooks/use-invoices";

interface PayInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StudentInvoiceAttribute | null;
}

export const PayInvoiceDialog: FC<PayInvoiceDialogProps> = ({
  open,
  onOpenChange,
  invoice,
}) => {
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const recordMutation = useRecordInvoicePaymentMutation();

  useEffect(() => {
    if (invoice) {
      const remaining = Math.max(0, invoice.totalAmount - invoice.amountPaid);
      setAmountPaid(remaining);

      // Auto-generate sample receipt number template
      const now = new Date();
      const monthStr = String(now.getMonth() + 1).padStart(2, "0");
      const seq = String(invoice.id).padStart(4, "0");
      setReceiptNumber(`REC-${now.getFullYear()}${monthStr}-${seq}`);
    }
  }, [invoice, open]);

  const handleSubmit = () => {
    if (!invoice) return;
    if (amountPaid <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    recordMutation.mutate(
      {
        invoiceId: invoice.id,
        amountPaid,
        paymentMethod,
        receiptNumber,
        notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Record Payment & Issue Receipt</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4 py-2 text-sm">
            {/* Summary Banner */}
            <div className="rounded-lg bg-slate-50 border p-3">
              <p className="font-semibold text-slate-800">Invoice #{invoice.invoiceNumber}</p>
              <p className="text-slate-600 text-xs mt-0.5">
                Student: <span className="font-medium text-slate-900">{invoice.studentName || `ID: ${invoice.studentId}`}</span>
              </p>
              <div className="flex justify-between items-center mt-2 pt-2 border-t text-xs">
                <span className="text-slate-500">Total Payable: <strong className="text-slate-900">${invoice.totalAmount.toFixed(2)}</strong></span>
                <span className="text-slate-500">Amount Paid: <strong className="text-emerald-600">${invoice.amountPaid.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Receipt Number */}
            <div className="space-y-1">
              <Label>Receipt Number (Auto-Generated / Editable)</Label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="REC-YYYYMM-XXXX"
              />
            </div>

            {/* Amount Paid */}
            <div className="space-y-1">
              <Label>Payment Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethodEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethodEnum.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethodEnum.KHQR}>KHQR Scan</SelectItem>
                  <SelectItem value={PaymentMethodEnum.BANK_TRANSFER}>Bank Transfer</SelectItem>
                  <SelectItem value={PaymentMethodEnum.CREDIT_CARD}>Credit Card</SelectItem>
                  <SelectItem value={PaymentMethodEnum.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Payment reference or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={recordMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {recordMutation.isPending ? "Processing..." : "Record Payment & Mark Paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
