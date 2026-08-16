# Feature Spec: Dynamic Role-Based Access Control (RBAC) & Role Management System

## 1. Goal & Context
Build a unified, dynamic Role-Based Access Control (RBAC) and Permission system integrated across backend (`apps/api`), frontend (`apps/web`), and shared contracts (`packages/contracts`), featuring a streamlined, interactive **Role Management (CRUD)** interface with a static capability matrix, **User Management with Dynamic Role Assignment**, and **Button-Level Authorization State Management** (Add, Edit, Delete rendered in disabled state when unauthorized).

### Core Architecture:
1. **User Type (`userType`)**: High-level portal/account category discriminator (`ADMIN`, `CMS`, `PORTAL_USER` / `CUSTOMER`). It enforces portal-level perimeter security (e.g., ensuring `PORTAL_USER` cannot access Admin API boundaries at all).
2. **Roles (`roles`)**: Dynamic functional groupings (`Principal`, `Teacher`, `Staff`, `Finance Officer`, `Student`, `Parent`) stored in the database (`roles` and `user_roles`). A single user can hold **multiple roles**.
3. **Permissions (`permissions`)**: Fine-grained authorization primitives defined as `(resource, action)` tuples (`academic:read`, `user:manage`, `attendance:create`) stored in the database (`permissions` and `role_permissions`). Permissions are system capabilities without standalone UI CRUD.
4. **Token & Session Attachment**: On login (`/api/v1/auth/login`) and profile retrieval (`/api/v1/auth/profile`), the user's active dynamic `roles` and aggregated `permissions` are resolved from the database and attached to the JWT and authentication payload.
5. **CASL as the Single Authorization Engine**: CASL (`nest-casl`, `@casl/ability`, `CaslAccessGuard`, `@UseAbility`) is the sole evaluator of fine-grained permissions and entity rules.
6. **Route Prefixes & Isolation**:
   - CMS/Admin back-office management routes are isolated under `/api/v1/admin/*` (`/api/v1/admin/users`, `/api/v1/admin/roles`, `/api/v1/admin/permissions`) and handled by `AdminUserController`, `AdminRoleController`, and `AdminPermissionController`.
   - Public/Guest/Portal authentication routes are kept under `/api/v1/auth/*` (`/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/refresh-token`, `/api/v1/auth/profile`).
7. **Type-Safe User Context & `@CurrentUser()`**: Global `Express.User` interface augmentation in `src/types/express.d.ts` and dedicated `@CurrentUser()` parameter decorator that automatically rejects unauthorized requests with `UnauthorizedException`.
8. **Frontend Sidebar & Route Security**: Evaluates permissions to dynamically **enable/disable sidebar navigation items** (with distinct visual disabled state and click prevention) and guard route boundaries with a modern 403 Forbidden screen.
9. **Button-Level Permission Guards (Disabled State)**: Action buttons in tables and pages (Add User/Role, Edit User/Role, Delete User/Role) evaluate dynamic permissions using `can(action, resource)`:
   - "Add" button evaluates `create` capability on the resource (`user:create`, `role:create`). If unauthorized, it is rendered with `disabled` and `opacity-40 cursor-not-allowed`.
   - "Edit" button in table rows evaluates `update` capability (`user:update`, `role:update`). If unauthorized, it is rendered with `disabled` and `opacity-40 cursor-not-allowed`.
   - "Delete" button in table rows evaluates `delete` capability (`user:delete`, `role:delete`). If unauthorized, it is rendered with `disabled` and `opacity-40 cursor-not-allowed`.
10. **Role Management (CRUD) & Static Capability Matrix**: A dedicated management interface at `/users/roles` allowing administrators to create, edit, view, and delete custom roles, and assign permissions using an interactive static capability matrix without requiring database permission ID pre-fetching.
11. **User Management with Dynamic Role Assignment**: The user management modal (`UserForm` at `/users`) allows selecting and assigning multiple dynamic roles to a user, with the assigned roles displayed in the `UserListTable` and synced in the backend.
12. **On-the-Fly Permission Resolution**: Role creation and updates accept direct `(resource, action)` tuples. The backend resolves existing records or creates them on-the-fly in the database (`findOrCreate`), eliminating `permissionId` confusion.
13. **Early Return Pattern (`prefer-early-return`)**: Guard clauses, early exits, flat execution flows, and elimination of unnecessary `else` blocks across all backend services, interceptors, and UI handlers.

---

## 2. Requirements & Boundaries

### 2.1 User Type vs. Dynamic Role & Permission Taxonomy
- [x] **User Type (`UserTypeEnum`) Clarification & Naming**:
  - `UserTypeEnum.ADMIN`: System administrator account.
  - `UserTypeEnum.CMS`: Internal staff / back-office operator.
  - `UserTypeEnum.PORTAL_USER` (alias/renamed from `CUSTOMER`, with backward-compatible alias): External end-user / portal client (e.g. Student/Parent/Customer).
  - `UserTypesGuard` strictly restricts API portal zones based on `userType`.
- [x] **Dynamic Database Entities**:
  - `Role` Entity (`roles` table): `id`, `uuid`, `name`, `slug`, `description`, `created_at`, `updated_at`.
  - `Permission` Entity (`permissions` table): `id`, `uuid`, `resource`, `action`, `description`, `created_at`, `updated_at`.
  - `UserRole` relation / join table (`user_roles`): Many-to-Many mapping between `users` and `roles`.
  - `RolePermission` relation / join table (`role_permissions`): Many-to-Many mapping between `roles` and `permissions`.
  - Migration & Seeders: Dedicated database migrations creating `roles`, `permissions`, `user_roles`, `role_permissions` with default seed data for standard roles and resources.

### 2.2 Shared Contracts (`@repo/contracts`)
- [x] **Enums & Schemas**:
  - `UserTypeEnum`: `ADMIN`, `CMS`, `PORTAL_USER` (with `CUSTOMER = 'PORTAL_USER'` backward compatibility).
  - `DefaultActions` / `ActionEnum`: `create`, `read`, `update`, `delete`, `manage`.
  - `ResourceEnum`: `user`, `role`, `permission`, `dashboard`, `announcement`, `academic`, `attendance`, `examination`, `assignment`, `fee`, `hr`, `library`, `transport`, `hostel`, `report`, `setting`, `all`.
  - `RolePermissionInputSchema`: `{ resource: string, action: string, description?: string }`.
  - `PermissionDto` / `PermissionSchema`: `{ id?: number, uuid?: string, resource: string, action: string, description?: string }`.
  - `FindPermissionsSchema`: Query schema for fetching available system permissions.
  - `RoleDto` / `RoleSchema`: `{ id?: number, name: string, slug: string, description?: string, permissions: PermissionDto[] }`.
  - `CreateRoleSchema` & `UpdateRoleSchema` with `permissions: z.array(RolePermissionInputSchema).optional()`.
  - `FindRolesSchema`: Pagination, search, and sorting (`id`, `name`, `slug`, `updatedAt`).
  - `UserSchema`, `CreateUserSchema`, `UpdateUserSchema` with `roles: z.array(z.string()).optional()`.
  - `API_ROUTE.ROLE` (`LIST: /api/v1/admin/roles`, `CREATE`, `GET`, `UPDATE`, `DELETE`) and `API_ROUTE.PERMISSION` (`LIST: /api/v1/admin/permissions`).
  - `API_ROUTE.USER` (`LIST: /api/v1/admin/users`, `CREATE`, `GET`, `UPDATE`, `DELETE`).
  - `API_ROUTE.AUTH` (`LOGIN: /api/v1/auth/login`, `LOGOUT`, `REFRESH_TOKEN`, `PROFILE`).
  - `AuthUserDto`: `{ id: number, username: string, userType: UserTypeEnum, roles: string[], permissions: PermissionDto[] }`.
- [x] **Shared Helpers**:
  - `hasPermission(permissions: PermissionDto[], action: string, resource: string): boolean`.
  - `hasRole(userRoles: string[], ...requiredRoles: string[]): boolean`.
  - `isUserType(userType: UserTypeEnum, ...allowedTypes: UserTypeEnum[]): boolean`.

### 2.3 Backend API (`apps/api`)
- [x] **Login & Token Hydration**:
  - In `AuthService.login()`: When authenticating, load user's `roles` and join their `permissions`.
  - Aggregate all distinct `(resource, action)` permissions from all assigned roles.
  - Embed `roles` (slugs) and `permissions` into the JWT payload and return in `LogInResponseDto` and `/api/v1/auth/profile`.
- [x] **CASL Authorization**:
  - `caslConfig`: Superuser `ADMIN` has `manage:all`. Dynamic ability resolution verifies aggregated DB permissions.
  - Endpoints guarded with `JwtAuthGuard`, `UserTypesGuard`, `CaslAccessGuard`, and `@UseAbility(action, subject)`.
- [x] **Admin Controllers & Route Isolation**:
  - `AdminUserController` at `/api/v1/admin/users`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
  - `AdminRoleController` at `/api/v1/admin/roles`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
  - `AdminPermissionController` at `/api/v1/admin/permissions`: `GET /`.
  - `AuthController` at `/api/v1/auth`: `POST /login`, `POST /logout`, `POST /refresh-token`, `GET /profile`.
- [x] **User Context & Decorators**:
  - `Express.User` type augmentation (`apps/api/src/types/express.d.ts`).
  - `@CurrentUser()` custom parameter decorator (`apps/api/src/common/decorator/current-user.decorator.ts`) with immediate `UnauthorizedException` when missing.
- [x] **On-the-Fly Permission Resolution in `RoleService`**:
  - `resolvePermissions(dtoPermissions)`: Iterates over incoming `(resource, action)` pairs, finds existing or creates new permission records in the DB, and binds them to the role.

### 2.4 Web Frontend (`apps/web`)
- [x] **Zustand Auth Store (`useAuthStore`)**:
  - Store full `AuthUser`: `{ id, username, userType, roles, permissions }`.
- [x] **Permission Hooks & Components**:
  - `usePermission()`: `can(action, resource)`, `hasRole(...roles)`, `isUserType(...types)`, `isAdmin`.
  - `<PermissionGate resource="..." action="..." userType="..." fallback={...}>`.
- [x] **Sidebar Enable/Disable Behavior (`AdminSidebar`)**:
  - Nav items disabled (`opacity-45`, muted, non-clickable, lock badge) when user lacks permissions.
- [x] **Route Protection & 403 Forbidden Page**:
  - `PermissionRoute`: Protects route boundaries and renders `ForbiddenPage` (403 Access Denied) if unauthorized.
- [x] **Button-Level Permission Guards in Tables (Disabled State)**:
  - `UserListTable`: Add User (`disabled={!can('create', 'user')}`), Edit User (`disabled={!can('update', 'user')}`), Delete User (`disabled={!can('delete', 'user')}`).
  - `RoleListTable`: Add Role (`disabled={!can('create', 'role')}`), Edit Role (`disabled={!can('update', 'role')}`), Delete Role (`disabled={!can('delete', 'role')}`).
- [x] **User Management with Role Assignment (`apps/web/src/features/users`)**:
  - `UserForm`: Allows selecting multiple dynamic roles with interactive checkbox chips.
  - `UserListTable`: Displays user's assigned roles in a dedicated "Roles" column with distinct green badges.
- [x] **Role Management Feature (`apps/web/src/features/roles`)**:
  - `RoleListTable`: TanStack Table v8 with Infinite Scroll (`useUrlFilters(FindRolesSchema)`, `useDebounce(search, 800)`).
  - `RoleForm` & `RoleFormDialog`: Form validation with Zod and **interactive static capability matrix** (15 domain groups × 5 standard actions).
  - `DeleteRoleDialog`: Confirmation modal.
  - Full server error handling displaying alert banners on `409 Conflict` (e.g. duplicate role slug).
  - Mounted at `/users/roles` and `/roles`.

---

## 3. Acceptance Criteria
- [x] Database migrations create individual tables (`roles`, `permissions`, `user_roles`, `role_permissions`) and seeder populates default roles and permissions.
- [x] User authentication (`/auth/login` and `/auth/profile`) returns user details along with dynamic DB `roles` and `permissions`.
- [x] `UserTypesGuard` strictly restricts API zones by `userType` (e.g. `PORTAL_USER` vs `ADMIN`).
- [x] CASL authorization verifies fine-grained `(resource, action)` permissions dynamically.
- [x] `AdminSidebar` dynamically enables accessible items and disables unauthorized items with visual cues.
- [x] Direct navigation to unauthorized routes renders the `ForbiddenPage` (403).
- [x] Action buttons (Add, Edit, Delete) across tables are rendered in disabled state (`opacity-40 cursor-not-allowed`) when lacking permission.
- [x] Full Role CRUD operates seamlessly on backend and frontend (`/users/roles`).
- [x] User management modal (`/users`) allows assigning multiple dynamic roles, persisted to `user_roles`.
- [x] Backend resolves permissions on-the-fly (`findOrCreate`) without requiring `permissionIds`.
- [x] Code strictly adheres to the `prefer-early-return` skill (guard clauses, early exits, flat flows).
- [x] Unit, component, and integration tests pass via `pnpm test` (38/38 web tests + 6/6 API tests).
- [x] `pnpm lint` and `pnpm build` pass with zero errors across all workspaces.
