# Feature Spec: Cleanup Abandoned Components, Files, Routes, and Backend APIs

**Status**: Completed & Archived  
**Date**: 2026-09-14  

## 1. Goal & Context
Perform a systematic cleanup of abandoned, unused, and orphaned code across the monorepo by verifying all functionality against [admin-sidebar.tsx](file:///e:/work/neayouk/apps/web/src/features/admin/components/admin-sidebar.tsx).

During the evolution of the application (such as the school settings refactor and class management enhancements), several files, routes, mock views, and backend endpoints were left orphaned or abandoned:
- `settings-page.tsx` was abandoned when school settings was split into `school-profile-page.tsx` and `integrations-page.tsx`.
- Standalone `/academics/academic-years` and `/academics/timetable` routes were removed from the sidebar in favor of embedded class timetables in `ClassDetailDialog`. Their standalone pages (`AcademicYearsPage`, `TimetablePage`) and views (`AcademicYearsView`, `TimetableHubView`) remain orphaned.
- The dummy placeholder component `dummy-page.tsx` is only used by deprecated routes (`/settings/rules`, `/settings/audit-logs`) and fallback wildcards.
- Backend endpoint `GET /api/v1/admin/classes/academic-years/summary` was only consumed by the mock `AcademicYearsView` and is no longer called by the frontend.
- `admin-sidebar.tsx` contains unused icon imports (`Bell`).
- Furthermore, the entire legacy `Dashboard` feature (`/dashboard`, `DashboardPage`, `ResourceEnum.DASHBOARD`, and associated seed roles) was completely removed per user instruction, redirecting initial app entry to `/users`.

---

## 2. Requirements & Boundaries

### 2.1 Web Frontend Cleanup (`apps/web`)
- [x] **Delete Abandoned Route Pages**:
  - `apps/web/src/routes/settings-page.tsx` (completely unused duplicate)
  - `apps/web/src/routes/academic-years-page.tsx` (abandoned route)
  - `apps/web/src/routes/timetable-page.tsx` (abandoned route)
  - `apps/web/src/routes/dummy-page.tsx` (abandoned placeholder)
  - `apps/web/src/routes/dashboard-page.tsx` (completely removed dashboard)
- [x] **Delete Abandoned Feature Components**:
  - `apps/web/src/features/classes/components/academic-years-view.tsx` (mock data view)
  - `apps/web/src/features/classes/components/timetable-hub-view.tsx` (standalone hub view)
- [x] **Preserve Active Class Timetable Management**:
  - Retain `ClassTimetableGrid` and `TimetableSlotDialog` used inside `ClassDetailDialog` for per-class scheduling.
- [x] **Clean Router Configuration (`apps/web/src/routes/router.tsx`)**:
  - Remove imports and route definitions for:
    - `/academics/academic-years`
    - `/academics/timetable`
    - `/settings/rules`
    - `/settings/audit-logs`
    - `/dashboard`
  - Replace root `/` and wildcard `*` fallback routes to redirect to `/users`.
  - Update `login-page.tsx` and `forbidden-page.tsx` default redirects from `/dashboard` to `/users`.
- [x] **Clean Classes Feature Hooks & Exports**:
  - Remove `useAcademicYearsSummaryQuery` from `apps/web/src/features/classes/hooks/use-classes-infinite-query.ts`.
  - Remove deleted exports from `apps/web/src/features/classes/index.ts`.
- [x] **Align Admin Sidebar (`apps/web/src/features/admin/components/admin-sidebar.tsx`)**:
  - Remove unused import `Bell`.
  - Completely remove `Dashboard` nav item from `adminNavGroups`.
- [x] **Update Frontend Unit Tests**:
  - Update `admin-sidebar.spec.tsx` and `admin-layout.spec.tsx` to match active sidebar labels and `/users` default routes.
  - Fix Axios mocking in `apps/web/src/shared/lib/api-client.spec.ts`.

---

### 2.2 Shared Contracts Cleanup (`packages/contracts`)
- [x] Remove `ACADEMIC_YEARS_SUMMARY: '/api/v1/admin/classes/academic-years/summary'` from `API_ROUTE.CLASS` in `packages/contracts/src/route.ts`.
- [x] Remove `AcademicYearSummaryItemSchema` & type from `packages/contracts/src/class.dto.ts`.
- [x] Remove `DASHBOARD` from `ResourceEnum` in `packages/contracts/src/resource.enum.ts`.
- [x] Remove `DASHBOARD` from `permission-tree.ts`.

---

### 2.3 Backend API Cleanup (`apps/api`)
- [x] **Remove Unused Controller Endpoint**:
  - In `apps/api/src/academic/admin.class.controller.ts`, remove `@Get('academic-years/summary') getAcademicYearsSummary(...)`.
- [x] **Remove Unused Service Method**:
  - In `apps/api/src/academic/class.service.ts`, remove `getAcademicYearsSummary`.
  - In `apps/api/src/academic/class.service.spec.ts`, remove the test case for `getAcademicYearsSummary`.
- [x] **Remove Dashboard Permissions from Database Seeders**:
  - In `apps/api/database/seeds/2026.08.16T00.00.00.roles-and-permissions-seeder.ts`, remove `'dashboard:read'` from role permission mappings.
- [x] **Fix Payroll Service Mock**:
  - In `apps/api/src/hr/payroll.service.spec.ts`, add `createQueryBuilder` mock to `mockStaffRepo`.
- [x] **Resolve Oxlint Warnings**:
  - Remove unused variables and imports flagged by `oxlint` in:
    - `src/common/filter/http-exception.filter.ts`
    - `src/fee/invoice.service.spec.ts`
    - `src/student/student.service.spec.ts`
    - `src/fee/expense.service.spec.ts`
    - `test/vitest.global-setup.ts`
    - `test/examination.e2e-spec.ts`

---

## 3. Tech Design & File Scope

### Deleted Files
| File Path | Rationale |
| :--- | :--- |
| `apps/web/src/routes/settings-page.tsx` | Unused legacy settings page, superseded by `school-profile-page.tsx` & `integrations-page.tsx` |
| `apps/web/src/routes/academic-years-page.tsx` | Standalone academic years page removed from sidebar navigation |
| `apps/web/src/features/classes/components/academic-years-view.tsx` | Hardcoded mock view only used by `academic-years-page.tsx` |
| `apps/web/src/routes/timetable-page.tsx` | Standalone timetable page removed from sidebar navigation |
| `apps/web/src/features/classes/components/timetable-hub-view.tsx` | Standalone hub view superseded by in-dialog timetable scheduling |
| `apps/web/src/routes/dummy-page.tsx` | Dummy placeholder page no longer needed once abandoned routes are removed |
| `apps/web/src/routes/dashboard-page.tsx` | Standalone dashboard page completely removed per user request |

---

## 4. Acceptance Criteria
- [x] `pnpm lint` executes across all workspaces with 0 errors and 0 warnings (237 files in API, 246 files in Web).
- [x] `pnpm --filter web exec vitest run` passes 100% of tests (33 test files, 116 tests).
- [x] `pnpm --filter api exec vitest run` passes API tests (21 test files, 127 tests).
- [x] `pnpm build` executes topological build of contracts, api, and web successfully.

