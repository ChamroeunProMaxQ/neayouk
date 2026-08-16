import { useState, useEffect, type FC } from "react";
import { useForm } from "react-hook-form";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserStatusEnum,
  UserTypeEnum,
  type CreateUserDto,
  type UpdateUserDto,
  type UserAttribute,
} from "@repo/contracts";
import { Loader2, AlertCircle, Shield, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRolesQuery } from "@/features/roles";

export type UserFormValues = CreateUserDto | UpdateUserDto;

export interface UserFormProps {
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel?: () => void;
  userToEdit?: UserAttribute | null;
  isLoading?: boolean;
  submitButtonLabel?: string;
}

export const UserForm: FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  userToEdit,
  isLoading = false,
  submitButtonLabel,
}) => {
  const isEdit = Boolean(userToEdit);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: rolesResponse, isLoading: isRolesLoading } = useRolesQuery();
  const availableRoles = rolesResponse?.data ?? [];

  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (userToEdit?.roles && userToEdit.roles.length > 0) {
      return userToEdit.roles
        .map((r) => (typeof r === "string" ? r : r.slug))
        .filter(Boolean);
    }
    return [];
  });

  const activeSchema = isEdit ? UpdateUserSchema : CreateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
      roles: selectedRoles,
    },
  });

  useEffect(() => {
    setServerError(null);
    const initialRoles = userToEdit?.roles && userToEdit.roles.length > 0
      ? userToEdit.roles.map((r) => (typeof r === "string" ? r : r.slug)).filter(Boolean)
      : [];
    setSelectedRoles(initialRoles);

    reset({
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
      roles: initialRoles,
    });
  }, [userToEdit, reset]);

  const toggleRole = (slug: string) => {
    const next = selectedRoles.includes(slug)
      ? selectedRoles.filter((s) => s !== slug)
      : [...selectedRoles, slug];
    setSelectedRoles(next);
    setValue("roles", next, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: UserFormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        ...values,
        roles: selectedRoles,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save user. Please check the values and try again.";
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-sans" noValidate>
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
            "bg-white transition-all text-xs",
            errors.username
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              : "border-slate-200 focus-visible:ring-[#45AC5E]/20 focus-visible:border-[#45AC5E]"
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
            "bg-white transition-all text-xs",
            errors.password
              ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              : "border-slate-200 focus-visible:ring-[#45AC5E]/20 focus-visible:border-[#45AC5E]"
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

      {/* User Type & Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* User Type / Account Category */}
        <div className="space-y-1.5">
          <label
            htmlFor="userType"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            User Type (Portal)
          </label>
          <select
            id="userType"
            {...register("userType")}
            className={cn(
              "w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition-all text-slate-700 cursor-pointer",
              errors.userType
                ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-200 focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E]"
            )}
          >
            <option value={UserTypeEnum.CUSTOMER}>Portal User / Customer</option>
            <option value={UserTypeEnum.CMS}>CMS Staff</option>
            <option value={UserTypeEnum.ADMIN}>System Administrator</option>
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
              "w-full px-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition-all text-slate-700 cursor-pointer",
              errors.status
                ? "border-red-500 ring-2 ring-red-500/20 text-red-900 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-200 focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E]"
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
      </div>

      {/* Dynamic Role Assignment Section */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#45AC5E]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Assigned Dynamic Roles
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {selectedRoles.length} selected
          </span>
        </div>

        {isRolesLoading ? (
          <div className="p-3 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
            Loading available roles...
          </div>
        ) : availableRoles.length === 0 ? (
          <div className="p-3 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
            No dynamic roles configured yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            {availableRoles.map((role, idx) => {
              const roleKey = role.slug || role.name || `role-${role.id ?? idx}`;
              const isSelected = selectedRoles.includes(role.slug);
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => toggleRole(role.slug)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#45AC5E] text-white shadow-xs font-semibold"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{role.name}</span>
                </button>
              );
            })}
          </div>
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
            className="cursor-pointer"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-[#45AC5E] hover:bg-[#389350] text-white cursor-pointer shadow-xs"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitButtonLabel || (isEdit ? "Update User" : "Create User")}</span>
        </Button>
      </div>
    </form>
  );
};
