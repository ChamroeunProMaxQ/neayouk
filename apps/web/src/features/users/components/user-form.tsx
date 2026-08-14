import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserStatusEnum,
  UserTypeEnum,
  type UserAttribute,
} from "@repo/contracts";
import { Loader2 } from "lucide-react";

export const userFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
  userType: z.nativeEnum(UserTypeEnum),
  status: z.nativeEnum(UserStatusEnum),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
    },
  });

  React.useEffect(() => {
    reset({
      username: userToEdit?.username ?? "",
      password: "",
      userType: userToEdit?.userType ?? UserTypeEnum.CUSTOMER,
      status: userToEdit?.status ?? UserStatusEnum.ACTIVE,
    });
  }, [userToEdit, reset]);

  return (
    <form
      onSubmit={handleSubmit((values) => {
        return onSubmit(values);
      })}
      className="space-y-4"
    >
      {/* Username */}
      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="e.g. john_doe"
          {...register("username")}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A] transition-colors"
        />
        {errors.username && (
          <p className="text-xs text-rose-500 font-medium">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
        >
          {isEdit ? "Password (Leave blank to keep unchanged)" : "Password"}
        </label>
        <input
          id="password"
          type="password"
          placeholder={isEdit ? "••••••••" : "At least 6 characters"}
          {...register("password")}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A] transition-colors"
        />
        {errors.password && (
          <p className="text-xs text-rose-500 font-medium">
            {errors.password.message}
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
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A] bg-white transition-colors text-slate-700"
        >
          <option value={UserTypeEnum.CUSTOMER}>Customer</option>
          <option value={UserTypeEnum.CMS}>CMS Editor</option>
          <option value={UserTypeEnum.ADMIN}>Admin</option>
        </select>
        {errors.userType && (
          <p className="text-xs text-rose-500 font-medium">
            {errors.userType.message}
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
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A] bg-white transition-colors text-slate-700"
        >
          <option value={UserStatusEnum.ACTIVE}>Active</option>
          <option value={UserStatusEnum.INACTIVE}>Inactive</option>
        </select>
        {errors.status && (
          <p className="text-xs text-rose-500 font-medium">
            {errors.status.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#F05A4A] hover:bg-[#D94738] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitButtonLabel || (isEdit ? "Update User" : "Create User")}</span>
        </button>
      </div>
    </form>
  );
};
