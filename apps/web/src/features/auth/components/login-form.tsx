import { useState } from "react";
import { useForm } from "react-hook-form";
import { LogInSchema, type LogInDto } from "@repo/contracts";
import { Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useLoginMutation } from "../hooks/use-login-mutation";

function createZodResolver(schema: typeof LogInSchema) {
  return async (values: LogInDto) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = String(issue.path[0] || "");
      if (path && !errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }
    return { values: {}, errors };
  };
}

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogInDto>({
    resolver: createZodResolver(LogInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LogInDto) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border border-blue-100 dark:border-blue-900/40 bg-card overflow-hidden rounded-xl">
      {/* Material UI Gradient Top Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1976d2] via-[#7b1fa2] to-[#00897b]" />

      <CardHeader className="space-y-2 text-center pb-2 pt-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1976d2] to-[#7b1fa2] flex items-center justify-center text-white shadow-lg mb-1">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1565c0] dark:text-[#90caf9]">
          Admin Portal Sign In
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
          Enter your credentials to log in. Supports Admin, CMS & Customer accounts.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4 pt-4">
          {loginMutation.isError && (
            <div
              role="alert"
              className="p-3 text-xs font-medium text-[#d32f2f] bg-[#ffebee] rounded-md border border-[#ffcdd2] flex items-start gap-2 shadow-sm"
            >
              <span>{loginMutation.error.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="username-input"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#1976d2]" />
              Username
            </label>
            <div className="relative">
              <Input
                id="username-input"
                {...register("username")}
                placeholder="Enter username (e.g. admin)"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                className="pl-3 focus-visible:ring-[#1976d2] border-slate-300 dark:border-slate-700"
              />
            </div>
            {errors.username && (
              <p role="alert" className="text-xs text-[#d32f2f] mt-1 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#1976d2]" />
              Password
            </label>
            <div className="relative flex items-center">
              <Input
                id="password-input"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="pr-10 focus-visible:ring-[#1976d2] border-slate-300 dark:border-slate-700"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 text-muted-foreground hover:text-[#1976d2] transition-colors p-1 rounded focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="text-xs text-[#d32f2f] mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
          <Button
            type="submit"
            className="w-full font-semibold bg-[#1976d2] hover:bg-[#1565c0] active:bg-[#0d47a1] text-white shadow-md hover:shadow-lg transition-all rounded-lg h-10"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


