import { type FC, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateRoleSchema,
  PERMISSION_GROUPS,
  type CreateRoleDto,
  type RoleDto,
} from "@repo/contracts";
import {
  AlertCircle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
  Shield,
  Sparkles,
  Square,
  X,
} from "lucide-react";

export type RoleFormValues = CreateRoleDto;

interface RoleFormProps {
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  onCancel: () => void;
  roleToEdit?: RoleDto | null;
  isLoading?: boolean;
  error?: Error | null;
}

export const RoleForm: FC<RoleFormProps> = ({
  onSubmit,
  onCancel,
  roleToEdit,
  isLoading = false,
  error = null,
}) => {
  const isEdit = Boolean(roleToEdit);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected permission combinations as "${resource}:${action}" keys
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    if (roleToEdit?.permissions) {
      return roleToEdit.permissions
        .filter((p) => p.resource && p.action)
        .map((p) => `${p.resource}:${p.action}`);
    }
    return [];
  });

  // Track expanded state for each group (default: all expanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of PERMISSION_GROUPS) {
      init[g.key] = true;
    }
    return init;
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

  // Toggle single action on a resource
  const togglePermission = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    const next = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    setSelectedKeys(next);
  };

  // Toggle all actions for a specific child resource
  const toggleResourceAll = (resource: string, actions: string[]) => {
    const resourceKeys = actions.map((act) => `${resource}:${act}`);
    const allSelected = resourceKeys.every((k) => selectedKeys.includes(k));

    const next = allSelected
      ? selectedKeys.filter((k) => !resourceKeys.includes(k))
      : Array.from(new Set([...selectedKeys, ...resourceKeys]));

    setSelectedKeys(next);
  };

  // Toggle all permissions for an entire group
  const toggleGroupAll = (groupKey: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.key === groupKey);
    if (!group) return;

    const groupKeys: string[] = [];
    if (group.groupResource) {
      groupKeys.push(`${group.groupResource}:manage`);
    }
    for (const child of group.children) {
      for (const act of child.actions) {
        groupKeys.push(`${child.resource}:${act}`);
      }
    }

    const allSelected = groupKeys.every((k) => selectedKeys.includes(k));

    const next = allSelected
      ? selectedKeys.filter((k) => !groupKeys.includes(k))
      : Array.from(new Set([...selectedKeys, ...groupKeys]));

    setSelectedKeys(next);
  };

  // All possible permission keys
  const allPossibleKeys = useMemo(() => {
    const keys: string[] = [];
    for (const group of PERMISSION_GROUPS) {
      if (group.groupResource) {
        keys.push(`${group.groupResource}:manage`);
      }
      for (const child of group.children) {
        for (const act of child.actions) {
          keys.push(`${child.resource}:${act}`);
        }
      }
    }
    return Array.from(new Set(keys));
  }, []);

  const isMasterSelected =
    allPossibleKeys.length > 0 &&
    allPossibleKeys.every((k) => selectedKeys.includes(k));

  const toggleAll = () => {
    const next = isMasterSelected ? [] : allPossibleKeys;
    setSelectedKeys(next);
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = Object.values(expandedGroups).every(Boolean);
    const next: Record<string, boolean> = {};
    for (const g of PERMISSION_GROUPS) {
      next[g.key] = !allExpanded;
    }
    setExpandedGroups(next);
  };

  // Filter groups and children by search term
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_GROUPS;

    const q = searchQuery.toLowerCase();
    return PERMISSION_GROUPS.map((group) => {
      const groupMatches =
        group.title.toLowerCase().includes(q) ||
        (group.description && group.description.toLowerCase().includes(q));

      const filteredChildren = group.children.filter(
        (child) =>
          groupMatches ||
          child.title.toLowerCase().includes(q) ||
          child.resource.toLowerCase().includes(q) ||
          (child.description && child.description.toLowerCase().includes(q)) ||
          child.actions.some((act) => act.toLowerCase().includes(q))
      );

      return {
        ...group,
        children: filteredChildren,
      };
    }).filter((group) => group.children.length > 0);
  }, [searchQuery]);

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

      {/* Permissions Matrix Section */}
      <div className="space-y-3 pt-2">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#45AC5E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned Permissions
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6EE] text-[#45AC5E]">
              {selectedKeys.length} of {allPossibleKeys.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleExpandAll}
              className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {Object.values(expandedGroups).every(Boolean) ? (
                <span className="inline-flex items-center gap-1">
                  <ChevronsDownUp className="w-3.5 h-3.5" /> Collapse All
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <ChevronsUpDown className="w-3.5 h-3.5" /> Expand All
                </span>
              )}
            </Button>

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
        </div>

        {/* Quick Search Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search permissions or modules (e.g. attendance, invoice, student)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 pr-8 rounded-xl text-xs h-8.5 bg-white border-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Permissions Accordion Group Cards */}
        <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No permissions found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = Boolean(expandedGroups[group.key]);

              // Calculate group selection statistics
              const groupKeys: string[] = [];
              if (group.groupResource) {
                groupKeys.push(`${group.groupResource}:manage`);
              }
              for (const child of group.children) {
                for (const act of child.actions) {
                  groupKeys.push(`${child.resource}:${act}`);
                }
              }

              const selectedCount = groupKeys.filter((k) =>
                selectedKeys.includes(k)
              ).length;
              const isGroupAllSelected =
                groupKeys.length > 0 && selectedCount === groupKeys.length;
              const isGroupPartiallySelected =
                selectedCount > 0 && selectedCount < groupKeys.length;

              return (
                <div
                  key={group.key}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                >
                  {/* Module Group Card Header */}
                  <div className="flex items-center justify-between p-3 bg-white border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleGroupExpand(group.key)}
                      className="flex items-center gap-2 text-left cursor-pointer flex-1"
                    >
                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {group.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedCount > 0
                                ? "bg-[#EBF6EE] text-[#45AC5E]"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {selectedCount} of {groupKeys.length}
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 pl-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupAll(group.key)}
                        className="h-6.5 px-2 text-[11px] font-medium text-slate-600 hover:text-[#45AC5E] cursor-pointer"
                      >
                        {isGroupAllSelected ? (
                          <span className="inline-flex items-center gap-1 text-[#45AC5E] font-semibold">
                            <CheckSquare className="w-3 h-3" /> Clear module
                          </span>
                        ) : isGroupPartiallySelected ? (
                          <span className="inline-flex items-center gap-1 text-[#45AC5E]">
                            <CheckSquare className="w-3 h-3" /> Select all
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Square className="w-3 h-3 text-slate-400" /> Select all
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Child Resources Rows */}
                  {isExpanded && (
                    <div className="p-3 space-y-2.5 bg-slate-50/30">
                      {group.children.map((child) => {
                        const childKeys = child.actions.map(
                          (act) => `${child.resource}:${act}`
                        );
                        const isChildAllSelected = childKeys.every((k) =>
                          selectedKeys.includes(k)
                        );

                        return (
                          <div
                            key={child.resource}
                            className="p-2.5 rounded-lg border border-slate-200/80 bg-white space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleResourceAll(child.resource, child.actions)
                                }
                                className="text-left cursor-pointer group/title"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#45AC5E]" />
                                  <span className="text-xs font-semibold text-slate-800 group-hover/title:text-[#45AC5E] transition-colors">
                                    {child.title}
                                  </span>
                                </div>
                                {child.description && (
                                  <p className="text-[10px] text-slate-400 pl-3">
                                    {child.description}
                                  </p>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleResourceAll(child.resource, child.actions)
                                }
                                className="text-[10px] font-medium text-slate-400 hover:text-[#45AC5E] cursor-pointer"
                              >
                                {isChildAllSelected ? "Clear" : "All"}
                              </button>
                            </div>

                            {/* Action Badges */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {child.actions.map((action) => {
                                const key = `${child.resource}:${action}`;
                                const isSelected = selectedKeys.includes(key);

                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() =>
                                      togglePermission(child.resource, action)
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-[#45AC5E] text-white shadow-xs font-semibold"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                    )}
                                    <span>{action}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
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

