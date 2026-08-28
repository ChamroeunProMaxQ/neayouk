import { Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview and quick access to system management resources.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                User Management
              </span>
              <div className="p-2 bg-[#EBF6EE] rounded-lg text-[#45AC5E]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              View, search, filter, and manage user accounts with role permissions.
            </p>
          </div>
          <Link
            to="/users"
            className="inline-block mt-4 text-xs font-bold text-[#45AC5E] hover:underline"
          >
            Go to User List →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reports & Analytics
              </span>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Financial cash flows, academic grading distributions, and attendance intelligence.
            </p>
          </div>
          <Link
            to="/reports"
            className="inline-block mt-4 text-xs font-bold text-purple-600 hover:underline"
          >
            Open Reports Hub →
          </Link>
        </div>
      </div>

    </div>
  );
}
