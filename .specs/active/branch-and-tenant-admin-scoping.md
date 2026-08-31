# Feature Spec: Branch & Tenant Admin Scoping (Single-Branch Model)

## 1. Goal & Context
Transform the system into a multi-tenant, single-branch architecture where:
1. **Platform SuperAdmin** (`SUPER_ADMIN`) can provision a new institution/school with a **Default Branch** (e.g., "Main Campus") and an associated **Branch Admin** (`ADMIN`) user account.
2. **Single-Branch Constraint**: The architecture introduces the `Branch` data model cleanly with a default branch per tenant, keeping the UX straightforward without multi-branch switching complexity.
3. **Comprehensive Domain Scoping**: All domain tables (`users`, `students`, `staff`, `classes`, `programs`, `attendance`, `grades`, `fees`, `expenses`, `payroll`) include `branch_id` to guarantee complete data isolation and zero cross-tenant leakage.
4. **Branch-Scoped Admin Access**: A Branch Admin can manage users, staff, students, and academic/financial operations strictly within their assigned branch.

---

## 2. User Types & Hierarchy

| User Type | Scope | Target Audience | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | **Global (Platform)** | SaaS Platform Owners / DevOps | Provisions schools, creates default branches, creates Branch Admins, manages platform modules. Has global `ResourceEnum.ALL` access without a `branch_id`. |
| **`ADMIN`** | **Branch-Scoped** | School Principal / Branch Owner | Full operational management of their school (`branch_id: 101`). Manages teachers, staff, students, fees, classes, and roles within their branch. |
| **`CMS`** | **Branch-Scoped** | School Staff (Registrars, Accountants, HR) | Operates specific modules (e.g., Accountant handles Fees/Payroll; Registrar handles Student enrollment) within their branch according to assigned CASL roles. |
| **`CUSTOMER` / `PORTAL_USER`** | **Branch-Scoped** | Students, Parents, Teachers | Accesses student portal, views report cards, attendance, timetables, and fee invoices within their branch. |

---

## 3. Requirements & Boundaries

### A. Shared Contracts (`@repo/contracts`)
- [ ] **Resource & Action Enums**:
  - Add `ResourceEnum.BRANCH` to `resource.enum.ts`.
  - Add `UserTypeEnum.SUPER_ADMIN` to `user-type.enum.ts`.
- [ ] **Branch DTOs & Validation Schemas (`branch.dto.ts`)**:
  - `BranchStatusEnum` (`ACTIVE`, `INACTIVE`).
  - `CreateBranchWithAdminSchema`: Validates branch name, code/slug, and the initial Branch Admin user payload (username, password, name, email, phone).
  - `BranchSchema`, `FindBranchesSchema`, `UpdateBranchSchema`.
- [ ] **DTO Updates across Domains**:
  - Add optional `branchId?: number` to `UserSchema`, `CreateUserSchema`, `StudentSchema`, `ClassSchema`, `FeeStructureSchema`, `PayrollSchema`, etc.
- [ ] **Route Constants (`route.ts`)**:
  - Add `API_ROUTE.SUPERADMIN.BRANCHES` for platform superadmin branch & admin provisioning.

### B. Backend API (`apps/api`)
- [ ] **Database & Migrations (`database/`)**:
  - Create migration for `branches` table (`id`, `uuid`, `name`, `code`, `is_default`, `status`, `created_at`, `updated_at`, `deleted_at`).
  - Add `branch_id` foreign key columns with indices across domain tables:
    - `users`, `students`, `staffs`, `roles`
    - `programs`, `classes`, `class_timetables`
    - `student_attendances`, `teacher_attendances`, `leave_requests`
    - `student_scores`, `grading_rules`
    - `fee_structures`, `student_payments`, `school_expenses`, `payrolls`
  - Seeders: Platform SuperAdmin, default roles, default demonstration branch with Branch Admin.
- [ ] **Branch Module (`apps/api/src/branch/`)**:
  - `Branch` entity with TypeORM relations.
  - `BranchService`:
    - `createBranchWithAdmin(dto)`: Transactional creation of Branch (`isDefault: true`) and `User` (`userType: ADMIN`, `branchId: branch.id`).
    - `findAll(query)` (SuperAdmin only).
    - `findOne(id)`, `updateBranch(id, dto)`.
  - `SuperAdminBranchController` (`/api/v1/superadmin/branches`): Protected by `JwtAuthGuard`, `UserTypesGuard(SUPER_ADMIN)`, and `CaslAccessGuard`.
- [ ] **CASL Configuration Update (`casl.config.ts`)**:
  - Set `superuserRole: UserTypeEnum.SUPER_ADMIN`.
- [ ] **Branch-Scoped Query & Entity Scoping**:
  - Update domain services (`UserService`, `StudentService`, `ClassService`, `FeeService`, etc.) to automatically apply `WHERE branch_id = :currentUserBranchId` when `currentUser.userType !== SUPER_ADMIN`.
  - Update `UserHook` to prevent cross-branch entity mutation (`403 Forbidden`).

### C. Web Frontend (`apps/web`)
- [ ] **SuperAdmin Branch Provisioning Feature (`apps/web/src/features/branches/`)**:
  - `components/create-branch-dialog.tsx`: Form modal for SuperAdmin to create a new branch + initial Branch Admin user.
  - `components/branch-list-table.tsx`: Data table listing all provisioned branches with status and admin info.
  - `hooks/use-branch-query.ts` & `hooks/use-branch-mutations.ts`.
- [ ] **Branch Admin User & Domain UI**:
  - Forms automatically associate newly created entities with the active branch.
  - Standard Branch Admins and staff have no branch-switcher (seamlessly pinned to their branch).
- [ ] **Navigation & Route Guards**:
  - SuperAdmin route navigation for branch management (`/admin/branches`).
  - Branch Admin navigation restricted to school operational modules.

---

## 4. Tech Design & File Scope

### Target Files:

#### 1. Contracts Layer (`packages/contracts`)
- `packages/contracts/src/resource.enum.ts` [MODIFY]
- `packages/contracts/src/user-type.enum.ts` [MODIFY]
- `packages/contracts/src/branch.dto.ts` [NEW]
- `packages/contracts/src/user.dto.ts` [MODIFY]
- `packages/contracts/src/student.dto.ts` [MODIFY]
- `packages/contracts/src/class.dto.ts` [MODIFY]
- `packages/contracts/src/fee-structure.dto.ts` [MODIFY]
- `packages/contracts/src/payroll.dto.ts` [MODIFY]
- `packages/contracts/src/route.ts` [MODIFY]
- `packages/contracts/src/index.ts` [MODIFY]

#### 2. Backend API Layer (`apps/api`)
- `apps/api/src/branch/entity/branch.entity.ts` [NEW]
- `apps/api/src/branch/dto/create-branch-with-admin.dto.ts` [NEW]
- `apps/api/src/branch/dto/find-branches.dto.ts` [NEW]
- `apps/api/src/branch/dto/update-branch.dto.ts` [NEW]
- `apps/api/src/branch/branch.service.ts` [NEW]
- `apps/api/src/branch/superadmin.branch.controller.ts` [NEW]
- `apps/api/src/branch/branch.permission.ts` [NEW]
- `apps/api/src/branch/branch.module.ts` [NEW]
- `apps/api/src/common/config/casl.config.ts` [MODIFY]
- `apps/api/src/user/entity/user.entity.ts` [MODIFY]
- `apps/api/src/student/entity/student.entity.ts` [MODIFY]
- `apps/api/src/hr/entity/staff.entity.ts` [MODIFY]
- `apps/api/src/academic/entity/class.entity.ts` [MODIFY]
- `apps/api/src/academic/entity/program.entity.ts` [MODIFY]
- `apps/api/src/academic/entity/class-timetable.entity.ts` [MODIFY]
- `apps/api/src/attendance/entity/student-attendance.entity.ts` [MODIFY]
- `apps/api/src/attendance/entity/teacher-attendance.entity.ts` [MODIFY]
- `apps/api/src/attendance/entity/leave-request.entity.ts` [MODIFY]
- `apps/api/src/examination/entity/student-score.entity.ts` [MODIFY]
- `apps/api/src/examination/entity/grading-rule.entity.ts` [MODIFY]
- `apps/api/src/fee/entity/fee-structure.entity.ts` [MODIFY]
- `apps/api/src/fee/entity/school-expense.entity.ts` [MODIFY]
- `apps/api/src/hr/entity/payroll.entity.ts` [MODIFY]
- `apps/api/src/role/entity/role.entity.ts` [MODIFY]
- `apps/api/src/user/user.service.ts` [MODIFY]
- `apps/api/src/user/user.hook.ts` [MODIFY]
- `apps/api/src/app.module.ts` [MODIFY]
- `apps/api/database/migrations/2026.08.28T00.00.01.create-branches-and-scoping.ts` [NEW]
- `apps/api/database/seeds/2026.08.28T00.00.01.branch-and-superadmin-seeder.ts` [NEW]
- `apps/api/test/branch.e2e-spec.ts` [NEW]
- `apps/api/test/user-branch-scoping.e2e-spec.ts` [NEW]

#### 3. Frontend Web Layer (`apps/web`)
- `apps/web/src/features/branches/api/branch-api.ts` [NEW]
- `apps/web/src/features/branches/hooks/use-branches-query.ts` [NEW]
- `apps/web/src/features/branches/hooks/use-branch-mutations.ts` [NEW]
- `apps/web/src/features/branches/components/branch-list-table.tsx` [NEW]
- `apps/web/src/features/branches/components/create-branch-dialog.tsx` [NEW]
- `apps/web/src/features/branches/index.ts` [NEW]
- `apps/web/src/routes/branches-page.tsx` [NEW]
- `apps/web/src/routes/router.tsx` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] `@repo/contracts` compiles with zero errors (`pnpm --filter @repo/contracts build`).
- [ ] Database migration successfully creates `branches` table and adds `branch_id` with foreign keys & indexes across all domain tables.
- [ ] SuperAdmin can call `POST /api/v1/superadmin/branches` to provision a branch and its default Branch Admin atomically.
- [ ] Branch Admin can log in and manage users, staff, students, and classes strictly within their own branch.
- [ ] Branch Admin attempting to access or modify records from another branch receives a `403 Forbidden` response.
- [ ] Backend Vitest e2e tests pass for SuperAdmin provisioning and multi-tenant isolation (`pnpm --filter api test`).
- [ ] Oxlint passes cleanly across all workspaces (`pnpm lint`).
