import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeletePayrollMutation } from "../hooks/use-payroll-mutations";
import { type PayrollAttribute } from "@repo/contracts";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeletePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollAttribute | null;
}

export function DeletePayrollDialog({
  open,
  onOpenChange,
  payroll,
}: DeletePayrollDialogProps) {
  const deleteMutation = useDeletePayrollMutation();
  const isDeleting = deleteMutation.isPending;

  const handleDelete = async () => {
    if (!payroll) return;
    try {
      await deleteMutation.mutateAsync(payroll.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete payroll:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Payroll Voucher
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete draft payroll voucher{" "}
            <strong className="text-foreground">{payroll?.payrollNumber}</strong> for{" "}
            <strong className="text-foreground">{payroll?.staff?.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
