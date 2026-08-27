import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreatePayrollSchema,
  PayrollItemTypeEnum,
  StaffSalaryTypeEnum,
  type CreatePayrollDto,
  type PayrollAttribute,
} from "@repo/contracts";
import {
  useCreatePayrollMutation,
  useUpdatePayrollMutation,
} from "../hooks/use-payroll-mutations";
import { useStaffInfiniteQuery } from "../hooks/use-staff-infinite-query";
import { useTeacherAttendanceSummaryQuery } from "@/features/attendance/hooks/use-teacher-attendance";
import { PUBLIC_HOLIDAYS } from "@/shared/data/public-holiday";
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
import {
  Loader2,
  Receipt,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Sparkles,
  Calculator,
} from "lucide-react";

interface PayrollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll?: PayrollAttribute | null;
  defaultYear: number;
  defaultMonth: number;
}

export function PayrollFormDialog({
  open,
  onOpenChange,
  payroll,
  defaultYear,
  defaultMonth,
}: PayrollFormDialogProps) {
  const isEditing = !!payroll;

  const createMutation = useCreatePayrollMutation();
  const updateMutation = useUpdatePayrollMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Query all active staff to populate staff picker
  const { data: staffData, isLoading: isLoadingStaff } = useStaffInfiniteQuery({
    pageSize: 100,
  });

  const staffOptions = useMemo(
    () => staffData?.pages.flatMap((page) => page.data ?? []) ?? [],
    [staffData]
  );

  const form = useForm<CreatePayrollDto>({
    resolver: zodResolver(CreatePayrollSchema),
    defaultValues: {
      staffId: 0,
      year: defaultYear,
      month: defaultMonth,
      salaryType: StaffSalaryTypeEnum.MONTHLY,
      baseSalary: 0,
      hourlyRate: 0,
      totalHoursWorked: 0,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedStaffId = form.watch("staffId");
  const watchedSalaryType = form.watch("salaryType");
  const watchedBaseSalary = form.watch("baseSalary") ?? 0;
  const watchedHourlyRate = form.watch("hourlyRate") ?? 0;
  const watchedHoursWorked = form.watch("totalHoursWorked") ?? 0;
  const watchedItems = form.watch("items") ?? [];
  const watchedYear = form.watch("year") ?? defaultYear;
  const watchedMonth = form.watch("month") ?? defaultMonth;

  const holidaysInMonth = PUBLIC_HOLIDAYS[watchedMonth] ?? [];
  const monthStr = `${watchedYear}-${String(watchedMonth).padStart(2, "0")}`;

  // Query monthly attendance summary if staff is HOURLY
  const { data: attendanceSummary } = useTeacherAttendanceSummaryQuery(
    watchedSalaryType === StaffSalaryTypeEnum.HOURLY && watchedStaffId
      ? Number(watchedStaffId)
      : undefined,
    watchedSalaryType === StaffSalaryTypeEnum.HOURLY ? monthStr : undefined
  );

  // When staff is selected, auto-fill default rate/salary
  useEffect(() => {
    if (!isEditing && watchedStaffId) {
      const selected = staffOptions.find((s) => s.id === Number(watchedStaffId));
      if (selected) {
        form.setValue("salaryType", selected.salaryType as StaffSalaryTypeEnum);
        form.setValue("baseSalary", Number(selected.baseSalary || 0));
        form.setValue("hourlyRate", Number(selected.hourlyRate || 0));
      }
    }
  }, [watchedStaffId, staffOptions, isEditing, form]);

  // Auto-fill totalHoursWorked from attendance if empty on create
  useEffect(() => {
    if (
      !isEditing &&
      watchedSalaryType === StaffSalaryTypeEnum.HOURLY &&
      attendanceSummary?.totalHoursWorked &&
      watchedHoursWorked === 0
    ) {
      form.setValue("totalHoursWorked", attendanceSummary.totalHoursWorked);
    }
  }, [attendanceSummary, isEditing, watchedSalaryType, watchedHoursWorked, form]);

  useEffect(() => {
    if (payroll) {
      form.reset({
        staffId: payroll.staffId,
        year: payroll.year,
        month: payroll.month,
        salaryType: payroll.salaryType as StaffSalaryTypeEnum,
        baseSalary: payroll.baseSalary,
        hourlyRate: payroll.hourlyRate,
        totalHoursWorked: payroll.totalHoursWorked,
        notes: payroll.notes ?? "",
        items: payroll.items?.map((item) => ({
          itemType: item.itemType as PayrollItemTypeEnum,
          title: item.title,
          amount: item.amount,
          description: item.description ?? undefined,
        })) ?? [],
      });
    } else {
      form.reset({
        staffId: staffOptions[0]?.id ?? 0,
        year: defaultYear,
        month: defaultMonth,
        salaryType: (staffOptions[0]?.salaryType as StaffSalaryTypeEnum) ?? StaffSalaryTypeEnum.MONTHLY,
        baseSalary: Number(staffOptions[0]?.baseSalary || 0),
        hourlyRate: Number(staffOptions[0]?.hourlyRate || 0),
        totalHoursWorked: 0,
        notes: "",
        items: [],
      });
    }
  }, [payroll, form, defaultYear, defaultMonth, open, staffOptions]);

  // Real-time calculation math
  const calculatedBase =
    watchedSalaryType === StaffSalaryTypeEnum.HOURLY
      ? Number(watchedHoursWorked) * Number(watchedHourlyRate)
      : Number(watchedBaseSalary);

  const calculatedBonuses = watchedItems
    .filter(
      (i) =>
        i.itemType === PayrollItemTypeEnum.BONUS ||
        i.itemType === PayrollItemTypeEnum.ALLOWANCE ||
        i.itemType === PayrollItemTypeEnum.OVERTIME
    )
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const calculatedDeductions = watchedItems
    .filter(
      (i) =>
        i.itemType === PayrollItemTypeEnum.DEDUCTION ||
        i.itemType === PayrollItemTypeEnum.TAX ||
        i.itemType === PayrollItemTypeEnum.ADVANCE_SALARY
    )
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const calculatedGross = calculatedBase + calculatedBonuses;
  const calculatedNet = Math.max(0, calculatedGross - calculatedDeductions);

  const onSubmit = async (values: CreatePayrollDto) => {
    try {
      if (isEditing && payroll) {
        await updateMutation.mutateAsync({
          id: payroll.id,
          dto: {
            baseSalary: values.baseSalary,
            hourlyRate: values.hourlyRate,
            totalHoursWorked: values.totalHoursWorked,
            notes: values.notes,
            items: values.items,
          },
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save payroll:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isEditing ? `Edit Payroll Voucher (${payroll?.payrollNumber})` : "Create Individual Payroll Voucher"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Adjust worked hours, allowances, bonuses, or salary deductions for this draft run."
              : "Generate an individual monthly or hourly salary calculation for a specific staff member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Section 1: Staff & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border">
            {/* Staff Picker */}
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="staffId">Staff Member *</Label>
              {isEditing ? (
                <div className="h-9 px-3 py-1.5 rounded-md border bg-background text-sm font-medium">
                  {payroll?.staff?.name} ({payroll?.staff?.designation} - {payroll?.staff?.department})
                </div>
              ) : (
                <select
                  id="staffId"
                  {...form.register("staffId", { valueAsNumber: true })}
                  disabled={isLoadingStaff}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={0}>Select Staff Member...</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.designation} - {s.department}) [
                      {s.salaryType === StaffSalaryTypeEnum.HOURLY
                        ? `$${s.hourlyRate}/hr`
                        : `$${s.baseSalary}/mo`}
                      ]
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="month">Period Month *</Label>
              <select
                id="month"
                {...form.register("month", { valueAsNumber: true })}
                disabled={isEditing}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="year">Period Year *</Label>
              <Input
                id="year"
                type="number"
                disabled={isEditing}
                {...form.register("year", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Cambodia Holidays</Label>
              <div className="h-9 px-3 py-1.5 rounded-md border bg-background text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>{holidaysInMonth.length} public holidays</span>
              </div>
            </div>
          </div>

          {/* Section 2: Salary Calculation Parameters */}
          <div className="space-y-3 p-4 rounded-xl bg-card border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Salary Calculation Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="salaryType">Compensation Formula</Label>
                <select
                  id="salaryType"
                  {...form.register("salaryType")}
                  disabled={isEditing}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={StaffSalaryTypeEnum.MONTHLY}>Monthly Fixed Salary</option>
                  <option value={StaffSalaryTypeEnum.HOURLY}>Calculate Base on Work Hours</option>
                </select>
              </div>

              {watchedSalaryType === StaffSalaryTypeEnum.HOURLY ? (
                <>
                  {/* Attendance Summary Banner for Hourly Staff */}
                  <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>Attendance Roster Sum for {monthStr}:</span>
                        <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono text-xs">
                          {attendanceSummary?.totalHoursWorked ?? 0} hrs
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        {attendanceSummary?.daysPresent ?? 0} present days • {attendanceSummary?.daysLate ?? 0} late days
                        {attendanceSummary?.daysOnLeave ? ` • ${attendanceSummary.daysOnLeave} on leave` : ""}
                        {" "}(summed from daily teacher roster)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (attendanceSummary) {
                          form.setValue("totalHoursWorked", attendanceSummary.totalHoursWorked);
                        }
                      }}
                      className="h-7 text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-100 font-semibold shadow-xs shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      Sync Attendance Sum ({attendanceSummary?.totalHoursWorked ?? 0}h)
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="hourlyRate" className="flex items-center gap-1 text-blue-600">
                      <Clock className="h-3.5 w-3.5" /> Hourly Rate ($/hr) *
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("hourlyRate", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="totalHoursWorked" className="flex items-center gap-1 text-blue-600">
                      <Clock className="h-3.5 w-3.5" /> Total Hours Worked in Month *
                    </Label>
                    <Input
                      id="totalHoursWorked"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 45.5"
                      {...form.register("totalHoursWorked", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Auto-summed or manually adjusted for extra classes/substitute hours.
                    </p>
                  </div>

                  <div className="sm:col-span-2 p-2.5 rounded-md bg-muted/60 border text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Base Calculation:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {watchedHoursWorked} hrs × ${Number(watchedHourlyRate).toFixed(2)}/hr ={" "}
                      <strong className="text-blue-700 text-sm">${calculatedBase.toFixed(2)}</strong>
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="baseSalary" className="flex items-center gap-1 text-emerald-600">
                    <DollarSign className="h-3.5 w-3.5" /> Monthly Base Salary ($/mo)
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("baseSalary", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Dynamic Itemized Adjustments (Bonuses & Deductions) */}
          <div className="space-y-3 p-4 rounded-xl bg-card border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Itemized Adjustments (Bonuses & Deductions)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Add performance incentives, attendance allowances, tax withholding, or advance repayments.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemType: PayrollItemTypeEnum.BONUS,
                      title: "Performance Bonus",
                      amount: 50,
                    })
                  }
                  className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-3 w-3" /> +Bonus
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemType: PayrollItemTypeEnum.DEDUCTION,
                      title: "Advance Salary Repayment",
                      amount: 20,
                    })
                  }
                  className="h-7 text-xs gap-1 text-rose-600 hover:text-rose-700"
                >
                  <Plus className="h-3 w-3" /> -Deduction
                </Button>
              </div>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2 text-center border border-dashed rounded-lg">
                No custom bonuses or deductions added. Click +Bonus or -Deduction above.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div className="col-span-3">
                      <select
                        aria-label="Item type"
                        {...form.register(`items.${idx}.itemType`)}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs font-semibold"
                      >
                        <option value={PayrollItemTypeEnum.BONUS}>+ Bonus</option>
                        <option value={PayrollItemTypeEnum.ALLOWANCE}>+ Allowance</option>
                        <option value={PayrollItemTypeEnum.OVERTIME}>+ Overtime</option>
                        <option value={PayrollItemTypeEnum.DEDUCTION}>- Deduction</option>
                        <option value={PayrollItemTypeEnum.TAX}>- Tax</option>
                        <option value={PayrollItemTypeEnum.ADVANCE_SALARY}>- Salary Advance</option>
                      </select>
                    </div>

                    <div className="col-span-5">
                      <Input
                        placeholder="Description (e.g. Student Retention)"
                        {...form.register(`items.${idx}.title`)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount ($)"
                        {...form.register(`items.${idx}.amount`, { valueAsNumber: true })}
                        className="h-8 text-xs font-medium"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(idx)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Live Math Breakdown Card */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Calculator className="h-4 w-4" />
              Real-Time Payroll Calculation Breakdown
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-muted-foreground block">Base Amount</span>
                <span className="font-semibold text-foreground">
                  ${calculatedBase.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total Bonuses</span>
                <span className="font-semibold text-emerald-600">
                  +${calculatedBonuses.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total Deductions</span>
                <span className="font-semibold text-rose-600">
                  -${calculatedDeductions.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Estimated Net Pay</span>
                <span className="text-base font-bold text-primary">
                  ${calculatedNet.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Disbursement Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Internal remarks for accounting..."
              {...form.register("notes")}
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
              {isEditing ? "Update Payroll Draft" : "Issue Payroll Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
