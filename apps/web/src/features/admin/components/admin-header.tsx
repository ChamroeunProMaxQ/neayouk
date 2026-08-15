import { useState, useRef, useEffect, type FC } from "react";
import { User, Menu, LogOut, X, Shield, ChevronDown, IdCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export const AdminHeader: FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleOpenAccountModal = () => {
    setIsAccountModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 sm:px-6 shadow-xs border-b border-slate-100">
      {/* Left section: Mobile Menu Toggle & Brand Logo */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden h-auto"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <img
            src="/neayouk_logo.svg"
            alt="Neayouk Logo"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              Neayouk
            </span>
            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-[#45AC5E] bg-[#EBF6EE] rounded-sm w-fit leading-none">
              CMS_ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Online Status, View Account & Logout Dropdown */}
      <div className="flex items-center gap-4">
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 hidden sm:flex">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span>Online</span>
        </div>

        {/* User Account Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-label="User Account Menu"
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF6EE] text-[#45AC5E] font-bold text-xs shadow-xs border border-[#45AC5E]/20">
              {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.username || "Admin User"}
              </span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight">
                {user?.userType || user?.type || "ADMIN"}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu Popup */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.username || "Admin User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/20">
                    {user?.userType || user?.type || "ADMIN"}
                  </span>
                  {user?.id && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: #{user.id}
                    </span>
                  )}
                </div>
              </div>

              {/* View Account Action */}
              <button
                type="button"
                onClick={handleOpenAccountModal}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-slate-500" />
                <span>View Account</span>
              </button>

              {/* Logout Action */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Account Details Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close account modal backdrop"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-default"
            onClick={() => setIsAccountModalOpen(false)}
          />

          {/* Modal Content Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#EBF6EE] text-[#45AC5E]">
                  <Shield className="w-4 h-4" />
                </div>
                <h2 id="account-modal-title" className="text-base font-bold text-slate-800">
                  Account Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close account dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Details Grid */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EBF6EE] text-[#45AC5E] font-extrabold text-base shadow-xs border border-[#45AC5E]/20">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.username || "Administrator"}
                  </p>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    Logged in as {user?.userType || user?.type || "ADMIN"}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">User ID:</span>
                  <span className="text-slate-800 font-mono font-semibold">
                    {user?.id || user?.sub || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/20">
                    {user?.userType || user?.type || "ADMIN"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Account Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAccountModalOpen(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
