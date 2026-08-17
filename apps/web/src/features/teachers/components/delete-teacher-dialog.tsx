import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteTeacherMutation } from "../hooks/use-teacher-mutations";
import type { TeacherAttribute } from "@repo/contracts";

interface DeleteTeacherDialogProps {
  teacher: TeacherAttribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTeacherDialog({
  teacher,
  open,
  onOpenChange,
}: DeleteTeacherDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deleteMutation = useDeleteTeacherMutation();

  const handleDelete = async () => {
    if (!teacher) return;
    setErrorMsg(null);
    try {
      await deleteMutation.mutateAsync(teacher.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        errorResponse.response?.data?.message ||
          errorResponse.message ||
          "Failed to delete teacher. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Teacher</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm text-slate-600">
            Are you sure you want to delete teacher{" "}
            <span className="font-semibold text-slate-900">
              {teacher?.name}
            </span>{" "}
            {teacher?.teacherCode ? `(${teacher.teacherCode})` : ""}?
            <br />
            This will soft-delete their profile and unassign them from any active classes.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
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
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Teacher"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
