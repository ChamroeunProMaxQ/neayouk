import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateStaffSchema,
  StaffDepartmentEnum,
  StaffEmploymentTypeEnum,
  StaffGenderEnum,
  StaffSalaryTypeEnum,
  StaffStatusEnum,
  type CreateStaffDto,
  type StaffAttribute,
} from "@repo/contracts";
import {
  useCreateStaffMutation,
  useUpdateStaffMutation,
} from "../hooks/use-staff-mutations";
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
import { Loader2, DollarSign, Clock, UserPlus, Building } from "lucide-react";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffAttribute | null;
}

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
}: StaffFormDialogProps) {
  const isEditing = !!staff;

  const createMutation = useCreateStaffMutation();
  const updateMutation = useUpdateStaffMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CreateStaffDto>({
    resolver: zodResolver(CreateStaffSchema) as any,
    defaultValues: {
      name: "",
      nameKm: "",
      staffCode: "",
      department: StaffDepartmentEnum.ACADEMIC,
      designation: "Teacher",
      specialization: "",
      gender: StaffGenderEnum.MALE,
      dateOfBirth: "",
      phone: "",
      email: "",
      employmentType: StaffEmploymentTypeEnum.FULL_TIME,
      salaryType: StaffSalaryTypeEnum.MONTHLY,
      baseSalary: 0,
      hourlyRate: 0,
      joiningDate: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      status: StaffStatusEnum.ACTIVE,
      bio: "",
      notes: "",
      createAccount: false,
      username: "",
      password: "",
    },
  });

  const salaryType = form.watch("salaryType");
  const createAccount = form.watch("createAccount");

  useEffect(() => {
    if (staff) {
      form.reset({
        name: staff.name,
        nameKm: staff.nameKm ?? "",
        staffCode: staff.staffCode ?? "",
        department: staff.department as StaffDepartmentEnum,
        designation: staff.designation,
        specialization: staff.specialization ?? "",
        gender: staff.gender as StaffGenderEnum,
        dateOfBirth: staff.dateOfBirth ?? "",
        phone: staff.phone ?? "",
        email: staff.email ?? "",
        employmentType: staff.employmentType as StaffEmploymentTypeEnum,
        salaryType: staff.salaryType as StaffSalaryTypeEnum,
        baseSalary: staff.baseSalary ?? 0,
        hourlyRate: staff.hourlyRate ?? 0,
        joiningDate: staff.joiningDate ?? "",
        bankName: staff.bankName ?? "",
        bankAccountName: staff.bankAccountName ?? "",
        bankAccountNumber: staff.bankAccountNumber ?? "",
        status: staff.status as StaffStatusEnum,
        bio: staff.bio ?? "",
        notes: staff.notes ?? "",
        createAccount: false,
        username: "",
        password: "",
      });
    } else {
      form.reset({
        name: "",
        nameKm: "",
        staffCode: "",
        department: StaffDepartmentEnum.ACADEMIC,
        designation: "Teacher",
        specialization: "",
        gender: StaffGenderEnum.MALE,
        dateOfBirth: "",
        phone: "",
        email: "",
        employmentType: StaffEmploymentTypeEnum.FULL_TIME,
        salaryType: StaffSalaryTypeEnum.MONTHLY,
        baseSalary: 0,
        hourlyRate: 0,
        joiningDate: "",
        bankName: "",
        bankAccountName: "",
        bankAccountNumber: "",
        status: StaffStatusEnum.ACTIVE,
        bio: "",
        notes: "",
        createAccount: false,
        username: "",
        password: "",
      });
    }
  }, [staff, form, open]);

  const onSubmit = async (values: CreateStaffDto) => {
    try {
      if (isEditing && staff) {
        await updateMutation.mutateAsync({
          id: staff.id,
          dto: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save staff:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Staff Profile" : "Register New Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update personnel information, department role, or compensation packages."
              : "Add a new staff member (teachers, branch managers, accountants, operations, etc.)"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              1. Basic Identity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name (English) *</Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="nameKm">Full Name (Khmer)</Label>
                <Input
                  id="nameKm"
                  placeholder="e.g. ចន ដូ"
                  {...form.register("nameKm")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="staffCode">Staff Code (Leave blank for auto-generate)</Label>
                <Input
                  id="staffCode"
                  placeholder="e.g. STF-2026-001"
                  {...form.register("staffCode")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  {...form.register("gender")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={StaffGenderEnum.MALE}>Male</option>
                  <option value={StaffGenderEnum.FEMALE}>Female</option>
                  <option value={StaffGenderEnum.OTHER}>Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 012 345 678"
                  {...form.register("phone")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. staff@elc.edu.kh"
                  {...form.register("email")}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Department & Role */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              2. Department & Employment Role
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  {...form.register("department")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.values(StaffDepartmentEnum).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="designation">Job Title / Designation *</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Teacher, Branch Principal, Accountant"
                  {...form.register("designation")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="specialization">Academic Specialization / Skill</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. ESL & TOEFL, Mathematics, Driver"
                  {...form.register("specialization")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="employmentType">Employment Type</Label>
                <select
                  id="employmentType"
                  {...form.register("employmentType")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={StaffEmploymentTypeEnum.FULL_TIME}>Full Time</option>
                  <option value={StaffEmploymentTypeEnum.PART_TIME}>Part Time</option>
                  <option value={StaffEmploymentTypeEnum.CONTRACT}>Contract</option>
                  <option value={StaffEmploymentTypeEnum.INTERN}>Internship</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  {...form.register("joiningDate")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="status">Employment Status</Label>
                <select
                  id="status"
                  {...form.register("status")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={StaffStatusEnum.ACTIVE}>Active</option>
                  <option value={StaffStatusEnum.ON_LEAVE}>On Leave</option>
                  <option value={StaffStatusEnum.INACTIVE}>Inactive</option>
                  <option value={StaffStatusEnum.TERMINATED}>Terminated</option>
                  <option value={StaffStatusEnum.ARCHIVED}>Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Salary Calculation Type & Compensation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              3. Salary & Compensation Formula
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
              <div className="space-y-1">
                <Label htmlFor="salaryType">Salary Calculation Method *</Label>
                <select
                  id="salaryType"
                  {...form.register("salaryType")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Fixed Salary ($/mo)</option>
                  <option value={StaffSalaryTypeEnum.HOURLY}>Calculate Base on Work Hours ($/hr)</option>
                </select>
              </div>

              {salaryType === StaffSalaryTypeEnum.HOURLY ? (
                <div className="space-y-1">
                  <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Hourly Pay Rate ($ / hour) *
                  </Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 15.00"
                    {...form.register("hourlyRate")}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Monthly payroll will calculate (Hours Worked × Hourly Rate)
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="baseSalary" className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    Monthly Base Salary ($ / month) *
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 650.00"
                    {...form.register("baseSalary")}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Fixed monthly disbursement before bonuses/deductions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Bank Account Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              4. Banking & Direct Disbursement Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g. ABA Bank, Canadia, ACLEDA"
                  {...form.register("bankName")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bankAccountName">Account Holder Name</Label>
                <Input
                  id="bankAccountName"
                  placeholder="e.g. JOHN DOE"
                  {...form.register("bankAccountName")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  placeholder="e.g. 000 123 456"
                  {...form.register("bankAccountNumber")}
                />
              </div>
            </div>
          </div>

          {/* Section 5: User Portal Account (Optional for new staff) */}
          {!isEditing && (
            <div className="space-y-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  {...form.register("createAccount")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="createAccount" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Create CMS Portal Account for this Staff Member
                </Label>
              </div>

              {createAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="e.g. john.doe"
                      {...form.register("username")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Initial Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      {...form.register("password")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 6: Bio & Notes */}
          <div className="space-y-1">
            <Label htmlFor="bio">Biographical Summary & Notes</Label>
            <Textarea
              id="bio"
              rows={2}
              placeholder="Educational background, certifications, experience..."
              {...form.register("bio")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Staff Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
