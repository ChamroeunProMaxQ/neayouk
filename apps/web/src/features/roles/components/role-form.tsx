import { type FC, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateRoleSchema,
  ResourceEnum,
  type CreateRoleDto,
  type RoleDto,
} from "@repo/contracts";
import { AlertCircle, Check, CheckSquare, Shield, Sparkles, Square } from "lucide-react";

export type RoleFormValues = CreateRoleDto;

interface RoleFormProps {
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  onCancel: () => void;
  roleToEdit?: RoleDto | null;
  isLoading?: boolean;
  error?: Error | null;
}

const standardResources = Object.values(ResourceEnum).filter((r) => r !== ResourceEnum.ALL);
const standardActions = ["read", "create", "update", "delete", "manage"] as const;

function formatResourceName(resource: string): string {
  const overrides: Record<string, string> = {
    user: "User Management",
    role: "Roles & Permissions",
    permission: "System Permissions",
    dashboard: "Dashboard & Analytics",
    announcement: "Announcements & Notices",
    academic: "Academic Management (All)",
    class: "Classes & Cohorts",
    program: "Programs & Curriculum",
    academic_year: "Academic Years & Terms",
    timetable: "Class Timetables",
    attendance: "Attendance (All)",
    student_attendance: "Student Attendance",
    teacher_attendance: "Teacher Attendance",
    leave_request: "Leave Requests & Reports",
    examination: "Examinations & Grading",
    assignment: "Assignments & Homework",
    fee: "Fee & Billing",
    hr: "HR & Payroll",
    library: "Library Management",
    transport: "Transport & Fleets",
    hostel: "Hostel & Dormitories",
    report: "Reports & Audits",
    setting: "System Settings",
  };

  if (overrides[resource]) {
    return overrides[resource];
  }

  return resource
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const RoleForm: FC<RoleFormProps> = ({
  onSubmit,
  onCancel,
  roleToEdit,
  isLoading = false,
  error = null,
}) => {
  const isEdit = Boolean(roleToEdit);

  // Selected permission combinations as "${resource}:${action}" keys
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    if (roleToEdit?.permissions) {
      return roleToEdit.permissions
        .filter((p) => p.resource && p.action)
        .map((p) => `${p.resource}:${p.action}`);
    }
    return [];
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: roleToEdit?.name || "",
      slug: roleToEdit?.slug || "",
      description: roleToEdit?.description || "",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Auto-slugify when typing name on role creation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val, { shouldValidate: true });
    const currentName = nameValue || "";
    const expectedSlug = currentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!isEdit && (!slugValue || slugValue === expectedSlug)) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    const next = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    setSelectedKeys(next);
  };

  const toggleResourceGroup = (resource: string) => {
    const groupKeys = standardActions.map((act) => `${resource}:${act}`);
    const allSelected = groupKeys.every((k) => selectedKeys.includes(k));

    const next = allSelected
      ? selectedKeys.filter((k) => !groupKeys.includes(k))
      : Array.from(new Set([...selectedKeys, ...groupKeys]));

    setSelectedKeys(next);
  };

  const allPossibleKeys = useMemo(() => {
    const keys: string[] = [];
    for (const res of standardResources) {
      for (const act of standardActions) {
        keys.push(`${res}:${act}`);
      }
    }
    return keys;
  }, []);

  const isMasterSelected =
    allPossibleKeys.length > 0 &&
    allPossibleKeys.every((k) => selectedKeys.includes(k));

  const toggleAll = () => {
    const next = isMasterSelected ? [] : allPossibleKeys;
    setSelectedKeys(next);
  };

  const onFormSubmit = (data: RoleFormValues) => {
    const permissions = selectedKeys.map((k) => {
      const [resource, action] = k.split(":");
      return { resource: resource!, action: action! };
    });

    onSubmit({
      ...data,
      permissions,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 font-sans">
      {/* Server Error Alert Banner */}
      {error && (
        <div
          role="alert"
          className="p-3.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-800">Action Failed</p>
            <p className="mt-0.5 text-rose-700">{error.message || "An unexpected error occurred."}</p>
          </div>
        </div>
      )}

      {/* Name and Slug Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="role-name" className="text-xs font-bold text-slate-700">
            Role Name <span className="text-rose-500">*</span>
          </label>
          <Input
            id="role-name"
            placeholder="e.g. Vice Principal, Accountant"
            {...register("name")}
            onChange={handleNameChange}
            className="rounded-xl text-xs"
          />
          {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role-slug" className="text-xs font-bold text-slate-700">
            Role Slug <span className="text-rose-500">*</span>
          </label>
          <Input
            id="role-slug"
            placeholder="e.g. vice-principal, accountant"
            {...register("slug")}
            className="rounded-xl font-mono text-xs"
          />
          {errors.slug && <p className="text-xs text-rose-500">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="role-desc" className="text-xs font-bold text-slate-700">
          Description (Optional)
        </label>
        <Input
          id="role-desc"
          placeholder="Brief description of this role's purpose and duties"
          {...register("description")}
          className="rounded-xl text-xs"
        />
      </div>

      {/* Permissions Matrix Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#45AC5E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Permissions
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6EE] text-[#45AC5E]">
              {selectedKeys.length} of {allPossibleKeys.length} selected
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {isMasterSelected ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#45AC5E]" /> Deselect All
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5 text-slate-400" /> Select All
              </span>
            )}
          </Button>
        </div>

        {/* Permissions Groups Box */}
        <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
          {standardResources.map((resource) => {
            const groupKeys = standardActions.map((act) => `${resource}:${act}`);
            const isGroupAllSelected = groupKeys.every((k) => selectedKeys.includes(k));

            return (
              <div
                key={resource}
                className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleResourceGroup(resource)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#45AC5E] transition-colors cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#45AC5E]" />
                    <span>{formatResourceName(resource)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleResourceGroup(resource)}
                    className="text-[11px] font-medium text-slate-500 hover:text-[#45AC5E] cursor-pointer"
                  >
                    {isGroupAllSelected ? "Clear group" : "Select group"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {standardActions.map((action) => {
                    const key = `${resource}:${action}`;
                    const isSelected = selectedKeys.includes(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePermission(resource, action)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#45AC5E] text-white shadow-xs font-semibold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{action}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#45AC5E] hover:bg-[#3b9652] text-white cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Create Role
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};
