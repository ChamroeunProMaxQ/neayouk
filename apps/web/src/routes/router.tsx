import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { LayoutShell } from "@/shared/components/layout-shell";
import { ProtectedLayout } from "./protected-layout";
import { PermissionRoute } from "./permission-route";
import { ForbiddenPage } from "./forbidden-page";

const LoginPage = lazy(() =>
  import("./login-page").then((m) => ({ default: m.LoginPage }))
);
const AdminLayout = lazy(() =>
  import("@/features/admin").then((m) => ({ default: m.AdminLayout }))
);
const DashboardPage = lazy(() =>
  import("./dashboard-page").then((m) => ({ default: m.DashboardPage }))
);
const UsersPage = lazy(() =>
  import("./users-page").then((m) => ({ default: m.UsersPage }))
);
const RolesPage = lazy(() =>
  import("./roles-page").then((m) => ({ default: m.RolesPage }))
);
const StudentsPage = lazy(() =>
  import("./students-page").then((m) => ({ default: m.StudentsPage }))
);
const DummyPage = lazy(() =>
  import("./dummy-page").then((m) => ({ default: m.DummyPage }))
);

function PageFallback() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#45AC5E] border-t-transparent" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: (
      <LayoutShell>
        <Suspense fallback={<PageFallback />}>
          <LoginPage />
        </Suspense>
      </LayoutShell>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          {
            path: "/dashboard",
            element: (
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: "/users",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="user" action="read">
                  <UsersPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/users/roles",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="role" action="read">
                  <RolesPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/students",
            element: (
              <Suspense fallback={<PageFallback />}>
                <PermissionRoute resource="student" action="read">
                  <StudentsPage />
                </PermissionRoute>
              </Suspense>
            ),
          },
          {
            path: "/roles",
            element: <Navigate to="/users/roles" replace />,
          },
          {
            path: "/forbidden",
            element: <ForbiddenPage />,
          },
          {
            path: "*",
            element: (
              <Suspense fallback={<PageFallback />}>
                <DummyPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
