import { useNavigate } from "react-router-dom";
import { LoginForm, useIsAuthenticated } from "@/features/auth";
import { useEffect } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <LoginForm onSuccess={() => navigate("/dashboard")} />
    </div>
  );
}
