import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateFeeStructureSchema,
  FeeCategoryEnum,
  BillingCycleEnum,
  type CreateFeeStructureDto,
  type FeeStructureAttribute,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFeeStructureMutation, useUpdateFeeStructureMutation } from "../hooks/use-fee-structures";

interface FeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructure?: FeeStructureAttribute | null;
}

export const FeeStructureDialog: FC<FeeStructureDialogProps> = ({
  open,
  onOpenChange,
  feeStructure,
}) => {
  const createMutation = useCreateFeeStructureMutation();
  const updateMutation = useUpdateFeeStructureMutation();
  const isEditing = Boolean(feeStructure);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFeeStructureDto>({
    resolver: zodResolver(CreateFeeStructureSchema),
    defaultValues: {
      name: "",
      category: FeeCategoryEnum.TUITION,
      amount: 0,
      billingCycle: BillingCycleEnum.MONTHLY,
      isOptional: false,
      isActive: true,
      description: "",
    },
  });

  useEffect(() => {
    if (feeStructure) {
      reset({
        name: feeStructure.name,
        category: feeStructure.category as FeeCategoryEnum,
        amount: feeStructure.amount,
        billingCycle: feeStructure.billingCycle as BillingCycleEnum,
        isOptional: feeStructure.isOptional ?? false,
        isActive: feeStructure.isActive ?? true,
        description: feeStructure.description ?? "",
      });
    } else {
      reset({
        name: "",
        category: FeeCategoryEnum.TUITION,
        amount: 0,
        billingCycle: BillingCycleEnum.MONTHLY,
        isOptional: false,
        isActive: true,
        description: "",
      });
    }
  }, [feeStructure, reset, open]);

  const onSubmit = (data: CreateFeeStructureDto) => {
    if (isEditing && feeStructure) {
      updateMutation.mutate(
        { id: feeStructure.id, dto: data },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Fee Structure" : "Create Fee Structure"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Fee Name / Variant</Label>
            <Input
              id="name"
              placeholder="e.g. School Uniform - Size M, Grade 10 Tuition"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={watch("category")}
                onValueChange={(val) => setValue("category", val as FeeCategoryEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FeeCategoryEnum.TUITION}>Tuition</SelectItem>
                  <SelectItem value={FeeCategoryEnum.BOOK}>Book</SelectItem>
                  <SelectItem value={FeeCategoryEnum.UNIFORM}>Uniform</SelectItem>
                  <SelectItem value={FeeCategoryEnum.REGISTRATION}>Registration</SelectItem>
                  <SelectItem value={FeeCategoryEnum.TRANSPORTATION}>Transportation</SelectItem>
                  <SelectItem value={FeeCategoryEnum.MEALS}>Meals</SelectItem>
                  <SelectItem value={FeeCategoryEnum.ACTIVITIES}>Activities</SelectItem>
                  <SelectItem value={FeeCategoryEnum.EXAM}>Exam</SelectItem>
                  <SelectItem value={FeeCategoryEnum.OTHER}>Other / Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-1">
              <Label>Billing Cycle</Label>
              <Select
                value={watch("billingCycle")}
                onValueChange={(val) => setValue("billingCycle", val as BillingCycleEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Billing Cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BillingCycleEnum.ONE_TIME}>One-Time</SelectItem>
                  <SelectItem value={BillingCycleEnum.MONTHLY}>Monthly</SelectItem>
                  <SelectItem value={BillingCycleEnum.QUARTERLY}>Quarterly</SelectItem>
                  <SelectItem value={BillingCycleEnum.SEMESTER}>Semester</SelectItem>
                  <SelectItem value={BillingCycleEnum.ANNUAL}>Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-rose-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOptional"
                checked={watch("isOptional")}
                onCheckedChange={(checked) => setValue("isOptional", Boolean(checked))}
              />
              <label htmlFor="isOptional" className="text-sm font-medium text-slate-700 cursor-pointer">
                Optional Fee
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", Boolean(checked))}
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Active Status
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Notes or item details..."
              rows={3}
              {...register("description")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-[#45AC5E] hover:bg-[#3b9450]">
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
