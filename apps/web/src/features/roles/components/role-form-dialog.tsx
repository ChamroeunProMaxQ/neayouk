import { type FC } from "react";
import { type RoleDto } from "@repo/contracts";
import { X } from "lucide-react";
import { RoleForm, type RoleFormValues } from "./role-form";

export type { RoleFormValues };

interface RoleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  roleToEdit?: RoleDto | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const RoleFormDialog: FC<RoleFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roleToEdit,
  isLoading = false,
  error = null,
}) => {
  const isEdit = Boolean(roleToEdit);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-default"
        onClick={onClose}
      />

      {/* Dialog Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-dialog-title"
        className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 id="role-dialog-title" className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit Role & Permissions" : "Create New Role"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit
                ? "Update role attributes and associated access capabilities."
                : "Define a new system role and assign modular permission sets."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Independent Role Form */}
        <RoleForm
          key={roleToEdit ? `edit-role-${roleToEdit.id}` : "create-role"}
          onSubmit={onSubmit}
          onCancel={onClose}
          roleToEdit={roleToEdit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};
