import { FC, useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, Tag, Calendar } from "lucide-react";
import { type FeeStructureAttribute } from "@repo/contracts";
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
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";
import { useFeeStructuresQuery, useDeleteFeeStructureMutation } from "../hooks/use-fee-structures";
import { FeeStructureDialog } from "./fee-structure-dialog";

export const FeeStructureListTable: FC = () => {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeStructureAttribute | null>(null);

  const { data: response, isLoading } = useFeeStructuresQuery({
    search: debouncedSearch,
  });

  const deleteMutation = useDeleteFeeStructureMutation();

  const feeStructures = useMemo(() => response?.data ?? [], [response]);

  const handleCreate = () => {
    setSelectedFee(null);
    setDialogOpen(true);
  };

  const handleEdit = (fee: FeeStructureAttribute) => {
    setSelectedFee(fee);
    setDialogOpen(true);
  };

  const handleDelete = (fee: FeeStructureAttribute) => {
    if (confirm(`Are you sure you want to delete fee structure "${fee.name}"?`)) {
      deleteMutation.mutate(fee.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fee structures..."
            className="pl-9"
          />
        </div>

        {can("create", "fee") && (
          <Button onClick={handleCreate} className="bg-[#45AC5E] hover:bg-[#3b9450]">
            <Plus className="mr-2 h-4 w-4" /> Add Fee Structure
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Fee Name / Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Amount ($)</TableHead>
              <TableHead>Optional</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Loading fee structures...
                </TableCell>
              </TableRow>
            ) : feeStructures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No fee structures found. Click "Add Fee Structure" to create one.
                </TableCell>
              </TableRow>
            ) : (
              feeStructures.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {fee.name}
                    {fee.description && (
                      <p className="text-xs font-normal text-slate-500">{fee.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100 font-medium text-slate-700">
                      <Tag className="mr-1 h-3 w-3" /> {fee.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center text-xs text-slate-600 font-medium">
                      <Calendar className="mr-1 h-3 w-3 text-slate-400" />
                      {fee.billingCycle}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    ${fee.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {fee.isOptional ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">Optional</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Mandatory</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {fee.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {can("update", "fee") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(fee)}
                          className="h-8 w-8 text-slate-600 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {can("delete", "fee") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(fee)}
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

      {/* Dialog Modal */}
      <FeeStructureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feeStructure={selectedFee}
      />
    </div>
  );
};
