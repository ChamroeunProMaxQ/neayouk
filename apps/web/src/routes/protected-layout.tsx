import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useIsAuthenticated } from "@/features/auth";

export function ProtectedLayout() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
