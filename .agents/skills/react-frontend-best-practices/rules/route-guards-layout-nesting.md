---
title: Use Nested Layout Routes for Shared Navigation Shells and Auth Guards
impact: MEDIUM-HIGH
impactDescription: Prevents repeating headers/sidebars and centralizes authentication authorization guards.
tags: routing, react-router, auth-guards, layout-routes
---

## Use Nested Layout Routes for Shared Navigation Shells and Auth Guards

**Impact: MEDIUM-HIGH (Eliminates layout duplication and centralizes authentication routing safety)**

Duplicating auth checks (`if (!isAuthenticated) return <Navigate to="/login" />`) or wrapping `<Header />` and `<Sidebar />` inside every individual page view component leads to duplicate logic and causes layout flickering when navigating between pages.

Use React Router **Nested Layout Routes** (`<Outlet />`) to encapsulate shared UI shells and wrap protected routes inside dedicated `ProtectedLayout` guard components.

**Incorrect (Duplicating auth check and layout shell inside every page):**

```tsx
// ❌ Bad: Repeats header, sidebar, and auth check on every page component
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <Header />
      <Sidebar />
      <main>Dashboard Content</main>
    </div>
  );
}
```

**Correct (Nested ProtectedLayout route wrapper with `<Outlet />`):**

```tsx
// 1. Auth Guard Layout Component (routes/protected-layout.tsx)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';

export function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    // Redirect unauthenticated user while preserving intended destination URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader user={user} />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-6">
          {/* ✅ Renders matching nested child route element */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// 2. Route Hierarchy Definition
export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
]);
```

Reference: [React Router - Outlets and Layout Routes](https://reactrouter.com/en/main/components/outlet)
