import { useAuthUser, useAuthStore } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { API_ROUTE } from "@repo/contracts";
import { LogOut, UserCheck, Shield, KeyRound } from "lucide-react";

export function DashboardPage() {
  const user = useAuthUser();
  const logout = useAuthStore((state) => state.logout);

  const role = (user?.userType || user?.type || "AUTHENTICATED").toUpperCase();

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case "ADMIN":
        return "bg-[#f3e5f5] text-[#7b1fa2] border-[#e1bee7]";
      case "CMS":
        return "bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]";
      case "CUSTOMER":
        return "bg-[#e0f2f1] text-[#00695c] border-[#b2dfdb]";
      default:
        return "bg-blue-50 text-[#1976d2] border-blue-200";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1565c0] dark:text-[#90caf9]">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back to your workspace dashboard
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          className="gap-2 border-[#1976d2] text-[#1976d2] hover:bg-[#1976d2] hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-1 w-full bg-[#1976d2]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg text-slate-800 dark:text-slate-100">User Profile</CardTitle>
              <CardDescription>
                Authenticated Session
              </CardDescription>
            </div>
            <UserCheck className="w-5 h-5 text-[#1976d2]" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Username</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{user?.username ?? "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-2 items-center">
              <span className="text-muted-foreground">Role / Type</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getRoleBadgeStyle(role)}`}>
                <Shield className="w-3.5 h-3.5" />
                {role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID / Sub</span>
              <span className="font-mono text-xs font-semibold">{user?.id ?? user?.sub ?? "1"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-1 w-full bg-[#7b1fa2]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg text-slate-800 dark:text-slate-100">API Contract Routes</CardTitle>
              <CardDescription>
                Shared paths from @repo/contracts
              </CardDescription>
            </div>
            <KeyRound className="w-5 h-5 text-[#7b1fa2]" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-[#1565c0]">LOGIN: {API_ROUTE.AUTH.LOGIN}</div>
            <div className="text-[#7b1fa2]">PROFILE: {API_ROUTE.AUTH.PROFILE}</div>
            <div className="text-[#c2185b]">LOGOUT: {API_ROUTE.AUTH.LOGOUT}</div>
            <div className="text-[#00695c]">REFRESH: {API_ROUTE.AUTH.REFRESH_TOKEN}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


