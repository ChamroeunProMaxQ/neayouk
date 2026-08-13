import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  UserCheck,
  Tag,
  Ticket,
  Percent,
  LayoutGrid,
  Package,
  Image,
  Bell,
  Zap,
  MapPin,
  Clock,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCollapsible?: boolean;
  subItems?: string[];
}

export interface NavGroup {
  groupHeader?: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  className?: string;
}

const adminNavGroups: NavGroup[] = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "customer-orders", label: "Customer Orders", icon: ShoppingBag },
      { id: "customer-list", label: "Customer List", icon: UserCheck },
    ],
  },
  {
    groupHeader: "Store Managements",
    items: [
      {
        id: "promo-campaign",
        label: "Promo and Campaign",
        icon: Tag,
        isCollapsible: true,
        subItems: ["Campaign List", "Promotions"],
      },
      { id: "coupon", label: "Coupon", icon: Ticket },
      { id: "discounts", label: "Discounts", icon: Percent },
      { id: "product-display", label: "Product Display", icon: LayoutGrid },
      { id: "product-category", label: "Product and Category", icon: Package },
      { id: "banner-ads", label: "Banner Ads", icon: Image },
      { id: "notifications", label: "Notifications", icon: Bell },
      {
        id: "operation-settings",
        label: "Operation Settings",
        icon: Zap,
        isCollapsible: true,
        subItems: ["General Rules", "Fulfillment"],
      },
      { id: "delivery-zone", label: "Delivery Zone", icon: MapPin },
      { id: "delivery-timeslots", label: "Delivery Timeslots", icon: Clock },
    ],
  },
  {
    groupHeader: "System Management",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        isCollapsible: true,
        subItems: ["General", "Roles & Permissions"],
      },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab = "customer-list",
  onSelectTab,
  className = "",
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`w-64 shrink-0 bg-white py-4 px-3 flex flex-col gap-4 overflow-y-auto select-none ${className}`}
    >
      {adminNavGroups.map((group, index) => (
        <div key={index} className="space-y-1">
          {group.groupHeader && (
            <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              {group.groupHeader}
            </h3>
          )}
          <nav className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isExpanded = !!expandedSections[item.id];

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.isCollapsible) {
                        toggleSection(item.id);
                      }
                      onSelectTab?.(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 relative ${
                      isActive
                        ? "text-[#F05A4A] bg-[#FFF0EE] border-r-4 border-[#F05A4A]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#F05A4A]" : "text-slate-500"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.isCollapsible && (
                      <span className="text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </button>

                  {/* Submenu if expanded */}
                  {item.isCollapsible && isExpanded && item.subItems && (
                    <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                      {item.subItems.map((sub, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectTab?.(`${item.id}-${idx}`)}
                          className="block w-full text-left py-1.5 px-2 text-xs font-medium text-slate-500 hover:text-[#F05A4A] hover:bg-slate-50 rounded"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
};
