import React, { useState } from "react";
import { User, Menu } from "lucide-react";
import { useAuthStore } from "@/features/auth";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const [openOrders, setOpenOrders] = useState(true);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 sm:px-6 shadow-xs border-b border-slate-100">
      {/* Left section: Mobile Menu Toggle & Brand Logo */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              D1
            </span>
            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-[#F05A4A] bg-[#FFF0EE] rounded-sm w-fit leading-none">
              CMS_ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Open Orders Toggle, Online Status, User Profile Avatar */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={openOrders}
            onClick={() => setOpenOrders(!openOrders)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              openOrders ? "bg-[#4CAF50]" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                openOrders ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-slate-700 select-none">
            Open Orders
          </span>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300 cursor-pointer shadow-xs">
            <User className="w-5 h-5" />
          </div>
          {user && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-700">
              {user.username}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
