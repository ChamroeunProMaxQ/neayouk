import { useState, useEffect, type FC, type ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bell,
  GraduationCap,
  ClipboardCheck,
  Award,
  CreditCard,
  Briefcase,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { usePermission } from "@/features/auth";
import { ResourceEnum, type UserTypeEnum } from "@repo/contracts";

export interface SubNavItem {
  label: string;
  path: string;
  requiredPermission?: { action: string; resource: ResourceEnum | string };
  requiredUserType?: UserTypeEnum | string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  path?: string;
  isCollapsible?: boolean;
  subItems?: (string | SubNavItem)[];
  requiredPermission?: { action: string; resource: ResourceEnum | string };
  requiredUserType?: UserTypeEnum | string;
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

export const adminNavGroups: NavGroup[] = [
  {
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
        requiredPermission: { action: "read", resource: ResourceEnum.DASHBOARD },
      },
      {
        id: "users",
        label: "User Management",
        icon: Users,
        path: "/users",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.USER },
        subItems: [
          { label: "Students", path: "/students", requiredPermission: { action: "read", resource: ResourceEnum.STUDENT } },
          { label: "Teachers", path: "/teachers", requiredPermission: { action: "read", resource: ResourceEnum.TEACHER } },
          { label: "User Accounts", path: "/users", requiredPermission: { action: "read", resource: ResourceEnum.USER } },
          { label: "Branches & Campuses", path: "/branches", requiredPermission: { action: "read", resource: ResourceEnum.BRANCH } },
          { label: "Roles & Permissions", path: "/users/roles", requiredPermission: { action: "read", resource: ResourceEnum.ROLE } },
        ],
      },
      {
        id: "announcements",
        label: "Announcements",
        icon: Bell,
        path: "/announcements",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.ANNOUNCEMENT },
        subItems: [
          { label: "Notices & Bulletins", path: "/announcements/notices", requiredPermission: { action: "read", resource: ResourceEnum.ANNOUNCEMENT } },
          { label: "SMS & Email Broadcasts", path: "/announcements/broadcasts", requiredPermission: { action: "read", resource: ResourceEnum.ANNOUNCEMENT } },
          { label: "School Events", path: "/announcements/events", requiredPermission: { action: "read", resource: ResourceEnum.ANNOUNCEMENT } },
        ],
      },
    ],
  },
  {
    groupHeader: "Academic Management",
    items: [
      {
        id: "academics",
        label: "Academics & Classes",
        icon: GraduationCap,
        path: "/academics",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.ACADEMIC },
        subItems: [
          {
            label: "Programs & Curriculum Books",
            path: "/academics/programs",
            requiredPermission: { action: "read", resource: ResourceEnum.PROGRAM },
          },
          {
            label: "Classes & Cohorts",
            path: "/academics/classes",
            requiredPermission: { action: "read", resource: ResourceEnum.CLASS },
          },
          {
            label: "Academic Years & Terms",
            path: "/academics/academic-years",
            requiredPermission: { action: "read", resource: ResourceEnum.ACADEMIC_YEAR },
          },
          // {
          //   label: "Class Timetable",
          //   path: "/academics/timetable",
          //   requiredPermission: { action: "read", resource: ResourceEnum.TIMETABLE },
          // },
        ],
      },
      {
        id: "attendance",
        label: "Attendance",
        icon: ClipboardCheck,
        path: "/attendance",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.ATTENDANCE },
        subItems: [
          {
            label: "Student Attendance",
            path: "/attendance/students",
            requiredPermission: { action: "read", resource: ResourceEnum.STUDENT_ATTENDANCE },
          },
          {
            label: "Teacher Attendance",
            path: "/attendance/teachers",
            requiredPermission: { action: "read", resource: ResourceEnum.TEACHER_ATTENDANCE },
          },
          {
            label: "Leave Requests",
            path: "/attendance/leave-requests",
            requiredPermission: { action: "read", resource: ResourceEnum.LEAVE_REQUEST },
          },
        ],
      },
      {
        id: "examinations",
        label: "Exams & Grades",
        icon: Award,
        path: "/examinations",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.EXAMINATION },
        subItems: [
          {
            label: "Gradebook",
            path: "/examinations/gradebook",
            requiredPermission: { action: "read", resource: ResourceEnum.EXAMINATION },
          },
          {
            label: "Report Cards",
            path: "/examinations/report-cards",
            requiredPermission: { action: "read", resource: ResourceEnum.REPORT_CARD },
          },
          {
            label: "Grading Rules",
            path: "/examinations/rules",
            requiredPermission: { action: "read", resource: ResourceEnum.GRADING_RULE },
          },
        ],
      },
    ],
  },
  {
    groupHeader: "School Operations",
    items: [
      {
        id: "fee-management",
        label: "Fee & Billing",
        icon: CreditCard,
        path: "/fee-management",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.FEE },
        subItems: [
          {
            label: "Fee Structures",
            path: "/fee-management/structures",
            requiredPermission: { action: "read", resource: ResourceEnum.FEE_STRUCTURE },
          },
          {
            label: "Invoices & Payments",
            path: "/fee-management/invoices",
            requiredPermission: { action: "read", resource: ResourceEnum.INVOICE },
          },
          {
            label: "Operational Expenses",
            path: "/fee-management/expenses",
            requiredPermission: { action: "read", resource: ResourceEnum.EXPENSE },
          },
        ],
      },
      {
        id: "hr-payroll",
        label: "HR & Payroll",
        icon: Briefcase,
        path: "/hr-payroll",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.HR },
        subItems: [
          {
            label: "Staff Directory",
            path: "/hr-payroll/staff",
            requiredPermission: { action: "read", resource: ResourceEnum.STAFF },
          },
          {
            label: "Payroll & Salary",
            path: "/hr-payroll/salary",
            requiredPermission: { action: "read", resource: ResourceEnum.PAYROLL },
          },
        ],
      },
    ],
  },
  {
    groupHeader: "System Management",
    items: [
      {
        id: "reports",
        label: "Reports & Analytics",
        icon: BarChart3,
        path: "/reports",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.REPORT },
        subItems: [
          {
            label: "Academic Reports",
            path: "/reports/academic",
            requiredPermission: { action: "read", resource: ResourceEnum.REPORT },
          },
          {
            label: "Attendance Analytics",
            path: "/reports/attendance",
            requiredPermission: { action: "read", resource: ResourceEnum.REPORT },
          },
          {
            label: "Financial Reports",
            path: "/reports/financial",
            requiredPermission: { action: "read", resource: ResourceEnum.REPORT },
          },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/settings",
        isCollapsible: true,
        requiredPermission: { action: "read", resource: ResourceEnum.SETTING },
        subItems: [
          {
            label: "School Profile",
            path: "/settings/profile",
            requiredPermission: { action: "read", resource: ResourceEnum.SETTING },
          },
          {
            label: "General Rules",
            path: "/settings/rules",
            requiredPermission: { action: "read", resource: ResourceEnum.SETTING },
          },
          {
            label: "Integrations",
            path: "/settings/integrations",
            requiredPermission: { action: "read", resource: ResourceEnum.SETTING },
          },
          {
            label: "Audit Logs",
            path: "/settings/audit-logs",
            requiredPermission: { action: "read", resource: ResourceEnum.SETTING },
          },
        ],
      },
    ],
  },
];

export const AdminSidebar: FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, isUserType } = usePermission();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Helper to check if a single sub nav item is permitted
  const checkSubItemPermitted = (sub: string | SubNavItem, parentItem: NavItem): boolean => {
    if (typeof sub === "object") {
      if (sub.requiredUserType && !isUserType(sub.requiredUserType)) {
        return false;
      }
      if (sub.requiredPermission) {
        return can(sub.requiredPermission.action, sub.requiredPermission.resource);
      }
    }
    if (parentItem.requiredPermission) {
      return can(parentItem.requiredPermission.action, parentItem.requiredPermission.resource);
    }
    return true;
  };

  // Helper to check if a nav item is enabled
  const checkItemEnabled = (item: NavItem): boolean => {
    if (item.requiredUserType && !isUserType(item.requiredUserType)) {
      return false;
    }

    // If item has sub-items, enable if parent permission matches OR any sub-item is permitted
    if (item.subItems && item.subItems.length > 0) {
      const hasAnyPermittedSub = item.subItems.some((sub) => checkSubItemPermitted(sub, item));
      if (hasAnyPermittedSub) return true;
    }

    if (item.requiredPermission && !can(item.requiredPermission.action, item.requiredPermission.resource)) {
      return false;
    }
    return true;
  };

  // Helper to check if a sub nav item is enabled
  const checkSubItemEnabled = (sub: string | SubNavItem, parentItem: NavItem): boolean => {
    if (parentItem.requiredUserType && !isUserType(parentItem.requiredUserType)) {
      return false;
    }
    return checkSubItemPermitted(sub, parentItem);
  };

  // Expand parent section if current route matches any child path
  useEffect(() => {
    adminNavGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems && checkItemEnabled(item)) {
          const hasActiveSubItem = item.subItems.some((sub) => {
            const subPath = typeof sub === "string"
              ? `${item.path || ""}/${sub.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
              : sub.path;
            return location.pathname === subPath || location.pathname.startsWith(subPath);
          });
          if (hasActiveSubItem) {
            setExpandedSections((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemClick = (item: NavItem, isEnabled: boolean) => {
    if (!isEnabled) {
      return;
    }
    if (item.isCollapsible) {
      toggleSection(item.id);
    } else if (item.path) {
      navigate(item.path);
    }
    onSelectTab?.(item.id);
  };

  const handleSubItemClick = (
    sub: string | SubNavItem,
    parentItem: NavItem,
    idx: number,
    isEnabled: boolean
  ) => {
    if (!isEnabled) {
      return;
    }
    const subPath =
      typeof sub === "string"
        ? `${parentItem.path || ""}/${sub.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
        : sub.path;

    if (subPath) {
      navigate(subPath);
    }
    onSelectTab?.(`${parentItem.id}-${idx}`);
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
              const isEnabled = checkItemEnabled(item);
              const isPathActive = Boolean(
                isEnabled &&
                item.path &&
                (location.pathname === item.path || location.pathname.startsWith(item.path + "/"))
              );
              const isActive = activeTab !== undefined ? activeTab === item.id : isPathActive;
              const isExpanded = Boolean(expandedSections[item.id]);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item, isEnabled)}
                    disabled={!isEnabled}
                    title={!isEnabled ? "Access Restricted" : undefined}
                    aria-disabled={!isEnabled}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 relative ${!isEnabled
                        ? "opacity-40 text-slate-400 cursor-not-allowed hover:bg-transparent"
                        : isActive
                          ? "text-[#45AC5E] bg-[#EBF6EE] border-r-4 border-[#45AC5E] cursor-pointer"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${!isEnabled
                            ? "text-slate-300"
                            : isActive
                              ? "text-[#45AC5E]"
                              : "text-slate-500"
                          }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {!isEnabled ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : item.isCollapsible ? (
                      <span className="text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    ) : null}
                  </button>

                  {/* Submenu if expanded */}
                  {isEnabled && item.isCollapsible && isExpanded && item.subItems && (
                    <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                      {item.subItems.map((sub, idx) => {
                        const isSubEnabled = checkSubItemEnabled(sub, item);
                        const subLabel = typeof sub === "string" ? sub : sub.label;
                        const subPath =
                          typeof sub === "string"
                            ? `${item.path || ""}/${sub.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
                            : sub.path;
                        const isSubActive = isSubEnabled && location.pathname === subPath;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSubItemClick(sub, item, idx, isSubEnabled)}
                            disabled={!isSubEnabled}
                            aria-disabled={!isSubEnabled}
                            className={`flex items-center justify-between w-full text-left py-1.5 px-2 text-xs font-medium rounded transition-colors ${!isSubEnabled
                                ? "opacity-40 text-slate-400 cursor-not-allowed"
                                : isSubActive
                                  ? "text-[#45AC5E] bg-[#EBF6EE] font-bold cursor-pointer"
                                  : "text-slate-500 hover:text-[#45AC5E] hover:bg-slate-50 cursor-pointer"
                              }`}
                          >
                            <span>{subLabel}</span>
                            {!isSubEnabled && <Lock className="w-3 h-3 text-slate-400" />}
                          </button>
                        );
                      })}
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
