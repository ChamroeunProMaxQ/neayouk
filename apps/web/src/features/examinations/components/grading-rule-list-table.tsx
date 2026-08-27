import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
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
  const [editingRule, setEditingRule] = useState<GradingRuleAttribute | null>(null);

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

  const columns = useMemo<ColumnDef<GradingRuleAttribute>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => <span className="text-xs font-bold text-slate-700">Scheme Name</span>,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
              {rule.isDefault && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#45AC5E]">
                  <CheckCircle2 className="h-3 w-3" />
                  Default System Rule
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "code",
        header: () => <span className="text-xs font-bold text-slate-700">Code</span>,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-slate-600">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "components",
        header: () => <span className="text-xs font-bold text-slate-700">Components & Weight Breakdown</span>,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex flex-wrap gap-1.5">
              {rule.components.map((comp) => (
                <span
                  key={comp.id}
                  className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium"
                >
                  {comp.name}: <strong className="ml-1 text-slate-900">{comp.weight}%</strong>
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center text-xs font-bold text-slate-700">Status</div>,
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return (
            <div className="text-center">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                  }`}
              >
                {s}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center text-xs font-bold text-slate-700">Actions</div>,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center justify-center gap-1">
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(rule)}
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
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
                  className="h-8 w-8 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete Scheme"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  const table = useReactTable({
    data: rulesList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header with Create Action */}
      <div className="flex items-center justify-end">
        {canManage && (
          <Button
            type="button"
            onClick={handleCreate}
            disabled={rulesList.length > 0}
            className="gap-1.5 bg-[#45AC5E] text-xs font-bold text-white hover:bg-[#3d9852] disabled:opacity-50 cursor-pointer"
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-slate-200">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-3 px-4 text-xs font-bold text-slate-700">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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

