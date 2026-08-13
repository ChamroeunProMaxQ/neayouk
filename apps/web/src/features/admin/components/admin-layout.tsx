import React, { useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { CustomerListTable } from "./customer-list-table";

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState("customer-list");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <AdminHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Body Shell */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setMobileSidebarOpen(false);
          }}
          className="hidden lg:flex border-r border-slate-100"
        />

        {/* Mobile Backdrop & Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              role="button"
              tabIndex={0}
              aria-label="Close Mobile Sidebar"
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter") setMobileSidebarOpen(false);
              }}
            />
            <AdminSidebar
              activeTab={activeTab}
              onSelectTab={(tabId) => {
                setActiveTab(tabId);
                setMobileSidebarOpen(false);
              }}
              className="relative z-50 h-full shadow-2xl"
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-full">
          {activeTab === "customer-list" ? (
            <CustomerListTable />
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-xs border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-bold text-slate-800 capitalize mb-2">
                {activeTab.replace("-", " ")} View
              </h2>
              <p className="text-sm text-slate-500 max-w-md">
                This section is currently under development. The active Customer List table is available under the Customer List tab.
              </p>
              <button
                onClick={() => setActiveTab("customer-list")}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#F05A4A] rounded-lg hover:bg-[#D94738] transition-colors"
              >
                Back to Customer List
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
