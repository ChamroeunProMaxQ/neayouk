# UI Action Button & Mutation RBAC Enforcement

This rule defines the mandatory standard for enforcing Role-Based Access Control (RBAC) on all Create, Read, Update, and Delete (CRUD) buttons, action triggers, and modal dialogs across all frontend feature components (`apps/web/src/features/*`).

---

## Directives & Mandatory Patterns

### 1. Mandatory `usePermission` Hook Consumption
Every feature list table, details dialog, and action bar component **MUST** consume the `usePermission` hook to evaluate client permissions before rendering or enabling action buttons:

```tsx
import { usePermission } from "@/features/auth";

export function EntityListTable() {
  const { can } = usePermission();

  const canCreate = can("create", "resource") || can("manage", "resource");
  const canUpdate = can("update", "resource") || can("manage", "resource");
  const canDelete = can("delete", "resource") || can("manage", "resource");
```

### 2. UI Feedback for Disabled Actions
When a user lacks permission for an action:
- **Button Disabled State**: Action buttons **MUST** be explicitly set to `disabled={!canAction}`.
- **Visual Styling**: Add `disabled:opacity-40 disabled:cursor-not-allowed` to provide clear visual feedback.
- **Informative Tooltips**: Supply a `title` attribute explaining the restriction (e.g., `title={!canCreate ? "You do not have permission to create classes" : undefined}`).
- **Accessible Attributes**: Maintain proper `aria-label` tags for screen readers.

```tsx
{/* Create Action Button Example */}
<Button
  onClick={handleCreate}
  disabled={!canCreate}
  title={!canCreate ? "You do not have permission to create this resource" : undefined}
  className="bg-[#45AC5E] hover:bg-[#389350] text-white disabled:opacity-40 disabled:cursor-not-allowed"
>
  <Plus className="w-4 h-4" />
  <span>Add Resource</span>
</Button>

{/* Row Action Buttons Example */}
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleEdit(item)}
  disabled={!canUpdate}
  title={!canUpdate ? "You do not have permission to edit this resource" : undefined}
  className="disabled:opacity-40 disabled:cursor-not-allowed"
>
  <Edit2 className="w-3.5 h-3.5" />
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDelete(item)}
  disabled={!canDelete}
  title={!canDelete ? "You do not have permission to delete this resource" : undefined}
  className="text-rose-500 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
>
  <Trash2 className="w-3.5 h-3.5" />
</Button>
```

### 3. Resource Mapping Standard (`ResourceEnum`)
Use strongly-typed resource identifiers from `@repo/contracts` (`ResourceEnum`) matching the backend CASL permissions and `PERMISSION_GROUPS`:

| Module Group | Child Resource | Applicable Actions |
| :--- | :--- | :--- |
| **User Management** | `ResourceEnum.USER`, `ResourceEnum.ROLE`, `ResourceEnum.PERMISSION` | `read`, `create`, `update`, `delete`, `manage` |
| **People & Directory** | `ResourceEnum.STUDENT`, `ResourceEnum.TEACHER` | `read`, `create`, `update`, `delete`, `manage` |
| **Academic Management** | `ResourceEnum.ACADEMIC_YEAR`, `ResourceEnum.PROGRAM`, `ResourceEnum.CLASS`, `ResourceEnum.TIMETABLE` | `read`, `create`, `update`, `delete`, `manage` |
| **Attendance Management** | `ResourceEnum.STUDENT_ATTENDANCE`, `ResourceEnum.TEACHER_ATTENDANCE`, `ResourceEnum.LEAVE_REQUEST` | `read`, `create`, `update`, `delete`, `manage` |
| **Examinations & Grading** | `ResourceEnum.EXAMINATION`, `ResourceEnum.GRADING_RULE`, `ResourceEnum.REPORT_CARD`, `ResourceEnum.ASSIGNMENT` | `read`, `create`, `update`, `delete`, `manage` |
| **Fee & Financials** | `ResourceEnum.FEE_STRUCTURE`, `ResourceEnum.INVOICE`, `ResourceEnum.EXPENSE` | `read`, `create`, `update`, `delete`, `manage` |
| **HR & Payroll** | `ResourceEnum.STAFF`, `ResourceEnum.PAYROLL` | `read`, `create`, `update`, `delete`, `manage` |
| **General & System** | `ResourceEnum.DASHBOARD`, `ResourceEnum.ANNOUNCEMENT`, `ResourceEnum.REPORT`, `ResourceEnum.SETTING` | `read`, `create`, `update`, `delete`, `manage` |

---

### 4. Role Form Hierarchical UI Standard
When rendering role permission editors (e.g. `RoleForm`):
- **Module Accordion Cards**: Render each module group from `PERMISSION_GROUPS` (`@repo/contracts`) in a collapsible card.
- **Group Master Switch**: Provide a "Select All / Clear Module" toggle per card and a counter badge (e.g. `4 of 8 selected`).
- **Child Resource Rows**: Each child resource contains badge chips for each granular action (`read`, `create`, `update`, `delete`).
- **Toolbar**: Real-time permission search/filter input, "Expand All / Collapse All", and "Select All / Deselect All".

---

## Validation & Automated Testing
Component test suites for feature list tables and `RoleForm` **MUST** assert that action buttons and permission toggles correctly respect permission states (e.g. testing disabled state when `usePermission` returns `can: () => false` and form submission with selected permissions).

