import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateSchoolExpenseSchema,
  ExpenseCategoryEnum,
  PaymentMethodEnum,
  type CreateSchoolExpenseDto,
  type SchoolExpenseAttribute,
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateExpenseMutation, useUpdateExpenseMutation } from "../hooks/use-expenses";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: SchoolExpenseAttribute | null;
}

export const ExpenseDialog: FC<ExpenseDialogProps> = ({
  open,
  onOpenChange,
  expense,
}) => {
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation();
  const isEditing = Boolean(expense);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSchoolExpenseDto>({
    resolver: zodResolver(CreateSchoolExpenseSchema),
    defaultValues: {
      title: "",
      category: ExpenseCategoryEnum.OTHER,
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      vendor: "",
      paymentMethod: PaymentMethodEnum.CASH,
      receiptRef: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        title: expense.title,
        category: expense.category as ExpenseCategoryEnum,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        vendor: expense.vendor ?? "",
        paymentMethod: expense.paymentMethod as PaymentMethodEnum,
        receiptRef: expense.receiptRef ?? "",
        notes: expense.notes ?? "",
      });
    } else {
      reset({
        title: "",
        category: ExpenseCategoryEnum.OTHER,
        amount: 0,
        expenseDate: new Date().toISOString().split("T")[0],
        vendor: "",
        paymentMethod: PaymentMethodEnum.CASH,
        receiptRef: "",
        notes: "",
      });
    }
  }, [expense, reset, open]);

  const onSubmit = (data: CreateSchoolExpenseDto) => {
    if (isEditing && expense) {
      updateMutation.mutate(
        { id: expense.id, dto: data },
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
            {isEditing ? "Edit School Expense" : "Record Operational Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-sm">
          <div className="space-y-1">
            <Label htmlFor="title">Expense Title</Label>
            <Input
              id="title"
              placeholder="e.g. Air Conditioner Repair, ISP Internet Bill"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={watch("category")}
                onValueChange={(val) => setValue("category", val as ExpenseCategoryEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ExpenseCategoryEnum.SALARY}>Salary & Staff</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.UTILITIES}>Utilities (Power/Water/Internet)</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.MAINTENANCE}>Maintenance & Repairs</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.SUPPLIES}>Office & Classroom Supplies</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.TRANSPORT}>Transport & Fleet</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.EVENTS}>School Events</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.EQUIPMENT}>Equipment Purchase</SelectItem>
                  <SelectItem value={ExpenseCategoryEnum.OTHER}>Other Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="expenseDate">Expense Incur Date</Label>
              <Input id="expenseDate" type="date" {...register("expenseDate")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="vendor">Vendor / Payee</Label>
              <Input id="vendor" placeholder="e.g. Cooling Tech Co." {...register("vendor")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select
                value={watch("paymentMethod")}
                onValueChange={(val) => setValue("paymentMethod", val as PaymentMethodEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethodEnum.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethodEnum.BANK_TRANSFER}>Bank Transfer</SelectItem>
                  <SelectItem value={PaymentMethodEnum.CREDIT_CARD}>Credit Card</SelectItem>
                  <SelectItem value={PaymentMethodEnum.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="receiptRef">Receipt / Ref #</Label>
              <Input id="receiptRef" placeholder="e.g. EXP-801, Invoice #12" {...register("receiptRef")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <Textarea id="notes" placeholder="Expense description or details..." rows={2} {...register("notes")} />
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            Note: New expenses start with status <strong>PENDING</strong> and require manager approval.
          </p>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-[#45AC5E] hover:bg-[#3b9450]">
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
