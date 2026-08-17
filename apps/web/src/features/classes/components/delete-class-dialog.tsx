import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type ClassAttribute } from "@repo/contracts";
import { useDeleteClassMutation } from "../hooks/use-class-mutations";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls?: ClassAttribute | null;
}

export function DeleteClassDialog({
  open,
  onOpenChange,
  cls,
}: DeleteClassDialogProps) {
  const deleteMutation = useDeleteClassMutation();

  if (!cls) return null;

  const hasStudents = (cls.studentCount ?? 0) > 0;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(cls.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete class", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-slate-900 font-bold">
                Delete Class &ldquo;{cls.name}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-xs mt-1">
                Are you sure you want to soft-delete this academic class?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {hasStudents && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️ Active Student Warning</span>
            </p>
            <p>
              This class currently has <strong>{cls.studentCount} active enrolled students</strong>. Deleting this class will archive it, but historical student enrollment records will be preserved.
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Class
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
