# Feature Spec: User List Management, Filter, Sort & CRUD (with Soft Delete)

## 1. Goal & Context
Update the existing Customer List interface into a dynamic, API-driven User Management interface. The interface fetches live user data from the NestJS REST API (`/api/v1/users`), supports pagination, sorting on `updated_at` (or `updatedAt`) and `username`, user type filtering (`ADMIN`, `CMS`, `CUSTOMER`), deleted user filtering (`Active`, `Deleted`, `All`), username/name search, and full CRUD operations (Create, Read, Update, Soft Delete) with interactive modal dialogs and toast/alert feedback.

**Architecture Alignment**:
- `Admin Feature Module` (`apps/web/src/features/admin`): Dedicated layout and navigation shells (`AdminHeader`, `AdminSidebar`, `AdminLayout` with React Router `<Outlet />`).
  - **Fixed / Sticky Sidebar & Header Layout**: Admin layout is pinned to full viewport (`h-screen overflow-hidden`), ensuring the top header and navigation sidebar stay fixed/sticky while the main content area (`UserListTable` / list view) scrolls independently.
- `Users Feature Module` (`apps/web/src/features/users` or `user`): Dedicated domain feature module for all user management logic:
  - `components/`: `UserListTable`, `UserForm`, `UserFormDialog`, `DeleteUserDialog`, and component unit tests.
  - `hooks/`: `useUsersQuery`, `useCreateUserMutation`, `useUpdateUserMutation`, `useDeleteUserMutation`.
  - `index.ts`: Public API export barrel for the users feature.
- `UsersPage` (`apps/web/src/routes/users-page.tsx`): Independent route page component mounted at `/users` under `AdminLayout`, importing and hosting `UserListTable` from the users feature module.

## 2. Requirements & Boundaries
- [x] Contracts (`@repo/contracts`):
  - [x] Add `sortBy?: 'username' | 'updatedAt'` and `sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc'` to `FindUsersSchema`.
  - [x] Add `userType?: UserTypeEnum` filter property to `FindUsersSchema`.
  - [x] Add `includeDeleted?: boolean` and `onlyDeleted?: boolean` (using `z.coerce.boolean().optional()`) to `FindUsersSchema`.
  - [x] Add optional `status?: UserStatusEnum` and `userType?: UserTypeEnum` to `CreateUserSchema`.
  - [x] Include `deletedAt?: Date | null` and `updatedAt?: Date | string` in `UserSchema`.
  - [x] Ensure full `API_ROUTE.USER` endpoints are defined (`LIST`, `CREATE`, `GET`, `UPDATE`, `DELETE`).
- [x] Backend API (`apps/api`):
  - [x] Update `UserService.findAll()`:
    - [x] Apply sorting on `user.username` or `user.updatedAt` with specified direction (`ASC`/`DESC`), defaulting to `updatedAt DESC`.
    - [x] Support `userType` and `name` search filters.
    - [x] Support `includeDeleted` (`query.withDeleted()`) and `onlyDeleted` (`query.withDeleted().andWhere('user.deletedAt IS NOT NULL')`).
  - [x] Update `UserService.createUser()` to handle `userType` and `status` when supplied.
  - [x] Add `UserService.deleteUser(id)` using TypeORM `userRepo.softDelete(id)`.
  - [x] Add `@Delete(':id')` endpoint to `UserController` guarded with `JwtAuthGuard`, `CaslAccessGuard`, and `UseAbility(DefaultActions.delete, User, UserHook)`.
  - [x] Add backend e2e tests in `apps/api/test/user.e2e-spec.ts` for sorting, filtering (including deleted users), creating, updating, and soft deleting users.
- [x] Web Frontend (`apps/web`):
  - [x] Users Feature Module (`apps/web/src/features/users`):
    - [x] `hooks/use-users-query.ts`: `useUsersQuery` hook to fetch users list with pagination, search, filters, and sorting.
    - [x] `hooks/use-user-mutations.ts`: Mutation hooks for create, update, and soft delete.
    - [x] `components/user-list-table.tsx`: Modular table component with TanStack Table v8, filter controls, column sorting, and pagination.
    - [x] `components/user-form.tsx`: Reusable user form component with React Hook Form and Zod validation.
    - [x] `components/user-form-dialog.tsx`: Dialog wrapper for user form modal.
    - [x] `components/delete-user-dialog.tsx`: Confirmation modal for user soft deletion.
    - [x] `index.ts`: Barrel export for the users feature module.
    - [x] Unit & Component Tests in `features/users`: Vitest tests for `user-list-table.spec.tsx` and `user-form.spec.tsx`.
  - [x] Admin Layout & Navigation (`apps/web/src/features/admin`):
    - [x] `AdminLayout`: Layout route container rendering `AdminHeader`, `AdminSidebar`, and `<Outlet />`. Configured with viewport bounds (`h-screen overflow-hidden`) so the sidebar remains fixed/sticky in place while user list content scrolls independently.
    - [x] `AdminSidebar`: Route-aware navigation linking to `/dashboard` and `/users` with independent scroll capability (`h-full overflow-y-auto shrink-0`).
    - [x] `admin-layout.spec.tsx`: Layout and sidebar tests.
  - [x] Routing (`apps/web/src/routes`):
    - [x] `users-page.tsx`: Route page component for `/users` rendering `UserListTable`.
    - [x] `dashboard-page.tsx`: Route page component for `/dashboard`.
    - [x] `router.tsx`: Nested route configuration with `AdminLayout` parent and `/dashboard`, `/users` child routes.

## 3. Tech Design & File Scope
- Target Files:
  - `packages/contracts/src/user.dto.ts` [MODIFY]
  - `packages/contracts/src/route.ts` [MODIFY]
  - `apps/api/src/user/user.service.ts` [MODIFY]
  - `apps/api/src/user/user.controller.ts` [MODIFY]
  - `apps/api/test/user.e2e-spec.ts` [MODIFY]
  - `apps/web/src/features/users/hooks/use-users-query.ts` [NEW]
  - `apps/web/src/features/users/hooks/use-user-mutations.ts` [NEW]
  - `apps/web/src/features/users/components/user-list-table.tsx` [NEW]
  - `apps/web/src/features/users/components/user-form.tsx` [NEW]
  - `apps/web/src/features/users/components/user-form-dialog.tsx` [NEW]
  - `apps/web/src/features/users/components/delete-user-dialog.tsx` [NEW]
  - `apps/web/src/features/users/components/user-list-table.spec.tsx` [NEW]
  - `apps/web/src/features/users/components/user-form.spec.tsx` [NEW]
  - `apps/web/src/features/users/index.ts` [NEW]
  - `apps/web/src/features/admin/components/admin-layout.tsx` [MODIFY] (fixed/sticky sidebar & header scroll containment)
  - `apps/web/src/features/admin/components/admin-sidebar.tsx` [MODIFY]
  - `apps/web/src/features/admin/components/admin-layout.spec.tsx` [MODIFY]
  - `apps/web/src/features/admin/index.ts` [MODIFY] (clean up user-specific exports)
  - `apps/web/src/routes/users-page.tsx` [MODIFY] (import from `@/features/users`)
  - `apps/web/src/routes/dashboard-page.tsx` [MODIFY]
  - `apps/web/src/routes/router.tsx` [MODIFY]
- New Dependencies: None (uses existing `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `@repo/contracts`)

## 4. Acceptance Criteria
- [x] Contracts build cleanly (`pnpm --filter @repo/contracts build`).
- [x] Backend e2e tests pass for sorting on username and updated_at, user query filters, deleted user filtering, and soft delete (`pnpm --filter api test`).
- [x] `AdminLayout` acts as a route layout with `<Outlet />`, containing fixed header and sticky/fixed sidebar.
- [x] Sidebar remains fixed/sticky in view while scrolling through the user list or table contents.
- [x] `UsersPage` is mounted at route `/users` as an independent page under `AdminLayout`.
- [x] User management logic is fully encapsulated in its own feature module (`apps/web/src/features/users`).
- [x] Sidebar active states reflect the current URL pathname and trigger client-side route navigation.
- [x] Frontend unit & component tests pass (`pnpm --filter web test`).
- [x] Oxlint passes across all workspaces (`pnpm lint`).
- [x] Live UI allows sorting by clicking `Username` and `Updated At` headers, filtering by User Type, searching, and performing CRUD.
