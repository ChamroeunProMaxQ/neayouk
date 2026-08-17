import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProgramMutation } from "../hooks/use-program-mutations";
import { Loader2, AlertTriangle } from "lucide-react";
import type { ProgramAttribute } from "@repo/contracts";

interface DeleteProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramAttribute | null;
}

export function DeleteProgramDialog({
  open,
  onOpenChange,
  program,
}: DeleteProgramDialogProps) {
  const deleteMutation = useDeleteProgramMutation();

  if (!program) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(program.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to delete program:", err);
    }
  };

  const hasClasses = (program.classCount ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-800">
            Delete Program: {program.name} ({program.code})?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-2">
            Are you sure you want to delete this program?
            {hasClasses && (
              <span className="block mt-2 font-medium text-rose-600">
                Warning: This program has {program.classCount} configured classes associated with it. Soft-deleting will preserve existing class historical records.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
