import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogInSchema, type LogInDto } from "@repo/contracts";
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

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogInDto>({
    resolver: zodResolver(LogInSchema),
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
    <Card className="w-full max-w-md mx-auto shadow-lg border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Sign In
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {loginMutation.isError && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-md">
              {loginMutation.error.message}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Username
            </label>
            <Input
              {...register("username")}
              placeholder="admin"
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Password
            </label>
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
