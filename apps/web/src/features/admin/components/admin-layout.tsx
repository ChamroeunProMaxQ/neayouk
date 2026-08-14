import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <AdminHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Body Shell */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <AdminSidebar
          onSelectTab={() => setMobileSidebarOpen(false)}
          className="hidden lg:flex border-r border-slate-100"
        />

        {/* Mobile Backdrop & Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <button
              type="button"
              aria-label="Close Mobile Sidebar"
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-default"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <AdminSidebar
              onSelectTab={() => setMobileSidebarOpen(false)}
              className="relative z-50 h-full shadow-2xl"
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-full">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};
