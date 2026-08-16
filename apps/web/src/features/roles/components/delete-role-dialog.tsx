import { type FC } from "react";
import { type RoleDto } from "@repo/contracts";
import { AlertCircle, AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  roleToDelete?: RoleDto | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const DeleteRoleDialog: FC<DeleteRoleDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roleToDelete,
  isLoading = false,
  error = null,
}) => {
  if (!isOpen || !roleToDelete) return null;

  const isSystemAdmin = roleToDelete.slug === "admin" || roleToDelete.slug === "ADMIN";

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
        aria-labelledby="delete-role-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 id="delete-role-dialog-title" className="text-base font-bold text-slate-800">
              Delete Role
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSystemAdmin ? (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold">Protected System Role</p>
              <p>
                The default <strong>{roleToDelete.name}</strong> role is a vital system component and cannot be deleted.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={onClose} variant="outline" className="cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-800">Delete Failed</p>
                  <p className="mt-0.5">{error.message || "Failed to delete role."}</p>
                </div>
              </div>
            )}

            <p className="text-xs leading-relaxed text-slate-600">
              Are you sure you want to delete the role{" "}
              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                {roleToDelete.name} ({roleToDelete.slug})
              </span>
              ? Users assigned to this role will immediately lose all associated privileges.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                onClick={onConfirm}
                disabled={isLoading}
                className="cursor-pointer inline-flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
