import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export const ForbiddenPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 text-center select-none animate-in fade-in duration-200">
      <div className="w-20 h-20 mb-6 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-sm">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 rounded-full mb-3">
        403 Forbidden
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
        Access Restricted
      </h1>

      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        You do not have the required permissions or role to view this resource.
        If you think this is a mistake, please contact your system administrator.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#45AC5E] hover:bg-[#3d9853] shadow-sm transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
