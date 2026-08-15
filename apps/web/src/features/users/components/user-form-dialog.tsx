import React from "react";
import { type UserAttribute } from "@repo/contracts";
import { X } from "lucide-react";
import { UserForm, type UserFormValues } from "./user-form";

export type { UserFormValues };

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  userToEdit?: UserAttribute | null;
  isLoading?: boolean;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userToEdit,
  isLoading = false,
}) => {
  const isEdit = Boolean(userToEdit);

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
        aria-labelledby="user-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 id="user-dialog-title" className="text-lg font-bold text-slate-800">
            {isEdit ? "Edit User" : "Create New User"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Independent User Form */}
        <UserForm
          key={userToEdit ? `edit-${userToEdit.id}` : "create-user"}
          onSubmit={onSubmit}
          onCancel={onClose}
          userToEdit={userToEdit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
