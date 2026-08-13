---
title: Implement Route-Level Code Splitting using `React.lazy` and Suspense
impact: MEDIUM-HIGH
impactDescription: Significantly reduces initial JS bundle size and improves First Contentful Paint (FCP).
tags: routing, react-router, code-splitting, lazy-loading, performance
---

## Implement Route-Level Code Splitting using `React.lazy` and Suspense

**Impact: MEDIUM-HIGH (Reduces initial JS bundle size by deferring non-essential page loads)**

Bundling all route components and heavy libraries (like charting engines or rich text editors) into a single synchronous JavaScript bundle forces users to download hundreds of kilobytes of code for pages they may never visit.

Implement **Route-Level Code Splitting** using dynamic `import()` wrapped in `React.lazy()` and `React.Suspense` fallback boundaries.

**Incorrect (Sync imports loading all route components into main bundle):**

```tsx
// ❌ Bad: All heavy route components loaded in initial bundle
import { AdminDashboard } from '@/features/admin/admin-dashboard';
import { AnalyticsReport } from '@/features/analytics/analytics-report';
import { SettingsPage } from '@/features/settings/settings-page';

export const router = createBrowserRouter([
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/analytics', element: <AnalyticsReport /> },
  { path: '/settings', element: <SettingsPage /> },
]);
```

**Correct (Dynamic lazy route imports with Suspense fallback):**

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// ✅ Good: Dynamic imports loaded only when user navigates to route
const AdminDashboard = lazy(() =>
  import('@/features/admin/admin-dashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AnalyticsReport = lazy(() =>
  import('@/features/analytics/analytics-report').then((m) => ({ default: m.AnalyticsReport }))
);

function SuspenseFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'admin',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <AnalyticsReport />
          </Suspense>
        ),
      },
    ],
  },
]);
```

Reference: [React Router - Lazy Loading Routes](https://reactrouter.com/en/main/route/lazy)
