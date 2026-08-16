import { type FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatPathTitle(pathname: string): { category: string; pageTitle: string } {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { category: "Overview", pageTitle: "Dashboard" };

  const formatWord = (str?: string) =>
    (str || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const category = formatWord(parts[0]);
  const pageTitle = parts.length > 1 ? formatWord(parts[1]) : category;

  return { category, pageTitle };
}

export const DummyPage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, pageTitle } = formatPathTitle(location.pathname);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>School Management</span>
            <span>/</span>
            <span>{category}</span>
            <span>/</span>
            <span className="text-[#45AC5E]">{pageTitle}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="bg-[#45AC5E] hover:bg-[#3b9652] text-white cursor-pointer"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px] space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-[#EBF6EE] text-[#45AC5E] flex items-center justify-center shadow-xs border border-[#45AC5E]/20">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="max-w-md space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>School Management Module</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {pageTitle} Dashboard & Management
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            You are currently viewing the <span className="font-semibold text-slate-700">{location.pathname}</span> route. This module is active and ready for school data integration.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Live Route Sync
          </span>
          <span>•</span>
          <span className="font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {location.pathname}
          </span>
        </div>
      </div>
    </div>
  );
};
