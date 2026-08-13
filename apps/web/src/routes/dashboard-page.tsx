import { useAuthUser } from "@/features/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { API_ROUTE } from "@repo/contracts";

export function DashboardPage() {
  const user = useAuthUser();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back to your workspace dashboard
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Authenticated via Zustand &amp; @repo/contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">ID:</span>{" "}
              <span>{user?.id ?? "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Username:</span>{" "}
              <span className="font-semibold">{user?.username ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Routes Contract</CardTitle>
            <CardDescription>
              Shared route paths from @repo/contracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono bg-muted/50 p-4 rounded-md">
            <div>CREATE: {API_ROUTE.USER.CREATE}</div>
            <div>GET: {API_ROUTE.USER.GET}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
