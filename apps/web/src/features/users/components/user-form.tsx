import React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z, type ZodSchema } from "zod";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserStatusEnum,
  UserTypeEnum,
  type CreateUserDto,
  type UpdateUserDto,
  type UserAttribute,
} from "@repo/contracts";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { zodResolver } from "@/shared/lib/zod-resolver";

export type UserFormValues = CreateUserDto | UpdateUserDto;

export interface UserFormProps {
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel?: () => void;
  userToEdit?: UserAttribute | null;
  isLoading?: boolean;
  submitButtonLabel?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  userToEdit,
  isLoading = false,
  submitButtonLabel,
}) => {
  const isEdit = Boolean(userToEdit);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const activeSchema = isEdit ? UpdateUserSchema : CreateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
    },
  });

  React.useEffect(() => {
    setServerError(null);
    reset({
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
    });
  }, [userToEdit, reset]);

  const handleFormSubmit = async (values: UserFormValues) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save user. Please check the values and try again.";
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      {/* Server / API Error Banner */}
      {serverError && (
        <div className="flex items-start gap-2 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <Input
          id="username"
          type="text"
          placeholder="e.g. john_doe"
          {...register("username")}
          className={cn(
            "bg-white transition-all",
            errors.username
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              : "border-slate-200 focus-visible:ring-[#F05A4A]/20 focus-visible:border-[#F05A4A]"
          )}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : undefined}
        />
        {errors.username ? (
          <p id="username-error" className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{errors.username.message}</span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">Must be at least 1 character.</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          {isEdit ? "Password (Optional)" : "Password"} {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <Input
          id="password"
          type="password"
          placeholder={isEdit ? "•••••••• (leave blank to keep unchanged)" : "At least 6 characters"}
          {...register("password")}
          className={cn(
            "bg-white transition-all",
            errors.password
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              : "border-slate-200 focus-visible:ring-[#F05A4A]/20 focus-visible:border-[#F05A4A]"
          )}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password ? (
          <p id="password-error" className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{errors.password.message}</span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">
            {isEdit
              ? "Leave blank to keep existing password, or enter at least 6 characters to change."
              : "Password must be at least 6 characters."}
          </p>
        )}
      </div>

      {/* User Type / Role */}
      <div className="space-y-1.5">
        <label
          htmlFor="userType"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          User Role
        </label>
        <select
          id="userType"
          {...register("userType")}
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none bg-white transition-all text-slate-700",
            errors.userType
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-200 focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A]"
          )}
        >
          <option value={UserTypeEnum.CUSTOMER}>Customer</option>
          <option value={UserTypeEnum.CMS}>CMS Editor</option>
          <option value={UserTypeEnum.ADMIN}>Admin</option>
        </select>
        {errors.userType && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{errors.userType.message}</span>
          </p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label
          htmlFor="status"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          Account Status
        </label>
        <select
          id="status"
          {...register("status")}
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none bg-white transition-all text-slate-700",
            errors.status
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus:border-red-500 focus:ring-red-500/30"
              : "border-slate-200 focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A]"
          )}
        >
          <option value={UserStatusEnum.ACTIVE}>Active</option>
          <option value={UserStatusEnum.INACTIVE}>Inactive</option>
        </select>
        {errors.status && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{errors.status.message}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-[#F05A4A] hover:bg-[#D94738] text-white"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitButtonLabel || (isEdit ? "Update User" : "Create User")}</span>
        </Button>
      </div>
    </form>
  );
};
