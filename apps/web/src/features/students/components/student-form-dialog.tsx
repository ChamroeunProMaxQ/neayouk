import type { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentForm, type StudentFormValues } from "./student-form";
import {
  useCreateStudentMutation,
  useUpdateStudentMutation,
} from "../hooks/use-student-mutations";
import { UserPlus, UserCheck } from "lucide-react";
import type { StudentAttribute, CreateStudentDto, UpdateStudentDto } from "@repo/contracts";

export interface StudentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: StudentAttribute | null;
  onSuccess?: () => void;
}

export const StudentFormDialog: FC<StudentFormDialogProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onSuccess,
}) => {
  const isEdit = Boolean(studentToEdit);
  const createStudentMutation = useCreateStudentMutation();
  const updateStudentMutation = useUpdateStudentMutation();

  const isLoading = createStudentMutation.isPending || updateStudentMutation.isPending;

  const handleSubmit = async (values: StudentFormValues) => {
    if (isEdit && studentToEdit) {
      await updateStudentMutation.mutateAsync({
        id: studentToEdit.id,
        dto: values as UpdateStudentDto,
      });
    } else {
      await createStudentMutation.mutateAsync(values as CreateStudentDto);
    }
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-6 bg-white shadow-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            {isEdit ? (
              <>
                <UserCheck className="w-5 h-5 text-[#45AC5E]" />
                Edit Student Profile
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-[#45AC5E]" />
                Register New Student
              </>
            )}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            {isEdit
              ? "Update student biodata, enrolled classes, or monthly discount."
              : "Register a new student, assign initial classes, and set monthly tuition fee."}
          </p>
        </DialogHeader>

        <div className="pt-2">
          <StudentForm
            studentToEdit={studentToEdit}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitButtonLabel={isEdit ? "Save Changes" : "Create Student"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
