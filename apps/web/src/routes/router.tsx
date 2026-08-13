import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { LayoutShell } from "@/shared/components/layout-shell";
import { ProtectedLayout } from "./protected-layout";

const LoginPage = lazy(() =>
  import("./login-page").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("./dashboard-page").then((m) => ({ default: m.DashboardPage }))
);

function PageFallback() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F05A4A] border-t-transparent" />
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
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageFallback />}>
            <DashboardPage />
          </Suspense>
        ),
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

