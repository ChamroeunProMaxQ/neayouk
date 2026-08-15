# Feature Spec: Dynamic Role-Based Access Control (RBAC) & Permission System

## 1. Goal & Context
Build a unified, dynamic Role-Based Access Control (RBAC) and Permission system integrated across backend (`apps/api`), frontend (`apps/web`), and shared contracts (`packages/contracts`).

### Core Architecture:
1. **User Type (`userType`)**: High-level portal/account category discriminator (e.g., `ADMIN`, `CMS`, `PORTAL_USER` / `CLIENT` / `CUSTOMER`). It enforces portal-level perimeter security (e.g., ensuring `PORTAL_USER` cannot access Admin API boundaries at all).
2. **Roles (`roles`)**: Dynamic functional groupings (e.g., `Principal`, `Teacher`, `Staff`, `Finance Officer`, `Student`, `Parent`) stored in the database (`roles` and `user_roles`). A single user can hold **multiple roles**.
3. **Permissions (`permissions`)**: Fine-grained authorization primitives defined as `(resource, action)` tuples (e.g., `academic:read`, `user:manage`, `attendance:create`) stored in the database (`permissions` and `role_permissions`).
4. **Token & Session Attachment**: On login (`/auth/login`) and profile retrieval (`/auth/profile`), the user's active dynamic `roles` and aggregated `permissions` are resolved from the database and attached to the JWT and authentication payload.
5. **CASL as the Single Authorization Engine**: CASL (`nest-casl`, `@casl/ability`, `CaslAccessGuard`, `@UseAbility`) is the sole evaluator of fine-grained permissions and entity rules. We avoid brittle endpoint role checks (`RolesGuard`), ensuring dynamic roles created in DB automatically work based on their permissions.
6. **Frontend Sidebar & Route Security**: Evaluates permissions to dynamically **enable/disable sidebar navigation items** (with distinct visual disabled state and click prevention) and guard route boundaries with a modern 403 Forbidden screen.

---

## 2. Requirements & Boundaries

### 2.1 User Type vs. Dynamic Role & Permission Taxonomy
- [ ] **User Type (`UserTypeEnum`) Clarification & Naming**:
  - `UserTypeEnum.ADMIN`: System administrator account.
  - `UserTypeEnum.CMS`: Internal staff / back-office operator.
  - `UserTypeEnum.PORTAL_USER` (alias/renamed from `CUSTOMER`, with backward-compatible alias): External end-user / portal client (e.g. Student/Parent/Customer).
  - `UserTypesGuard` strictly restricts API portal zones based on `userType`.
- [ ] **Dynamic Database Entities**:
  - `Role` Entity (`roles` table): `id`, `uuid`, `name`, `slug`, `description`, `created_at`, `updated_at`.
  - `Permission` Entity (`permissions` table): `id`, `uuid`, `resource`, `action`, `description`, `created_at`, `updated_at`.
  - `UserRole` relation / join table (`user_roles`): Many-to-Many mapping between `users` and `roles`.
  - `RolePermission` relation / join table (`role_permissions`): Many-to-Many mapping between `roles` and `permissions`.
  - Migration & Seeders: Initial database migration creating `roles`, `permissions`, `user_roles`, `role_permissions` with default seed data for standard roles and resources.

### 2.2 Shared Contracts (`@repo/contracts`)
- [ ] **Enums & Schemas**:
  - `UserTypeEnum`: `ADMIN`, `CMS`, `PORTAL_USER` (with `CUSTOMER = 'PORTAL_USER'` backward compatibility).
  - `DefaultActions` / `ActionEnum`: `create`, `read`, `update`, `delete`, `manage`.
  - `ResourceEnum`: `user`, `dashboard`, `announcement`, `academic`, `attendance`, `examination`, `assignment`, `fee`, `hr`, `library`, `transport`, `hostel`, `report`, `setting`, `all`.
  - `PermissionDto` / `PermissionSchema`: `{ id?: number, resource: string, action: string, description?: string }`.
  - `RoleDto` / `RoleSchema`: `{ id?: number, name: string, slug: string, permissions: PermissionDto[] }`.
  - `AuthUserDto`: `{ id: number, username: string, userType: UserTypeEnum, roles: string[], permissions: PermissionDto[] }`.
- [ ] **Shared Helpers**:
  - `hasPermission(permissions: PermissionDto[], action: string, resource: string): boolean`.
  - `hasRole(userRoles: string[], ...requiredRoles: string[]): boolean`.
  - `isUserType(userType: UserTypeEnum, ...allowedTypes: UserTypeEnum[]): boolean`.

### 2.3 Backend API (`apps/api`)
- [ ] **Login & Token Hydration**:
  - In `AuthService.login()`: When authenticating, load user's `roles` and join their `permissions`.
  - Aggregate all distinct `(resource, action)` permissions from all assigned roles.
  - Embed `roles` (slugs) and `permissions` into the JWT payload and return in `LogInResponseDto` and `/api/v1/auth/profile`.
- [ ] **CASL Authorization (No Redundant Role Guard)**:
  - Update `caslConfig` in `apps/api/src/common/config/casl.config.ts`:
    - `superuserRole`: `UserTypeEnum.ADMIN`.
    - `getUserFromRequest`: Extracts `{ id, userType, roles, permissions }` from JWT.
  - Dynamic Ability Resolution in CASL:
    - Grant `can(action, resource)` based on the user's aggregated DB permissions.
    - Grant `can(DefaultActions.manage, 'all')` for `ADMIN` superusers.
    - Preserve subject ownership rules (e.g. `PORTAL_USER` can `read`/`update` own User profile `{ id: user.id }`).
  - Guards on Endpoints:
    - `JwtAuthGuard`: Validates session authenticity.
    - `UserTypesGuard`: Validates top-level portal perimeter (`@UserTypes(...)`).
    - `CaslAccessGuard`: Evaluates permissions declaratively (`@UseAbility(action, subject)`).
    - Returns uniform 403 Forbidden envelope: `{ status: 403, message: "Forbidden resource", data: null }`.

### 2.4 Web Frontend (`apps/web`)
- [ ] **Zustand Auth Store (`useAuthStore`)**:
  - Store full `AuthUser`: `{ id, username, userType, roles, permissions }`.
  - Persist session securely in `localStorage`.
- [ ] **Permission Hooks & Components**:
  - `usePermission()` hook:
    - `can(action: string, resource: string): boolean`
    - `hasRole(...roles: string[]): boolean`
    - `isUserType(...types: UserTypeEnum[]): boolean`
    - `isAdmin: boolean`
  - `<PermissionGate resource="..." action="..." userType="..." fallback={...}>` component.
- [ ] **Sidebar Enable/Disable Behavior (`AdminSidebar`)**:
  - Configure `NavItem` and `SubNavItem` with optional `requiredUserType` and `requiredPermission: { action, resource }`.
  - When the logged-in user lacks permissions:
    - Nav item is rendered in **disabled state** (`opacity-45`, muted slate color, `cursor-not-allowed`, non-clickable).
    - Optional lock icon indicator (`Lock` badge) signaling restricted access.
    - Click events are blocked (`e.preventDefault()`, no navigation trigger).
  - When permitted:
    - Nav item is fully enabled, clickable, and highlights active state based on route.
- [ ] **Route Protection & 403 Forbidden Page**:
  - `ProtectedRoute`: Verifies user is authenticated and satisfies route `requiredPermission` / `requiredUserType`.
  - `ForbiddenPage` (`403 Access Denied`): Rendered when navigating directly to a restricted URL, providing clear feedback and a "Return to Dashboard" action.

---

## 3. Tech Design & File Scope

### Database & Migrations:
- `apps/api/database/migrations/2026.08.16T00.00.00.create-roles-and-permissions-tables.ts` [NEW]
- `apps/api/database/seeds/2026.08.16T00.00.00.roles-and-permissions-seeder.ts` [NEW]

### `@repo/contracts`:
- `packages/contracts/src/user-type.enum.ts` [MODIFY]
- `packages/contracts/src/role.dto.ts` [NEW]
- `packages/contracts/src/resource.enum.ts` [NEW]
- `packages/contracts/src/permission.dto.ts` [NEW]
- `packages/contracts/src/auth.dto.ts` [MODIFY]
- `packages/contracts/src/user.dto.ts` [MODIFY]
- `packages/contracts/src/index.ts` [MODIFY]

### `@repo/api` (`apps/api`):
- `apps/api/src/role/entity/role.entity.ts` [NEW]
- `apps/api/src/permission/entity/permission.entity.ts` [NEW]
- `apps/api/src/user/entity/user.entity.ts` [MODIFY] (Add ManyToMany relation to `Role`)
- `apps/api/src/auth/dto/jwt-payload.dto.ts` [MODIFY]
- `apps/api/src/auth/jwt.strategy.ts` [MODIFY]
- `apps/api/src/auth/auth.service.ts` [MODIFY] (Load DB roles & permissions on login)
- `apps/api/src/user-token/user-token.service.ts` [MODIFY]
- `apps/api/src/common/config/casl.config.ts` [MODIFY]
- `apps/api/src/user/user.permission.ts` [MODIFY]
- `apps/api/test/forbidden.e2e-spec.ts` [MODIFY]
- `apps/api/test/rbac.e2e-spec.ts` [NEW]

### `@repo/web` (`apps/web`):
- `apps/web/src/features/auth/stores/use-auth-store.ts` [MODIFY]
- `apps/web/src/features/auth/hooks/use-permission.ts` [NEW]
- `apps/web/src/features/auth/components/permission-gate.tsx` [NEW]
- `apps/web/src/features/auth/index.ts` [MODIFY]
- `apps/web/src/features/admin/components/admin-sidebar.tsx` [MODIFY] (Enable/disable nav items based on permissions)
- `apps/web/src/features/admin/components/admin-sidebar.spec.tsx` [MODIFY]
- `apps/web/src/routes/forbidden-page.tsx` [NEW]
- `apps/web/src/routes/protected-layout.tsx` [MODIFY]
- `apps/web/src/routes/router.tsx` [MODIFY]

---

## 4. Acceptance Criteria
- [ ] Database migration and seeder populate default roles (`teacher`, `staff`, `student`) and permissions.
- [ ] User authentication (`/auth/login` and `/auth/profile`) returns user details along with dynamic DB `roles` and `permissions`.
- [ ] `UserTypesGuard` strictly restricts API zones by `userType` (e.g. `PORTAL_USER` vs `ADMIN`).
- [ ] CASL authorization verifies fine-grained `(resource, action)` permissions dynamically without redundant role guards.
- [ ] API returns standard 403 Forbidden `{ status: 403, message: "Forbidden resource", data: null }` on unauthorized requests.
- [ ] `AdminSidebar` dynamically enables accessible items and disables unauthorized items with visual cues (dimmed, non-clickable, lock badge).
- [ ] Direct navigation to unauthorized routes renders the `ForbiddenPage` (403).
- [ ] All tests pass via `pnpm test` (API E2E tests and Web component tests).
- [ ] `pnpm lint` and `pnpm build` pass with zero errors.
