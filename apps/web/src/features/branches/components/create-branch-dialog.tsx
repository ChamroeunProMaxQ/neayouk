import { type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateBranchWithAdminSchema,
  type CreateBranchWithAdminDto,
} from "@repo/contracts";
import { X, Building2, UserCheck, Loader2 } from "lucide-react";

interface CreateBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBranchWithAdminDto) => Promise<void> | void;
  isLoading?: boolean;
}

export const CreateBranchDialog: FC<CreateBranchDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBranchWithAdminDto>({
    resolver: zodResolver(CreateBranchWithAdminSchema),
    defaultValues: {
      branchName: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      adminUsername: "",
      adminPassword: "",
      adminName: "",
      adminEmail: "",
      adminPhone: "",
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CreateBranchWithAdminDto) => {
    await onSubmit(data);
    reset();
  };

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
        aria-labelledby="branch-dialog-title"
        className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 id="branch-dialog-title" className="text-xl font-bold text-slate-800">
              Provision New Branch & Admin
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Create a new school campus and its default branch administrator account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Section 1: Branch Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <Building2 className="w-4 h-4" />
              <span>Branch / Campus Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch / School Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("branchName")}
                  placeholder="e.g. Sunrise Academy"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.branchName && (
                  <p className="text-xs text-red-500 mt-1">{errors.branchName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Code / Slug <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("code")}
                  placeholder="e.g. SUNRISE"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase"
                />
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  {...register("phone")}
                  placeholder="+855 12 345 678"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  {...register("email")}
                  placeholder="info@school.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  {...register("address")}
                  placeholder="Street address, city, district"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Initial Branch Admin Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
              <UserCheck className="w-4 h-4" />
              <span>Initial Branch Admin Account</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("adminName")}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.adminName && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Username <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("adminUsername")}
                  placeholder="e.g. sunrise_admin"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.adminUsername && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminUsername.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("adminPassword")}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.adminPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
                <input
                  {...register("adminEmail")}
                  placeholder="admin@school.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#45AC5E] hover:bg-[#3d9a53] disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? "Provisioning..." : "Provision Branch"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
