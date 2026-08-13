# Feature Spec: Admin Layout & Customer List Interface

## 1. Goal & Context
Build the D1 CMS Admin Layout according to the provided reference image. The interface features a structured left navigation sidebar with collapsible store/system management sections, a top status header with live toggles and user profile controls, and a main content area rendering the active Customer List (User table) view with search, pagination, and user actions.

## 2. Requirements & Boundaries
- [x] Top Header: Display "D1" logo badge with "CMS_ADMIN" tag, "Open Orders" toggle switch (active green indicator), status indicator, and user profile avatar.
- [x] Left Sidebar Navigation:
  - Top navigation items: Dashboard, Customer Orders, Customer List (active selected tab highlighted in coral accent).
  - Store Managements section: Promo and Campaign (collapsible), Coupon, Discounts, Product Display, Product and Category, Banner Ads, Notifications, Operation Settings (collapsible), Delivery Zone, Delivery Timeslots.
  - System Management section: Settings (collapsible).
- [x] Main Content Area (Customer List / User View):
  - Header actions: Search input field with search icon, "Upload Bulk Users" button, pagination control ("1-10 of 33272" with navigation buttons).
  - Customer Data Table: Columns for Photo, Code, Name, Gender, Username, Phone Number, Actions.
  - Action items per row: "Edit" and "Delete" action buttons.
- [x] Styling & Aesthetics: Matches screenshot color palette (soft salmon/coral highlights `#F05A4A`/`#E76F51`, soft gray container backgrounds, clean typography, rounded card layouts).
- [x] Unit & Component Tests: Write Vitest + React Testing Library component tests covering navigation rendering, section collapsing/expanding, search filtering, and user table action callbacks.

## 3. Tech Design & File Scope
- Target Files:
  - `apps/web/src/features/admin/components/admin-layout.tsx` [NEW]
  - `apps/web/src/features/admin/components/admin-sidebar.tsx` [NEW]
  - `apps/web/src/features/admin/components/admin-header.tsx` [NEW]
  - `apps/web/src/features/admin/components/customer-list-table.tsx` [NEW]
  - `apps/web/src/features/admin/components/admin-layout.spec.tsx` [NEW]
  - `apps/web/src/features/admin/components/customer-list-table.spec.tsx` [NEW]
  - `apps/web/src/routes/dashboard-page.tsx` [MODIFY]
  - `apps/web/src/routes/router.tsx` [MODIFY]
- New Dependencies: None (uses `lucide-react`, `tailwindcss`, `@repo/contracts`)

## 4. Acceptance Criteria
- [x] Unit tests pass via `pnpm test`
- [x] Build succeeds via `pnpm build`
- [x] Visual verification of D1 Admin Layout matching provided image design
