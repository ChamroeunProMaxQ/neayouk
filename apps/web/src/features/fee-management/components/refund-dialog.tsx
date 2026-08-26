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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRefundPaymentMutation } from "../hooks/use-invoices";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StudentInvoiceAttribute | null;
}

export const RefundDialog: FC<RefundDialogProps> = ({
  open,
  onOpenChange,
  invoice,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);

  const refundMutation = useRefundPaymentMutation();

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.amountPaid);
      setReason("");
    }
  }, [invoice, open]);

  const handleSubmit = () => {
    if (!invoice) return;
    if (amount <= 0) {
      alert("Refund amount must be greater than zero.");
      return;
    }
    if (!reason.trim()) {
      alert("Please enter a refund reason.");
      return;
    }

    refundMutation.mutate(
      {
        invoiceId: invoice.id,
        amount,
        reason,
        paymentMethod,
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-rose-600">Issue Payment Refund</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
              <p className="font-semibold text-rose-900">Invoice #{invoice.invoiceNumber}</p>
              <p className="text-rose-700 text-xs mt-0.5">
                Amount Paid So Far: <strong>${invoice.amountPaid.toFixed(2)}</strong>
              </p>
            </div>

            <div className="space-y-1">
              <Label>Refund Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                max={invoice.amountPaid}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <Label>Refund Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethodEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethodEnum.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethodEnum.BANK_TRANSFER}>Bank Transfer</SelectItem>
                  <SelectItem value={PaymentMethodEnum.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Refund Reason</Label>
              <Textarea
                placeholder="Reason for processing refund..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
            disabled={refundMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {refundMutation.isPending ? "Processing..." : "Confirm Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
