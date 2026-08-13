import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { Button } from "@/components/ui/button";

export function LayoutShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg text-primary">
              Web App
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                to="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Hello, <strong className="text-foreground">{user.username}</strong>
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Built with React 19, TypeScript, Tailwind CSS, &amp; @repo/contracts
      </footer>
    </div>
  );
}
