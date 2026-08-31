import { ResourceEnum } from "./resource.enum.js";
import { DefaultActions } from "./action.enum.js";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

export const STANDARD_ACTIONS: PermissionAction[] = [
  DefaultActions.read,
  DefaultActions.create,
  DefaultActions.update,
  DefaultActions.delete,
];

export interface PermissionChildResourceConfig {
  resource: ResourceEnum;
  title: string;
  description?: string;
  actions: PermissionAction[];
}

export interface PermissionGroupConfig {
  key: string;
  title: string;
  description?: string;
  groupResource?: ResourceEnum;
  children: PermissionChildResourceConfig[];
}

export const PERMISSION_GROUPS: PermissionGroupConfig[] = [
  {
    key: "users",
    title: "User & Access Management",
    description: "Manage system accounts, user roles, and security permissions",
    groupResource: ResourceEnum.USER,
    children: [
      {
        resource: ResourceEnum.USER,
        title: "User Accounts",
        description: "Manage user logins and profiles",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.BRANCH,
        title: "Branches & Tenants",
        description: "Manage institution branches and campuses",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.ROLE,
        title: "Roles & Permissions",
        description: "Configure system roles and permission sets",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.PERMISSION,
        title: "System Permissions",
        description: "View and configure granular system permissions",
        actions: [DefaultActions.read, DefaultActions.manage],
      },
    ],
  },
  {
    key: "people",
    title: "People & Directory",
    description: "Manage student and teacher directory profiles",
    children: [
      {
        resource: ResourceEnum.STUDENT,
        title: "Students Directory",
        description: "Manage student profiles, enrollments, and guardians",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.TEACHER,
        title: "Teachers Directory",
        description: "Manage faculty profiles and teaching assignments",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "academic",
    title: "Academic Management",
    description: "Manage programs, curriculum, academic years, classes, and schedules",
    groupResource: ResourceEnum.ACADEMIC,
    children: [
      {
        resource: ResourceEnum.ACADEMIC_YEAR,
        title: "Academic Years & Terms",
        description: "Configure academic calendars and terms",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.PROGRAM,
        title: "Programs & Curriculum",
        description: "Manage programs, departments, and course structures",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.CLASS,
        title: "Classes & Cohorts",
        description: "Manage classes, cohorts, and student rosters",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.TIMETABLE,
        title: "Class Timetables",
        description: "Manage weekly class and teacher timetables",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "attendance",
    title: "Attendance Management",
    description: "Manage student daily attendance, teacher check-ins, and leave requests",
    groupResource: ResourceEnum.ATTENDANCE,
    children: [
      {
        resource: ResourceEnum.STUDENT_ATTENDANCE,
        title: "Student Attendance",
        description: "Record and review daily student attendance sheets",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.TEACHER_ATTENDANCE,
        title: "Teacher Attendance",
        description: "Record and review teacher check-ins and logs",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.LEAVE_REQUEST,
        title: "Leave Requests",
        description: "Submit, approve, or reject staff and student leave requests",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "examination",
    title: "Examinations & Grading",
    description: "Manage examinations, grading scales, report cards, and assessments",
    groupResource: ResourceEnum.EXAMINATION,
    children: [
      {
        resource: ResourceEnum.EXAMINATION,
        title: "Gradebook & Exams",
        description: "Record marks, conduct exams, and compute grades",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.GRADING_RULE,
        title: "Grading Rules & Scales",
        description: "Define GPA scales and letter grading thresholds",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.REPORT_CARD,
        title: "Report Cards",
        description: "Generate and export academic report cards",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.ASSIGNMENT,
        title: "Assignments & Homework",
        description: "Manage classroom homework and assignments",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "fee",
    title: "Fee & Financials",
    description: "Manage student fee structures, invoices, payments, and school expenses",
    groupResource: ResourceEnum.FEE,
    children: [
      {
        resource: ResourceEnum.FEE_STRUCTURE,
        title: "Fee Structures",
        description: "Configure tuition fee schedules and templates",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.INVOICE,
        title: "Invoices & Payments",
        description: "Issue invoices and collect student fee payments",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.EXPENSE,
        title: "Expenses & Outflows",
        description: "Track operational expenses and vendor payouts",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "hr",
    title: "HR & Payroll",
    description: "Manage school staff directory, salaries, and monthly payrolls",
    groupResource: ResourceEnum.HR,
    children: [
      {
        resource: ResourceEnum.STAFF,
        title: "Staff Directory",
        description: "Manage non-teaching and administrative staff profiles",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.PAYROLL,
        title: "Payroll & Salaries",
        description: "Generate payroll records and salary slips",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
  {
    key: "general",
    title: "General & System",
    description: "Dashboard insights, announcements, reports, settings, and facility management",
    children: [
      {
        resource: ResourceEnum.DASHBOARD,
        title: "Dashboard & Analytics",
        description: "View institution-wide KPI statistics and metrics",
        actions: [DefaultActions.read],
      },
      {
        resource: ResourceEnum.ANNOUNCEMENT,
        title: "Announcements & Notices",
        description: "Broadcast institution announcements",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.REPORT,
        title: "Reports & Audits",
        description: "Generate and export institutional audit reports",
        actions: [DefaultActions.read, DefaultActions.manage],
      },
      {
        resource: ResourceEnum.SETTING,
        title: "System Settings",
        description: "Configure global institution and application settings",
        actions: [DefaultActions.read, DefaultActions.update, DefaultActions.manage],
      },
      {
        resource: ResourceEnum.LIBRARY,
        title: "Library Management",
        description: "Manage books, book issues, and library returns",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.TRANSPORT,
        title: "Transport & Fleets",
        description: "Manage buses, drivers, and transport routes",
        actions: STANDARD_ACTIONS,
      },
      {
        resource: ResourceEnum.HOSTEL,
        title: "Hostel & Dormitories",
        description: "Manage dorm rooms, bed allocations, and hostels",
        actions: STANDARD_ACTIONS,
      },
    ],
  },
];

/**
 * Builds a dynamic mapping from each child resource to its parent group resource(s).
 */
export const RESOURCE_PARENTS_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};

  for (const group of PERMISSION_GROUPS) {
    if (group.groupResource) {
      for (const child of group.children) {
        if (child.resource !== group.groupResource) {
          if (!map[child.resource]) {
            map[child.resource] = [];
          }
          if (!map[child.resource].includes(group.groupResource)) {
            map[child.resource].push(group.groupResource);
          }
        }
      }
    }
  }

  // Cross-domain umbrellas
  if (!map[ResourceEnum.TEACHER_ATTENDANCE]) map[ResourceEnum.TEACHER_ATTENDANCE] = [];
  if (!map[ResourceEnum.TEACHER_ATTENDANCE].includes(ResourceEnum.HR)) {
    map[ResourceEnum.TEACHER_ATTENDANCE].push(ResourceEnum.HR);
  }

  if (!map[ResourceEnum.LEAVE_REQUEST]) map[ResourceEnum.LEAVE_REQUEST] = [];
  if (!map[ResourceEnum.LEAVE_REQUEST].includes(ResourceEnum.HR)) {
    map[ResourceEnum.LEAVE_REQUEST].push(ResourceEnum.HR);
  }

  return map;
})();

export interface ContractPermissionItem {
  resource: string;
  action: string;
  description: string;
}

/**
 * Generates all valid permission combinations directly from PERMISSION_GROUPS.
 * Used for database seeding and complete contract-driven RBAC synchronization.
 */
export function getAllPermissionsFromContract(): ContractPermissionItem[] {
  const items: ContractPermissionItem[] = [];
  const added = new Set<string>();

  const pushItem = (resource: string, action: string, description: string) => {
    const key = `${resource}:${action}`;
    if (!added.has(key)) {
      added.add(key);
      items.push({ resource, action, description });
    }
  };

  // 1. Super Admin wildcard
  pushItem(ResourceEnum.ALL, DefaultActions.manage, "Full system management");

  // 2. Group Manage permissions
  for (const group of PERMISSION_GROUPS) {
    if (group.groupResource) {
      pushItem(
        group.groupResource,
        DefaultActions.manage,
        `Full management of ${group.title}`
      );
      pushItem(
        group.groupResource,
        DefaultActions.read,
        `Read access to ${group.title}`
      );
    }

    // 3. Child resource actions
    for (const child of group.children) {
      for (const action of child.actions) {
        const actionLabel =
          action === "manage"
            ? "Manage"
            : action === "read"
            ? "View"
            : action === "create"
            ? "Create"
            : action === "update"
            ? "Edit"
            : action === "delete"
            ? "Delete"
            : action;
        pushItem(
          child.resource,
          action,
          `${actionLabel} ${child.title.toLowerCase()}`
        );
      }
      // Also ensure manage action exists for each child resource
      pushItem(
        child.resource,
        DefaultActions.manage,
        `Manage all ${child.title.toLowerCase()}`
      );
    }
  }

  return items;
}

/**
 * Returns all child resource keys belonging to a specific group.
 */
export function getChildResourcesForGroup(groupKey: string): ResourceEnum[] {
  const group = PERMISSION_GROUPS.find((g) => g.key === groupKey);
  return group ? group.children.map((c) => c.resource) : [];
}

/**
 * Returns the parent group configuration for a given resource.
 */
export function getParentGroupForResource(
  resource: string
): PermissionGroupConfig | undefined {
  return PERMISSION_GROUPS.find((g) =>
    g.children.some((c) => c.resource === resource) || g.groupResource === resource
  );
}
