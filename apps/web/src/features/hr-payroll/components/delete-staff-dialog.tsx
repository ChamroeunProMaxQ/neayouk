import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteStaffMutation } from "../hooks/use-staff-mutations";
import { type StaffAttribute } from "@repo/contracts";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffAttribute | null;
}

export function DeleteStaffDialog({
  open,
  onOpenChange,
  staff,
}: DeleteStaffDialogProps) {
  const deleteMutation = useDeleteStaffMutation();
  const isDeleting = deleteMutation.isPending;

  const handleDelete = async () => {
    if (!staff) return;
    try {
      await deleteMutation.mutateAsync(staff.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete staff:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Archive Staff Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to soft-delete{" "}
            <strong className="text-foreground">{staff?.name}</strong>?
            Historical payroll vouchers and attendance logs will remain preserved.
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
            Archive Staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
