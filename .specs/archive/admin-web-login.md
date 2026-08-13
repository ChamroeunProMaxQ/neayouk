# Feature Spec: Admin Web Login Form

## 1. Goal & Context
Build an admin web login form for users to authenticate into the application. Users of any role (`ADMIN`, `CMS`, `CUSTOMER`) can log in with valid credentials, store authentication state (access token, refresh token, user details, and role), and navigate to the protected dashboard.

## 2. Requirements & Boundaries
- [x] Implement a rich, accessible Admin Login UI with username and password inputs, validation feedback, and show/hide password toggle.
- [x] Connect frontend `useLoginMutation` hook to backend `@repo/contracts` shared routes (`API_ROUTE.AUTH.LOGIN` and `API_ROUTE.AUTH.PROFILE`).
- [x] Update Zustand `useAuthStore` to store access token, refresh token, and user profile (including `userType`).
- [x] Support authentication for any user type (`ADMIN`, `CMS`, `CUSTOMER`) and display role badge in the UI with Material UI colors.
- [x] Handle error states cleanly (invalid credentials, network errors, validation errors).
- [x] Set up Vitest and React Testing Library in `apps/web` with unit/component tests for `LoginForm`.

## 3. Tech Design & File Scope
- Target Files:
  - `packages/contracts/src/route.ts`: Add `API_ROUTE.AUTH` endpoints.
  - `packages/contracts/src/auth.dto.ts`: Add `LogInResponseDto` schema.
  - `packages/contracts/src/index.ts`: Export updated contract definitions.
  - `apps/web/src/features/auth/hooks/use-login-mutation.ts`: Connect login mutation to `/api/v1/auth/login` & fetch profile.
  - `apps/web/src/features/auth/stores/use-auth-store.ts`: Support storing `refreshToken` and user info.
  - `apps/web/src/features/auth/components/login-form.tsx`: Upgrade UI with Material UI color palette (Indigo #1976d2, Teal #00695c, Amber #e65100, Purple #512da8), password toggle, and user type badges.
  - `apps/web/src/features/auth/components/login-form.spec.tsx`: Component tests for LoginForm.
  - `apps/web/vitest.config.ts`: Vitest test configuration for frontend.
  - `apps/web/package.json`: Add vitest test runner and testing library dependencies.
- New Dependencies: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`.

## 4. Acceptance Criteria
- [x] Unit tests pass via `pnpm --filter=web test`
- [x] Backend E2E tests pass via `pnpm --filter=api test:e2e`
- [x] Admin login flow verified manually / visually with Material UI colors
