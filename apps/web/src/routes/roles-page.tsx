import { type FC } from "react";
import { RoleListTable } from "@/features/roles";
import { ShieldCheck, Sparkles } from "lucide-react";

export const RolesPage: FC = () => {
  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>User Management</span>
            <span>/</span>
            <span className="text-[#45AC5E]">Roles & Permissions</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Roles & Permissions
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Engine</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create custom functional roles, configure granular permission capabilities, and control user access across all system modules.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-2xs font-medium">
          <Sparkles className="w-4 h-4 text-[#45AC5E]" />
          <span>Granular Module & Capability Control</span>
        </div>
      </div>

      {/* Role List Table */}
      <RoleListTable />
    </div>
  );
};
