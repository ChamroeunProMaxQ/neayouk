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
Use standard resource identifiers from `@repo/contracts` matching the backend CASL permissions:

| Feature / Domain | Resource Name | Applicable Actions |
| :--- | :--- | :--- |
| **Users** | `"user"` | `create`, `read`, `update`, `delete`, `manage` |
| **Roles & Permissions** | `"role"`, `"permission"` | `create`, `read`, `update`, `delete`, `manage` |
| **Students** | `"student"` | `create`, `read`, `update`, `delete`, `manage` |
| **Fees & Payments** | `"fee"` | `create`, `read`, `update`, `delete`, `manage` |
| **Academic (Classes, Programs, Timetables)** | `"academic"` | `create`, `read`, `update`, `delete`, `manage` |
| **Teachers** | `"teacher"` | `create`, `read`, `update`, `delete`, `manage` |
| **Attendance** | `"attendance"` | `create`, `read`, `update`, `delete`, `manage` |
| **HR & Payroll** | `"hr"` | `create`, `read`, `update`, `delete`, `manage` |

---

## Validation & Automated Testing
Component test suites for feature list tables **MUST** assert that action buttons correctly respect permission states (e.g. testing disabled state when `usePermission` returns `can: () => false`).
