import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PaymentMethodEnum,
  ProcessPayrollPaymentSchema,
  type ProcessPayrollPaymentDto,
  type PayrollAttribute,
} from "@repo/contracts";
import { useProcessPaymentMutation } from "../hooks/use-payroll-mutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";

interface PayrollPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollAttribute | null;
}

export function PayrollPaymentDialog({
  open,
  onOpenChange,
  payroll,
}: PayrollPaymentDialogProps) {
  const processPaymentMutation = useProcessPaymentMutation();
  const isSubmitting = processPaymentMutation.isPending;

  const form = useForm<ProcessPayrollPaymentDto>({
    resolver: zodResolver(ProcessPayrollPaymentSchema) as any,
    defaultValues: {
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentReference: "",
      notes: "",
    },
  });

  const onSubmit = async (values: ProcessPayrollPaymentDto) => {
    if (!payroll) return;
    try {
      await processPaymentMutation.mutateAsync({
        id: payroll.id,
        dto: values,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to process payment:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CreditCard className="h-5 w-5" />
            Disburse Salary Payment
          </DialogTitle>
          <DialogDescription>
            Record payment for voucher{" "}
            <strong className="text-foreground">{payroll?.payrollNumber}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Summary Box */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Recipient:
              </span>
              <span className="font-bold text-foreground">
                {payroll?.staff?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Bank Route:
              </span>
              <span>
                {payroll?.staff?.bankName} - {payroll?.staff?.bankAccountNumber}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                Net Pay Amount:
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                ${payroll?.netSalary?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <select
              id="paymentMethod"
              {...form.register("paymentMethod")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={PaymentMethodEnum.BANK_TRANSFER}>Bank Transfer (ABA / Canadia)</option>
              <option value={PaymentMethodEnum.KHQR}>KHQR Scan</option>
              <option value={PaymentMethodEnum.CASH}>Cash Disbursement</option>
              <option value={PaymentMethodEnum.CREDIT_CARD}>Card / POS</option>
              <option value={PaymentMethodEnum.OTHER}>Other</option>
            </select>
          </div>

          {/* Payment Date */}
          <div className="space-y-1">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              {...form.register("paymentDate")}
            />
          </div>

          {/* Reference / Transaction ID */}
          <div className="space-y-1">
            <Label htmlFor="paymentReference">Bank Transaction Reference / Cheque #</Label>
            <Input
              id="paymentReference"
              placeholder="e.g. TRX-ABA-20260831-01"
              {...form.register("paymentReference")}
            />
          </div>

          {/* Automatic Expense Sync Notice */}
          <div className="p-2.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              <strong>Automatic Expense Logging:</strong> Confirming payment will automatically log an operational expense voucher of{" "}
              <strong>${payroll?.netSalary?.toFixed(2)}</strong> under the school's general ledger (Fee & Billing module).
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="payNotes">Notes</Label>
            <Textarea
              id="payNotes"
              rows={2}
              placeholder="Remarks for disbursement..."
              {...form.register("notes")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Disburse & Confirm Paid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
