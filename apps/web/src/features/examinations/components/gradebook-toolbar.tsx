import { type FC } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  RotateCcw,
  FileText,
  BarChart3,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface GradebookToolbarProps {
  isDirty: boolean;
  dirtyCount: number;
  hasInvalidScore?: boolean;
  isSaving: boolean;
  isExportingPdf?: boolean;
  onSave: () => void;
  onReset: () => void;
  onExportPdf: () => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
  canManage: boolean;
}

export const GradebookToolbar: FC<GradebookToolbarProps> = ({
  isDirty,
  dirtyCount,
  hasInvalidScore = false,
  isSaving,
  isExportingPdf = false,
  onSave,
  onReset,
  onExportPdf,
  showAnalytics,
  onToggleAnalytics,
  canManage,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Status / Dirty Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {hasInvalidScore ? (
          <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Scores exceed maximum allowed limit
          </div>
        ) : isDirty ? (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5" />
            {dirtyCount} unsaved student score changes
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <Check className="h-3.5 w-3.5" />
            All scores saved & synced
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleAnalytics}
          className={`gap-1.5 text-xs font-semibold transition-colors ${
            showAnalytics ? "border-[#45AC5E] bg-[#45AC5E]/10 text-[#45AC5E]" : "text-slate-700"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {showAnalytics ? "Hide Analytics" : "Class Analytics"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          {isExportingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 text-rose-600" />
              Export PDF
            </>
          )}
        </Button>

        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isSaving}
            className="gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </Button>
        )}

        {canManage && (
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={!isDirty || isSaving || hasInvalidScore}
            className="gap-1.5 bg-[#45AC5E] text-xs font-bold text-white shadow-sm hover:bg-[#3d9852] disabled:opacity-50"
            title={hasInvalidScore ? "Cannot save: some scores exceed the maximum limit" : undefined}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
