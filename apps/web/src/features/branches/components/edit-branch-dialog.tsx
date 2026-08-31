import { useEffect, type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateBranchSchema,
  BranchStatusEnum,
  type BranchDto,
  type UpdateBranchDto,
} from "@repo/contracts";
import { X, Building2, Loader2 } from "lucide-react";

interface EditBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branch: BranchDto | null;
  onSubmit: (values: UpdateBranchDto) => Promise<void> | void;
  isLoading?: boolean;
}

export const EditBranchDialog: FC<EditBranchDialogProps> = ({
  isOpen,
  onClose,
  branch,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBranchDto>({
    resolver: zodResolver(UpdateBranchSchema),
    defaultValues: {
      name: branch?.name ?? "",
      code: branch?.code ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      email: branch?.email ?? "",
      status: branch?.status ?? BranchStatusEnum.ACTIVE,
    },
  });

  useEffect(() => {
    if (branch) {
      reset({
        name: branch.name,
        code: branch.code,
        address: branch.address ?? "",
        phone: branch.phone ?? "",
        email: branch.email ?? "",
        status: branch.status ?? BranchStatusEnum.ACTIVE,
      });
    }
  }, [branch, reset]);

  if (!isOpen || !branch) return null;

  const handleFormSubmit = async (data: UpdateBranchDto) => {
    await onSubmit(data);
    onClose();
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
        aria-labelledby="edit-branch-dialog-title"
        className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 id="edit-branch-dialog-title" className="text-xl font-bold text-slate-800">
              Edit Branch Information
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Update campus contact details and status for {branch.name}.
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <Building2 className="w-4 h-4" />
            <span>Branch Details</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / School Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Sunrise Academy"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch Code / Slug
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                {...register("address")}
                placeholder="Street address, city, district"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value={BranchStatusEnum.ACTIVE}>Active</option>
                <option value={BranchStatusEnum.INACTIVE}>Inactive</option>
              </select>
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
              <span>{isLoading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
