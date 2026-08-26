import { FC, useState } from "react";
import { type StudentInvoiceAttribute } from "@repo/contracts";
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
import { useSendReminderMutation } from "../hooks/use-invoices";

interface PaymentReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StudentInvoiceAttribute | null;
}

export const PaymentReminderDialog: FC<PaymentReminderDialogProps> = ({
  open,
  onOpenChange,
  invoice,
}) => {
  const [channel, setChannel] = useState<string>("IN_APP");
  const [notes, setNotes] = useState<string>("");

  const reminderMutation = useSendReminderMutation();

  const handleSubmit = () => {
    if (!invoice) return;

    reminderMutation.mutate(
      {
        invoiceId: invoice.id,
        channel,
        notes,
      },
      {
        onSuccess: () => {
          alert("Payment reminder logged successfully.");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="font-semibold text-amber-900">Invoice #{invoice.invoiceNumber}</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Student: <strong>{invoice.studentName || `ID: ${invoice.studentId}`}</strong>
              </p>
              <p className="text-amber-700 text-xs">
                Balance Due: <strong>${(invoice.totalAmount - invoice.amountPaid).toFixed(2)}</strong>
              </p>
            </div>

            <div className="space-y-1">
              <Label>Notification Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App Notification</SelectItem>
                  <SelectItem value="SMS">SMS Broadcast</SelectItem>
                  <SelectItem value="EMAIL">Email Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Reminder Message / Notes</Label>
              <Input
                placeholder="Notice to parent/student..."
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
            disabled={reminderMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {reminderMutation.isPending ? "Logging..." : "Log & Send Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
