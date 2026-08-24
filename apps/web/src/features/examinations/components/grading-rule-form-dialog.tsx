import { useState, useEffect, type FC } from "react";
import {
  type GradingRuleAttribute,
  type CreateGradingRuleDto,
  type GradingRuleComponent,
  type GradeScaleItem,
  DefaultGradingComponents,
  DefaultGradeScale,
} from "@repo/contracts";
import {
  useCreateGradingRuleMutation,
  useUpdateGradingRuleMutation,
} from "../hooks/use-grading-rules-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface GradingRuleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: GradingRuleAttribute | null;
}

export const GradingRuleFormDialog: FC<GradingRuleFormDialogProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [isDefault, setIsDefault] = useState(true);
  const [components, setComponents] = useState<GradingRuleComponent[]>(
    DefaultGradingComponents
  );
  const [gradeScale, setGradeScale] = useState<GradeScaleItem[]>(DefaultGradeScale);

  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name);
      setCode(ruleToEdit.code);
      setAcademicYear(ruleToEdit.academicYear || "2025-2026");
      setIsDefault(ruleToEdit.isDefault);
      setComponents(ruleToEdit.components || DefaultGradingComponents);
      setGradeScale(ruleToEdit.gradeScale || DefaultGradeScale);
    } else {
      setName("");
      setCode("");
      setAcademicYear("2025-2026");
      setIsDefault(false);
      setComponents(DefaultGradingComponents);
      setGradeScale(DefaultGradeScale);
    }
  }, [ruleToEdit, isOpen]);

  const createMutation = useCreateGradingRuleMutation();
  const updateMutation = useUpdateGradingRuleMutation();

  const totalWeight = components.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0
  );
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  const handleAddComponent = () => {
    const id = `comp_${Date.now()}`;
    setComponents((prev) => [
      ...prev,
      { id, name: "New Component", maxScore: 10, weight: 10 },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (
    index: number,
    field: keyof GradingRuleComponent,
    value: string | number
  ) => {
    setComponents((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (field === "maxScore" || field === "weight") {
          return { ...c, [field]: Number(value) || 0 };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid || !name.trim() || !code.trim()) return;

    const payload: CreateGradingRuleDto = {
      name: name.trim(),
      code: code.trim(),
      academicYear,
      components,
      gradeScale,
      isDefault,
      status: "ACTIVE",
    };

    if (ruleToEdit) {
      await updateMutation.mutateAsync({
        id: ruleToEdit.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    onClose();
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {ruleToEdit ? "Edit Grading Scheme" : "Create Master Grading Scheme"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Scheme Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Evaluation Scheme"
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">
                Scheme Code *
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. RULE-DEFAULT"
                required
                disabled={Boolean(ruleToEdit)}
                className="mt-1 text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Component weights editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Evaluation Criteria & Weights
                </h4>
                <p className="text-xs text-slate-500">
                  Configure raw max score and weight percentage for each skill.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddComponent}
                className="gap-1 text-xs font-semibold text-[#45AC5E]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Component
              </Button>
            </div>

            {/* Total weight check banner */}
            <div
              className={`flex items-center justify-between rounded-xl border p-3 text-xs font-semibold ${
                isWeightValid
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {isWeightValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>Total Allocated Weight: {totalWeight.toFixed(1)}%</span>
              </div>
              <span>{isWeightValid ? "Ready (100%)" : "Must equal exactly 100%"}</span>
            </div>

            {/* Dynamic components rows */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {components.map((comp, idx) => (
                <div
                  key={comp.id || idx}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                >
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-500">
                      Component Name
                    </label>
                    <Input
                      value={comp.name}
                      onChange={(e) =>
                        handleComponentChange(idx, "name", e.target.value)
                      }
                      className="h-8 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-medium text-slate-500">
                      Max Raw Score
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={comp.maxScore}
                      onChange={(e) =>
                        handleComponentChange(idx, "maxScore", e.target.value)
                      }
                      className="h-8 text-center text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-medium text-slate-500">
                      Weight (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={comp.weight}
                      onChange={(e) =>
                        handleComponentChange(idx, "weight", e.target.value)
                      }
                      className="h-8 text-center text-xs font-bold text-[#45AC5E]"
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveComponent(idx)}
                    disabled={components.length <= 1}
                    className="mt-3.5 h-8 w-8 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isWeightValid || isSubmitting}
              className="bg-[#45AC5E] font-bold text-white hover:bg-[#3d9852]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : ruleToEdit ? (
                "Update Scheme"
              ) : (
                "Create Scheme"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
