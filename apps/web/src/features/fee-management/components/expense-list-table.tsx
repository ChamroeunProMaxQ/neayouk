import { FC, useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { ExpenseCategoryEnum, ExpenseStatusEnum, type SchoolExpenseAttribute } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";
import { useExpensesQuery, useApproveExpenseMutation, useDeleteExpenseMutation } from "../hooks/use-expenses";
import { ExpenseDialog } from "./expense-dialog";

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const START_YEAR = 2025;
const currentYear = Math.max(START_YEAR, new Date().getFullYear());
const YEARS = [
  { value: "ALL", label: "All Years" },
  ...Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => {
    const yr = String(START_YEAR + i);
    return { value: yr, label: yr };
  }),
];

export const ExpenseListTable: FC = () => {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<SchoolExpenseAttribute | null>(null);

  const { startDate, endDate } = useMemo(() => {
    if (yearFilter === "ALL" && monthFilter === "ALL") {
      return { startDate: undefined, endDate: undefined };
    }
    const yr = yearFilter !== "ALL" ? Number(yearFilter) : new Date().getFullYear();
    if (monthFilter === "ALL") {
      return {
        startDate: `${yr}-01-01`,
        endDate: `${yr}-12-31`,
      };
    }
    const monthNum = Number(monthFilter);
    const lastDay = new Date(yr, monthNum, 0).getDate();
    return {
      startDate: `${yr}-${String(monthNum).padStart(2, "0")}-01`,
      endDate: `${yr}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [yearFilter, monthFilter]);

  const { data: response, isLoading } = useExpensesQuery({
    search: debouncedSearch,
    category: categoryFilter !== "ALL" ? (categoryFilter as ExpenseCategoryEnum) : undefined,
    status: statusFilter !== "ALL" ? (statusFilter as ExpenseStatusEnum) : undefined,
    startDate,
    endDate,
  });

  const expenses = useMemo(() => response?.data ?? [], [response]);
  const approveMutation = useApproveExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();

  const handleCreate = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleEdit = (exp: SchoolExpenseAttribute) => {
    setSelectedExpense(exp);
    setDialogOpen(true);
  };

  const handleApprove = (
    exp: SchoolExpenseAttribute,
    status: ExpenseStatusEnum.APPROVED | ExpenseStatusEnum.PAID | ExpenseStatusEnum.REJECTED
  ) => {
    approveMutation.mutate({ id: exp.id, dto: { status } });
  };

  const handleDelete = (exp: SchoolExpenseAttribute) => {
    if (confirm(`Are you sure you want to delete expense "${exp.title}"?`)) {
      deleteMutation.mutate(exp.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Actions & Filters */}
      <div className="flex flex-col gap-3.5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Row 1: Search & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses or vendor..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {can("create", "fee") && (
            <Button onClick={handleCreate} className="bg-[#45AC5E] hover:bg-[#3b9450] h-9 text-xs shrink-0 shadow-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Record Expense
            </Button>
          )}
        </div>

        {/* Row 2: All Select Filters in a Horizontal Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <Select value={monthFilter} onValueChange={setMonthFilter} className="w-36">
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter} className="w-28">
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y.value} value={y.value} className="text-xs">
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter} className="w-40">
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.SALARY} className="text-xs">Salary</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.UTILITIES} className="text-xs">Utilities</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.MAINTENANCE} className="text-xs">Maintenance</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.SUPPLIES} className="text-xs">Supplies</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.TRANSPORT} className="text-xs">Transport</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.EVENTS} className="text-xs">Events</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.EQUIPMENT} className="text-xs">Equipment</SelectItem>
              <SelectItem value={ExpenseCategoryEnum.OTHER} className="text-xs">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter} className="w-36">
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value={ExpenseStatusEnum.PENDING} className="text-xs">PENDING</SelectItem>
              <SelectItem value={ExpenseStatusEnum.APPROVED} className="text-xs">APPROVED</SelectItem>
              <SelectItem value={ExpenseStatusEnum.PAID} className="text-xs">PAID</SelectItem>
              <SelectItem value={ExpenseStatusEnum.REJECTED} className="text-xs">REJECTED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Title & Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Incur Date</TableHead>
              <TableHead>Vendor / Payee</TableHead>
              <TableHead>Amount ($)</TableHead>
              <TableHead>Approval Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Loading operational expenses...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No expenses recorded. Click "Record Expense" to create one.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {exp.title}
                    {exp.receiptRef && <p className="text-xs text-slate-500 font-normal">Ref: {exp.receiptRef}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100 font-medium text-slate-700">
                      {exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">
                    {String(exp.expenseDate)}
                  </TableCell>
                  <TableCell className="text-slate-800 font-medium">
                    {exp.vendor || "N/A"}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    ${exp.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        exp.status === ExpenseStatusEnum.APPROVED || exp.status === ExpenseStatusEnum.PAID
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : exp.status === ExpenseStatusEnum.REJECTED
                            ? "bg-rose-100 text-rose-800 hover:bg-rose-100"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {exp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Manager Approval Actions */}
                      {can("update", "fee") && exp.status === ExpenseStatusEnum.PENDING && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(exp, ExpenseStatusEnum.APPROVED)}
                            title="Approve Expense"
                            className="h-8 px-2 text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(exp, ExpenseStatusEnum.REJECTED)}
                            title="Reject Expense"
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      {can("update", "fee") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(exp)}
                          className="h-8 w-8 text-slate-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}

                      {can("delete", "fee") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(exp)}
                          className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expense Dialog */}
      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={selectedExpense} />
    </div>
  );
};
