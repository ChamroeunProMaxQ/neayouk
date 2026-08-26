import { FC, useState, useMemo } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useStudentsQuery } from "@/features/students/hooks/use-students-infinite-query";
import { useFeeStructuresQuery } from "../hooks/use-fee-structures";
import { useGenerateBatchInvoicesMutation } from "../hooks/use-invoices";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GenerateInvoiceDialog: FC<GenerateInvoiceDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedFeeStructureIds, setSelectedFeeStructureIds] = useState<number[]>([]);
  const [billingYear, setBillingYear] = useState<number>(new Date().getFullYear());
  const [billingMonth, setBillingMonth] = useState<number>(new Date().getMonth() + 1);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [customItems, setCustomItems] = useState<{ title: string; amount: number }[]>([]);

  // Queries
  const { data: studentsResponse, isLoading: loadingStudents } = useStudentsQuery({
    search: studentSearch,
    pageSize: 50,
  });
  const students = useMemo(() => studentsResponse?.data ?? [], [studentsResponse]);

  const { data: feeStructuresResponse } = useFeeStructuresQuery({ isActive: true });
  const feeStructures = useMemo(() => feeStructuresResponse?.data ?? [], [feeStructuresResponse]);

  const generateMutation = useGenerateBatchInvoicesMutation();

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleToggleFeeStructure = (id: number) => {
    setSelectedFeeStructureIds((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const handleAddCustomItem = () => {
    setCustomItems((prev) => [...prev, { title: "", amount: 0 }]);
  };

  const handleRemoveCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCustomItemChange = (index: number, field: "title" | "amount", value: any) => {
    setCustomItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          title: field === "title" ? String(value) : item.title,
          amount: field === "amount" ? Number(value) : item.amount,
        };
      })
    );
  };

  const handleSubmit = () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student.");
      return;
    }
    if (selectedFeeStructureIds.length === 0 && customItems.length === 0) {
      alert("Please select at least one fee structure or add a custom line item.");
      return;
    }

    generateMutation.mutate(
      {
        studentIds: selectedStudentIds,
        billingYear,
        billingMonth,
        discountAmount,
        feeStructureIds: selectedFeeStructureIds,
        customItems: customItems
          .filter((item) => item.title.trim().length > 0)
          .map((item) => ({ title: item.title, amount: Number(item.amount ?? 0) })),
        notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedStudentIds([]);
          setSelectedFeeStructureIds([]);
          setCustomItems([]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Student Invoices</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Billing Month (1-12)</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={billingMonth}
                onChange={(e) => setBillingMonth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Billing Year</Label>
              <Input
                type="number"
                value={billingYear}
                onChange={(e) => setBillingYear(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Student Selection with Name Search */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-800">
                1. Select Target Students ({selectedStudentIds.length} selected)
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={students.length > 0 && selectedStudentIds.length === students.length}
                  onCheckedChange={(checked) => handleSelectAllStudents(Boolean(checked))}
                />
                <label htmlFor="selectAll" className="text-xs font-medium text-slate-600 cursor-pointer">
                  Select All
                </label>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student by name or code..."
                className="pl-9 h-8 text-xs"
              />
            </div>

            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 p-2 space-y-1 bg-slate-50">
              {loadingStudents ? (
                <p className="text-xs text-slate-500 py-2 text-center">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No students found matching filter.</p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleToggleStudent(student.id)}
                    className="flex items-center space-x-2 px-2 py-1 hover:bg-white rounded cursor-pointer text-xs"
                  >
                    <Checkbox checked={selectedStudentIds.includes(student.id)} />
                    <span className="font-medium text-slate-900">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-slate-500">({student.studentCode || `ID: ${student.id}`})</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fee Structures Selection */}
          <div className="space-y-2 border-t pt-4">
            <Label className="font-semibold text-slate-800">
              2. Select Fee Structure Items
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border rounded-md p-2 bg-slate-50">
              {feeStructures.map((fee) => (
                <div
                  key={fee.id}
                  onClick={() => handleToggleFeeStructure(fee.id)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                >
                  <Checkbox checked={selectedFeeStructureIds.includes(fee.id)} />
                  <div>
                    <p className="font-semibold text-slate-800">{fee.name}</p>
                    <p className="text-slate-500">${fee.amount.toFixed(2)} ({fee.billingCycle})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Ad-Hoc Line Items */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-slate-800">
                3. Custom Ad-Hoc Line Items (Optional)
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddCustomItem} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add Custom Line Item
              </Button>
            </div>

            {customItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Item Title (e.g. Science Lab Fee)"
                  value={item.title}
                  onChange={(e) => handleCustomItemChange(idx, "title", e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={item.amount || ""}
                  onChange={(e) => handleCustomItemChange(idx, "amount", e.target.value)}
                  className="h-8 text-xs w-28"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveCustomItem(idx)}
                  className="h-8 w-8 text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-1">
              <Label>Discount Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes / Payment Terms</Label>
              <Input
                placeholder="Due date notice or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={generateMutation.isPending}
            className="bg-[#45AC5E] hover:bg-[#3b9450]"
          >
            {generateMutation.isPending ? "Generating..." : `Generate Invoices (${selectedStudentIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
