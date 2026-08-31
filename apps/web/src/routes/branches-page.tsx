import { BranchListTable } from "@/features/branches";

export function BranchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Branches & Campuses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage platform schools, provision default campus branches, and assign branch administrators.
        </p>
      </div>
      <BranchListTable />
    </div>
  );
}
