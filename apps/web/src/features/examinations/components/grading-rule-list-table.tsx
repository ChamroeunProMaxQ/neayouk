import { useState, type FC } from "react";
import {
  type GradingRuleAttribute,
} from "@repo/contracts";
import {
  useGradingRulesQuery,
  useDeleteGradingRuleMutation,
} from "../hooks/use-grading-rules-query";
import { GradingRuleFormDialog } from "./grading-rule-form-dialog";
import { usePermission } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export const GradingRuleListTable: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "examination") || can("create", "examination");

  const { data, isLoading } = useGradingRulesQuery();
  const deleteMutation = useDeleteGradingRuleMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GradingRuleAttribute | null>(
    null
  );

  const handleCreate = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rule: GradingRuleAttribute) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this grading rule?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const rulesList = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header with Create Action */}
      <div className="flex items-center justify-end">

        {canManage && (
          <Button
            type="button"
            onClick={handleCreate}
            disabled={rulesList.length > 0}
            className="gap-1.5 bg-[#45AC5E] text-xs font-bold text-white hover:bg-[#3d9852] disabled:opacity-50"
            title={
              rulesList.length > 0
                ? "A master grading scheme is already configured. Click Edit on the rule below to make changes."
                : "Create master grading scheme"
            }
          >
            <Plus className="h-4 w-4" />
            New Grading Scheme
          </Button>
        )}
      </div>

      {/* Rules Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#45AC5E]" />
          </div>
        ) : rulesList.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No grading schemes configured yet.
          </div>
        ) : (
          <Table className="w-full text-left text-sm">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-48 text-xs font-bold text-slate-700">
                  Scheme Name
                </TableHead>
                <TableHead className="w-32 text-xs font-bold text-slate-700">
                  Code
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Components & Weight Breakdown
                </TableHead>
                <TableHead className="w-28 text-center text-xs font-bold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="w-24 text-center text-xs font-bold text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {rulesList.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-slate-50/50">
                  {/* Name */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {rule.name}
                      </span>
                      {rule.isDefault && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#45AC5E]">
                          <CheckCircle2 className="h-3 w-3" />
                          Default System Rule
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Code */}
                  <TableCell className="font-mono text-xs text-slate-600">
                    {rule.code}
                  </TableCell>

                  {/* Components */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.components.map((comp) => (
                        <span
                          key={comp.id}
                          className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium"
                        >
                          {comp.name}:{" "}
                          <strong className="ml-1 text-slate-900">
                            {comp.weight}%
                          </strong>
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${rule.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {rule.status}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          title="Edit Scheme"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {canManage && !rule.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          title="Delete Scheme"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <GradingRuleFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        ruleToEdit={editingRule}
      />
    </div>
  );
};
