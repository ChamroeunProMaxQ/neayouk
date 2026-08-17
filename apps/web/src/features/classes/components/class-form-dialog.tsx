import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateClassSchema,
  UpdateClassSchema,
  type CreateClassDto,
  type UpdateClassDto,
  ShiftEnum,
  SemesterEnum,
  type ClassAttribute,
} from "@repo/contracts";
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
  useCreateClassMutation,
  useUpdateClassMutation,
} from "../hooks/use-class-mutations";
import { useProgramsQuery } from "@/features/programs";
import { Loader2, AlertCircle } from "lucide-react";

export type ClassFormValues = CreateClassDto | UpdateClassDto;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls?: ClassAttribute | null;
}

export function getBooksForProgram(programName?: string | null): string[] {
  switch (programName) {
    case "GCP For Kids":
      return ["Easy Step to Chinese"];
    case "GCP For Adults":
      return ["Discover China"];
    case "English For Kindergarten":
      return ["Phonics World"];
    case "English For Kids":
      return ["Oxford Discover"];
    case "GEP For Teenagers":
      return ["Solutions"];
    case "Computer Administration":
      return ["Computer Fundamentals", "Microsoft Word", "Microsoft Excel", "Canva"];
    default:
      return ["New Headway"];
  }
}

export function ClassFormDialog({
  open,
  onOpenChange,
  cls,
}: ClassFormDialogProps) {
  const isEdit = !!cls;
  const createMutation = useCreateClassMutation();
  const updateMutation = useUpdateClassMutation();
  const { data: programsData } = useProgramsQuery({ status: "ACTIVE" });
  const programsList = programsData?.programs ?? [];

  const activeSchema = isEdit ? UpdateClassSchema : CreateClassSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      gradeLevel: "1",
      program: "English For Kids",
      section: "Oxford Discover",
      room: "",
      shift: ShiftEnum.MORNING,
      startTime: "07:30",
      endTime: "11:30",
      startDate: "2025-09-01",
      endDate: "2026-06-30",
      monthlyFee: 65,
      academicYear: "2025-2026",
      semester: SemesterEnum.SEMESTER_1,
      status: "ACTIVE",
    },
  });

  const selectedProgramName = watch("program");
  const matchedProgram = programsList.find(
    (p) => p.name.toLowerCase() === (selectedProgramName ?? "").toLowerCase()
  );
  const availableGradeLevels: string[] =
    matchedProgram?.gradeLevels && matchedProgram.gradeLevels.length > 0
      ? matchedProgram.gradeLevels
      : ["1", "2", "3", "4", "5", "6"];

  const availableBooks: string[] =
    matchedProgram?.books && matchedProgram.books.length > 0
      ? matchedProgram.books
      : getBooksForProgram(selectedProgramName);

  useEffect(() => {
    if (cls && open) {
      reset({
        name: cls.name ?? "",
        code: cls.code ?? "",
        programId: cls.programId ?? undefined,
        program: typeof cls.program === "string" ? cls.program : cls.program?.name ?? "",
        gradeLevel: cls.gradeLevel ?? "",
        section: cls.section ?? "",
        room: cls.room ?? "",
        shift: (cls.shift as ShiftEnum) || ShiftEnum.MORNING,
        startTime: cls.startTime ?? "07:30",
        endTime: cls.endTime ?? "11:30",
        startDate: cls.startDate ? new Date(cls.startDate).toISOString().slice(0, 10) : "",
        endDate: cls.endDate ? new Date(cls.endDate).toISOString().slice(0, 10) : "",
        monthlyFee: Number(cls.monthlyFee ?? 0),
        teacherId: cls.teacherId ?? undefined,
        academicYear: cls.academicYear ?? "2025-2026",
        semester: (cls.semester as SemesterEnum) || SemesterEnum.SEMESTER_1,
        status: cls.status || "ACTIVE",
      });
    } else if (!cls && open) {
      reset({
        name: "",
        code: "",
        programId: undefined,
        program: "",
        gradeLevel: "",
        section: "",
        room: "",
        shift: ShiftEnum.MORNING,
        startTime: "07:30",
        endTime: "11:30",
        startDate: "",
        endDate: "",
        monthlyFee: 0,
        teacherId: undefined,
        academicYear: "2025-2026",
        semester: SemesterEnum.SEMESTER_1,
        status: "ACTIVE",
      });
    }
  }, [cls, reset, open]);

  const onSubmit = async (data: ClassFormValues) => {
    try {
      if (isEdit && cls) {
        await updateMutation.mutateAsync({
          id: cls.id,
          dto: data as UpdateClassDto,
        });
      } else {
        await createMutation.mutateAsync(data as CreateClassDto);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to save class", error);
    }
  };

  const errorMessage =
    createMutation.error?.message || updateMutation.error?.message;

  const validationErrorsList = Object.entries(errors)
    .map(([_, err]) => err?.message)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-800 text-lg font-bold">
            {isEdit ? "Edit Academic Class" : "Create New Academic Class"}
          </DialogTitle>
        </DialogHeader>

        {/* API Server Error Banner */}
        {errorMessage && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Zod Validation Errors Banner */}
        {validationErrorsList.length > 0 && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Please resolve the following form errors:</span>
            </div>
            <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5 text-rose-600">
              {validationErrorsList.map((msg, i) => (
                <li key={i}>{String(msg)}</li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, (invalid) => {
            console.warn("ClassFormDialog validation failed:", invalid);
          })}
          className="space-y-5"
        >
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              1. Basic Class Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Class Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Primary - Grade 1A"
                  className={`mt-1 h-9 text-sm ${errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Class Code</Label>
                <Input
                  {...register("code")}
                  placeholder="e.g. G1-A"
                  className="mt-1 h-9 text-sm"
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-rose-500">{errors.code.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Academic Program <span className="text-rose-500">*</span>
                </Label>
                <select
                  {...register("program")}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {programsList.length > 0 ? (
                    programsList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="English For Kindergarten">English For Kindergarten (EFK)</option>
                      <option value="English For Kids">English For Kids (EFKIDS)</option>
                      <option value="GEP For Teenagers">GEP For Teenagers (GEP-TEEN)</option>
                      <option value="GEP For Adults">GEP For Adults (GEP-ADULT)</option>
                      <option value="GCP For Kids">GCP For Kids (GCP-KIDS)</option>
                      <option value="GCP For Adults">GCP For Adults (GCP-ADULT)</option>
                      <option value="Computer Administration">Computer Administration (COMP-ADMIN)</option>
                    </>
                  )}
                </select>
                {errors.program && (
                  <p className="mt-1 text-xs text-rose-500">{errors.program.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Grade / Class Level</Label>
                {availableGradeLevels.length > 0 ? (
                  <select
                    {...register("gradeLevel")}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    <option value="">-- Select Grade Level --</option>
                    {availableGradeLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    {...register("gradeLevel")}
                    placeholder="e.g. Grade 1, Level 1"
                    className="mt-1 h-9 text-sm"
                  />
                )}
                {errors.gradeLevel && (
                  <p className="mt-1 text-xs text-rose-500">{errors.gradeLevel.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Book / Course Material <span className="text-rose-500">*</span>
                </Label>
                {availableBooks.length > 0 ? (
                  <select
                    {...register("section")}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    {availableBooks.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    {...register("section")}
                    placeholder="e.g. Oxford Discover, Phonics World"
                    className="mt-1 h-9 text-sm"
                  />
                )}
                {errors.section && (
                  <p className="mt-1 text-xs text-rose-500">{errors.section.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Classroom / Room</Label>
                <Input
                  {...register("room")}
                  placeholder="e.g. Building A - Room 101"
                  className="mt-1 h-9 text-sm"
                />
                {errors.room && (
                  <p className="mt-1 text-xs text-rose-500">{errors.room.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Monthly Tuition Fee ($) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("monthlyFee", { valueAsNumber: true })}
                  placeholder="e.g. 65.00"
                  className={`mt-1 h-9 text-sm ${errors.monthlyFee ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {errors.monthlyFee && (
                  <p className="mt-1 text-xs text-rose-500">{errors.monthlyFee.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Shift & Daily Time Window */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              2. Shift & Daily Time Schedule (&ldquo;From Which to Which&rdquo;)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Daily Shift</Label>
                <select
                  {...register("shift")}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {Object.values(ShiftEnum).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.shift && (
                  <p className="mt-1 text-xs text-rose-500">{errors.shift.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Daily Start Time (HH:mm)</Label>
                <Input
                  type="time"
                  {...register("startTime")}
                  className={`mt-1 h-9 text-sm ${errors.startTime ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-rose-500">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Daily End Time (HH:mm)</Label>
                <Input
                  type="time"
                  {...register("endTime")}
                  className={`mt-1 h-9 text-sm ${errors.endTime ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-rose-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Academic Year & Term Dates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              3. Academic Year & Term Dates
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Academic Year</Label>
                <Input
                  {...register("academicYear")}
                  placeholder="e.g. 2025-2026"
                  className="mt-1 h-9 text-sm"
                />
                {errors.academicYear && (
                  <p className="mt-1 text-xs text-rose-500">{errors.academicYear.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Academic Term / Semester</Label>
                <select
                  {...register("semester")}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                >
                  {Object.values(SemesterEnum).map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
                {errors.semester && (
                  <p className="mt-1 text-xs text-rose-500">{errors.semester.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Term Start Date</Label>
                <Input
                  type="date"
                  {...register("startDate")}
                  className="mt-1 h-9 text-sm"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Term End Date</Label>
                <Input
                  type="date"
                  {...register("endDate")}
                  className={`mt-1 h-9 text-sm ${errors.endDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="bg-[#45AC5E] hover:bg-[#3d9853] text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
