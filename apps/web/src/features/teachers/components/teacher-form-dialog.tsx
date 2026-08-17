import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateTeacherSchema,
  TeacherGenderEnum,
  TeacherStatusEnum,
  type TeacherAttribute,
  type CreateTeacherDto,
} from "@repo/contracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Briefcase, ShieldCheck, KeyRound } from "lucide-react";
import {
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
} from "../hooks/use-teacher-mutations";

interface TeacherFormDialogProps {
  teacher?: TeacherAttribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TeacherFormValues = CreateTeacherDto & {
  unbindUser?: boolean;
};

export function TeacherFormDialog({
  teacher,
  open,
  onOpenChange,
}: TeacherFormDialogProps) {
  const isEdit = !!teacher;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "account">("personal");

  const createMutation = useCreateTeacherMutation();
  const updateMutation = useUpdateTeacherMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(CreateTeacherSchema),
    defaultValues: {
      name: "",
      nameKm: "",
      teacherCode: "",
      gender: TeacherGenderEnum.MALE,
      dateOfBirth: "",
      phone: "",
      email: "",
      salaryInHour: 0,
      specialization: "",
      bio: "",
      status: TeacherStatusEnum.ACTIVE,
      createAccount: false,
      username: "",
      password: "",
    },
  });

  const watchCreateAccount = watch("createAccount");

  useEffect(() => {
    if (teacher && open) {
      reset({
        name: teacher.name ?? "",
        nameKm: teacher.nameKm ?? "",
        teacherCode: teacher.teacherCode ?? "",
        gender: (teacher.gender as TeacherGenderEnum) || TeacherGenderEnum.MALE,
        dateOfBirth: teacher.dateOfBirth ?? "",
        phone: teacher.phone ?? "",
        email: teacher.email ?? "",
        salaryInHour: Number(teacher.salaryInHour ?? 0),
        specialization: teacher.specialization ?? "",
        bio: teacher.bio ?? "",
        status: (teacher.status as TeacherStatusEnum) || TeacherStatusEnum.ACTIVE,
        createAccount: false,
        username: teacher.user?.username ?? "",
        password: "",
        unbindUser: false,
      });
      setErrorMsg(null);
    } else if (!teacher && open) {
      reset({
        name: "",
        nameKm: "",
        teacherCode: "",
        gender: TeacherGenderEnum.MALE,
        dateOfBirth: "",
        phone: "",
        email: "",
        salaryInHour: 0,
        specialization: "",
        bio: "",
        status: TeacherStatusEnum.ACTIVE,
        createAccount: false,
        username: "",
        password: "",
        unbindUser: false,
      });
      setErrorMsg(null);
    }
  }, [teacher, reset, open]);

  const onSubmit = async (data: TeacherFormValues) => {
    setErrorMsg(null);
    try {
      if (isEdit && teacher) {
        await updateMutation.mutateAsync({
          id: teacher.id,
          dto: {
            ...data,
            salaryInHour: Number(data.salaryInHour || 0),
            unbindUser: data.unbindUser,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          salaryInHour: Number(data.salaryInHour || 0),
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        errorResponse.response?.data?.message ||
          errorResponse.message ||
          "An error occurred while saving the teacher."
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {isEdit ? `Edit Teacher: ${teacher.name}` : "Add New Teacher"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update teacher profile, employment details, and login account access."
              : "Register a new teacher and optionally provision a user account for portal login."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "personal"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <User className="h-4 w-4" />
            1. Personal & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("employment")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "employment"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            2. Academic & Salary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "account"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            3. Login Account Access
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* TAB 1: Personal & Contact */}
          {activeTab === "personal" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Full Name (English) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. Sok John"
                    className={`mt-1 h-9 text-sm ${errors.name ? "border-rose-500" : ""}`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Khmer Name (ឈ្មោះជាភាសាខ្មែរ)
                  </Label>
                  <Input
                    {...register("nameKm")}
                    placeholder="e.g. សុខ ចន"
                    className="mt-1 h-9 text-sm font-khmer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Gender</Label>
                  <select
                    {...register("gender")}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    <option value={TeacherGenderEnum.MALE}>Male</option>
                    <option value={TeacherGenderEnum.FEMALE}>Female</option>
                    <option value={TeacherGenderEnum.OTHER}>Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Date of Birth</Label>
                  <Input
                    type="date"
                    {...register("dateOfBirth")}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                  <Input
                    {...register("phone")}
                    placeholder="e.g. 012 345 678"
                    className="mt-1 h-9 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="e.g. teacher@school.edu.kh"
                    className={`mt-1 h-9 text-sm ${errors.email ? "border-rose-500" : ""}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Biography / Notes</Label>
                <Textarea
                  {...register("bio")}
                  placeholder="Teacher background, educational degrees, or notes..."
                  rows={3}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Academic & Salary */}
          {activeTab === "employment" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Teacher Code
                  </Label>
                  <Input
                    {...register("teacherCode")}
                    placeholder="e.g. TCH-2026-001 (auto if empty)"
                    className="mt-1 h-9 text-sm font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Leave blank to auto-generate unique identifier code.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Employment Status</Label>
                  <select
                    {...register("status")}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    <option value={TeacherStatusEnum.ACTIVE}>Active</option>
                    <option value={TeacherStatusEnum.ON_LEAVE}>On Leave</option>
                    <option value={TeacherStatusEnum.INACTIVE}>Inactive</option>
                    <option value={TeacherStatusEnum.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Subject Specialty / Department
                  </Label>
                  <Input
                    {...register("specialization")}
                    placeholder="e.g. Mathematics & Primary GEP"
                    className="mt-1 h-9 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Hourly Salary ($ / hour) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      {...register("salaryInHour")}
                      placeholder="0.00"
                      className={`h-9 pl-7 text-sm font-mono ${errors.salaryInHour ? "border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.salaryInHour && (
                    <p className="mt-1 text-xs text-rose-500">{errors.salaryInHour.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    Hourly pay rate for teaching hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Login Account Access */}
          {activeTab === "account" && (
            <div className="space-y-4">
              {isEdit && teacher?.user ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Linked Login Account
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Username:</span>{" "}
                      <span className="font-mono font-bold text-slate-800">{teacher.user.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">User Type:</span>{" "}
                      <span className="font-semibold text-emerald-700">{teacher.user.userType}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">
                      Reset Password (leave empty to keep current password)
                    </Label>
                    <Input
                      type="password"
                      {...register("password")}
                      placeholder="Enter new password (min 6 characters)"
                      className="h-9 text-sm bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="unbindUser"
                      {...register("unbindUser")}
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <label htmlFor="unbindUser" className="text-xs font-medium text-rose-600">
                      Unlink user account from this teacher profile
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      id="createAccount"
                      {...register("createAccount")}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="createAccount" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Enable Portal & System Login for this Teacher (Role: Teacher / Type: CMS)
                    </label>
                  </div>

                  {watchCreateAccount && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <KeyRound className="h-4 w-4 text-emerald-600" />
                        Account Credentials
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold text-slate-700">
                            Login Username <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            {...register("username")}
                            placeholder="e.g. teacher_sok"
                            className="mt-1 h-9 text-sm font-mono"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold text-slate-700">
                            Login Password <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            type="password"
                            {...register("password")}
                            placeholder="Min 6 characters"
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Teacher"
              ) : (
                "Create Teacher"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
