import type { FC } from "react";
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
import { useDeleteStudentMutation } from "../hooks/use-student-mutations";
import { Loader2, Trash2 } from "lucide-react";
import type { StudentAttribute } from "@repo/contracts";

export interface DeleteStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAttribute | null;
  onSuccess?: () => void;
}

export const DeleteStudentDialog: FC<DeleteStudentDialogProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const deleteMutation = useDeleteStudentMutation();

  if (!student) return null;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(student.id);
    onSuccess?.();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
        <AlertDialogHeader>
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-2">
            <Trash2 className="w-5 h-5" />
          </div>
          <AlertDialogTitle className="text-base font-bold text-slate-900">
            Soft Delete Student Record
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to soft delete student{" "}
            <span className="font-semibold text-slate-800">
              {student.firstName} {student.lastName} ({student.studentCode || `ID #${student.id}`})
            </span>
            ? All enrollment records and payment history will be preserved and can be retrieved using the deleted records filter.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="text-xs h-9"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9"
          >
            {deleteMutation.isPending && (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            )}
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
