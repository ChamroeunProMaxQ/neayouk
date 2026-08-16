import { type FC } from "react";
import type { UserAttribute } from "@repo/contracts";
import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userToDelete?: UserAttribute | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const DeleteUserDialog: FC<DeleteUserDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userToDelete,
  isLoading = false,
  error = null,
}) => {
  if (!isOpen || !userToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close delete dialog backdrop"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-default"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-bold text-slate-800">
                Delete User
              </h2>
              <p className="text-xs text-slate-500">Soft delete account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-800">Delete Failed</p>
              <p className="mt-0.5">{error.message || "Failed to delete user."}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to delete user{" "}
          <strong className="text-slate-900 font-semibold">
            {userToDelete.username}
          </strong>
          ? This will soft-delete their account and hide them from active listings.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
