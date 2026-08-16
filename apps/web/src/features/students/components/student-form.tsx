import { useState, useEffect, type FC } from "react";
import { useForm } from "react-hook-form";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentStatusEnum,
  type CreateStudentDto,
  type UpdateStudentDto,
  type StudentAttribute,
} from "@repo/contracts";
import { Loader2, AlertCircle, BookOpen, Star, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useClassesQuery } from "../hooks/use-classes-query";

export type StudentFormValues = CreateStudentDto | UpdateStudentDto;

export interface StudentFormProps {
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  onCancel?: () => void;
  studentToEdit?: StudentAttribute | null;
  isLoading?: boolean;
  submitButtonLabel?: string;
}

export const StudentForm: FC<StudentFormProps> = ({
  onSubmit,
  onCancel,
  studentToEdit,
  isLoading = false,
  submitButtonLabel,
}) => {
  const isEdit = Boolean(studentToEdit);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: classesResponse, isLoading: isClassesLoading } = useClassesQuery({ pageSize: 100 });
  const availableClasses = classesResponse?.data ?? [];

  const initialClassIds = studentToEdit?.enrollments
    ? studentToEdit.enrollments.filter((e) => e.status === "ENROLLED").map((e) => e.classId)
    : studentToEdit?.classes
    ? studentToEdit.classes.map((c) => c.id)
    : [];

  const initialPrimaryClassId = studentToEdit?.primaryClass?.id || initialClassIds[0] || undefined;

  const [selectedClassIds, setSelectedClassIds] = useState<number[]>(initialClassIds);
  const [primaryClassId, setPrimaryClassId] = useState<number | undefined>(initialPrimaryClassId);

  const activeSchema = isEdit ? UpdateStudentSchema : CreateStudentSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudentFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      studentCode: studentToEdit?.studentCode ?? "",
      firstName: studentToEdit?.firstName ?? "",
      lastName: studentToEdit?.lastName ?? "",
      firstNameKm: studentToEdit?.firstNameKm ?? "",
      lastNameKm: studentToEdit?.lastNameKm ?? "",
      gender: studentToEdit?.gender ?? "MALE",
      dateOfBirth: studentToEdit?.dateOfBirth ?? "",
      contact: studentToEdit?.contact ?? "",
      guardianName: studentToEdit?.guardianName ?? "",
      guardianPhone: studentToEdit?.guardianPhone ?? "",
      payableDate: studentToEdit?.payableDate ?? 1,
      discount: studentToEdit?.discount ? Number(studentToEdit.discount) : 0,
      status: studentToEdit?.status ?? StudentStatusEnum.ACTIVE,
      classIds: initialClassIds,
      primaryClassId: initialPrimaryClassId,
    },
  });

  useEffect(() => {
    setServerError(null);
    const classes = studentToEdit?.enrollments
      ? studentToEdit.enrollments.filter((e) => e.status === "ENROLLED").map((e) => e.classId)
      : studentToEdit?.classes
      ? studentToEdit.classes.map((c) => c.id)
      : [];
    const primary = studentToEdit?.primaryClass?.id || classes[0] || undefined;

    setSelectedClassIds(classes);
    setPrimaryClassId(primary);

    reset({
      studentCode: studentToEdit?.studentCode ?? "",
      firstName: studentToEdit?.firstName ?? "",
      lastName: studentToEdit?.lastName ?? "",
      firstNameKm: studentToEdit?.firstNameKm ?? "",
      lastNameKm: studentToEdit?.lastNameKm ?? "",
      gender: studentToEdit?.gender ?? "MALE",
      dateOfBirth: studentToEdit?.dateOfBirth ?? "",
      contact: studentToEdit?.contact ?? "",
      guardianName: studentToEdit?.guardianName ?? "",
      guardianPhone: studentToEdit?.guardianPhone ?? "",
      payableDate: studentToEdit?.payableDate ?? 1,
      discount: studentToEdit?.discount ? Number(studentToEdit.discount) : 0,
      status: studentToEdit?.status ?? StudentStatusEnum.ACTIVE,
      classIds: classes,
      primaryClassId: primary,
    });
  }, [studentToEdit, reset]);

  const toggleClass = (classId: number) => {
    let next: number[];
    if (selectedClassIds.includes(classId)) {
      next = selectedClassIds.filter((id) => id !== classId);
      if (primaryClassId === classId) {
        setPrimaryClassId(next[0] || undefined);
        setValue("primaryClassId", next[0] || undefined);
      }
    } else {
      next = [...selectedClassIds, classId];
      if (!primaryClassId) {
        setPrimaryClassId(classId);
        setValue("primaryClassId", classId);
      }
    }
    setSelectedClassIds(next);
    setValue("classIds", next, { shouldValidate: true });
  };

  const handleSetPrimaryClass = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrimaryClassId(classId);
    setValue("primaryClassId", classId, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: StudentFormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        ...values,
        classIds: selectedClassIds,
        primaryClassId,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save student. Please check the inputs and try again.";
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans" noValidate>
      {/* Server Error Banner */}
      {serverError && (
        <div className="flex items-start gap-2 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* English Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            First Name (Latin) <span className="text-red-500">*</span>
          </label>
          <Input
            id="firstName"
            type="text"
            placeholder="e.g. Sokha"
            {...register("firstName")}
            className={cn(
              "bg-white text-xs h-9",
              errors.firstName ? "border-red-500" : "border-slate-200"
            )}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600 font-semibold">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Last Name (Latin) <span className="text-red-500">*</span>
          </label>
          <Input
            id="lastName"
            type="text"
            placeholder="e.g. Chan"
            {...register("lastName")}
            className={cn(
              "bg-white text-xs h-9",
              errors.lastName ? "border-red-500" : "border-slate-200"
            )}
          />
          {errors.lastName && (
            <p className="text-xs text-red-600 font-semibold">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Khmer Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="lastNameKm" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            ត្រកូល (Khmer Last Name)
          </label>
          <Input
            id="lastNameKm"
            type="text"
            placeholder="e.g. ចាន់"
            {...register("lastNameKm")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="firstNameKm" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            នាម (Khmer First Name)
          </label>
          <Input
            id="firstNameKm"
            type="text"
            placeholder="e.g. សុខា"
            {...register("firstNameKm")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>
      </div>

      {/* Gender, DOB & Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="gender" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Gender
          </label>
          <select
            id="gender"
            {...register("gender")}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white h-9"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dateOfBirth" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Date of Birth
          </label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="studentCode" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Student Code
          </label>
          <Input
            id="studentCode"
            type="text"
            placeholder="Auto-generated if empty"
            {...register("studentCode")}
            className="bg-white text-xs h-9 border-slate-200 font-mono"
          />
        </div>
      </div>

      {/* Contact & Guardian */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="contact" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Student Contact / Phone
          </label>
          <Input
            id="contact"
            type="text"
            placeholder="012 345 678"
            {...register("contact")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="guardianName" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Guardian Name
          </label>
          <Input
            id="guardianName"
            type="text"
            placeholder="Parent / Guardian"
            {...register("guardianName")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="guardianPhone" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Guardian Phone
          </label>
          <Input
            id="guardianPhone"
            type="text"
            placeholder="098 765 432"
            {...register("guardianPhone")}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>
      </div>

      {/* Financial Settings: Due Date & Monthly Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="space-y-1.5">
          <label htmlFor="payableDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Monthly Payable Day (1–31)
          </label>
          <Input
            id="payableDate"
            type="number"
            min="1"
            max="31"
            {...register("payableDate", { valueAsNumber: true })}
            className="bg-white text-xs h-9 border-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="discount" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Monthly Base Discount ($)
          </label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            {...register("discount", { valueAsNumber: true })}
            className="bg-white text-xs h-9 border-slate-200 font-bold text-emerald-800"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Student Status
          </label>
          <select
            id="status"
            {...register("status")}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white h-9"
          >
            <option value={StudentStatusEnum.ACTIVE}>Active</option>
            <option value={StudentStatusEnum.INACTIVE}>Inactive</option>
            <option value={StudentStatusEnum.SUSPENDED}>Suspended</option>
            <option value={StudentStatusEnum.GRADUATED}>Graduated</option>
            <option value={StudentStatusEnum.DROPPED}>Dropped</option>
          </select>
        </div>
      </div>

      {/* Class Enrollment Multi-Select Section */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#45AC5E]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Assign Academic Classes
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {selectedClassIds.length} class(es) selected (Click ★ to set primary)
          </span>
        </div>

        {isClassesLoading ? (
          <div className="p-3 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
            Loading classes...
          </div>
        ) : availableClasses.length === 0 ? (
          <div className="p-3 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
            No classes available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto">
            {availableClasses.map((cls) => {
              const isSelected = selectedClassIds.includes(cls.id);
              const isPrimary = primaryClassId === cls.id;

              return (
                <div
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? isPrimary
                        ? "bg-[#EBF6EE] border-[#45AC5E] text-[#389350] shadow-xs"
                        : "bg-emerald-50/60 border-emerald-300 text-emerald-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#45AC5E] shrink-0" />}
                    <div className="truncate">
                      <span className="font-semibold truncate block">{cls.name}</span>
                      <span className="text-[10px] text-slate-500 block">
                        ${Number(cls.monthlyFee).toFixed(2)}/mo
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <button
                      type="button"
                      title={isPrimary ? "Primary Class" : "Set as Primary Class"}
                      onClick={(e) => handleSetPrimaryClass(cls.id, e)}
                      className={`p-1 rounded-md transition-colors ${
                        isPrimary
                          ? "text-[#45AC5E] bg-[#45AC5E]/20"
                          : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPrimary ? "fill-[#45AC5E]" : ""}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-[#45AC5E] hover:bg-[#389350] text-white shadow-xs"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          <span>{submitButtonLabel || (isEdit ? "Update Student" : "Register Student")}</span>
        </Button>
      </div>
    </form>
  );
};
