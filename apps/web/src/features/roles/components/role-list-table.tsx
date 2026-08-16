import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  ShieldPlus,
  Shield,
  Edit3,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  FindRolesSchema,
  type RoleDto,
} from "@repo/contracts";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRolesInfiniteQuery } from "../hooks/use-roles-query";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "../hooks/use-role-mutations";
import { RoleFormDialog, type RoleFormValues } from "./role-form-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";

export const RoleListTable: FC = () => {
  const { can } = usePermission();
  const canCreateRole = can("create", "role");
  const canUpdateRole = can("update", "role");
  const canDeleteRole = can("delete", "role");

  const { values, setValue, setValues } = useUrlFilters(FindRolesSchema);
  const { search, sortBy, sortOrder } = values;

  const pageSize = 20;

  // Debounce search input
  const debouncedSearch = useDebounce(search, 800);

  // Build query params from filters
  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize,
    }),
    [debouncedSearch, pageSize, values]
  );

  // Fetch roles via TanStack Query useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useRolesInfiniteQuery(queryParams);

  // Derive flattened array of roles from infinite pages
  const accumulatedRoles = useMemo<RoleDto[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);

  // Filter change handlers
  const handleSearchChange = (searchTerm: string) => {
    setValue("search", searchTerm);
  };

  // Toggle sorting handler
  const handleSort = (field: "id" | "name" | "slug" | "updatedAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  // Mutations
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const deleteMutation = useDeleteRoleMutation();

  const totalCount =
    data?.pages[0]?.pagination?.totalCount ?? accumulatedRoles.length;

  // Infinite Scroll IntersectionObserver hook
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Form submission handler
  const handleFormSubmit = async (formValues: RoleFormValues) => {
    try {
      if (roleToEdit?.id) {
        await updateMutation.mutateAsync({
          id: roleToEdit.id,
          dto: formValues,
        });
        setIsFormDialogOpen(false);
        setRoleToEdit(null);
        return;
      }

      await createMutation.mutateAsync(formValues);
      setIsFormDialogOpen(false);
      setRoleToEdit(null);
    } catch {
      // Error is caught and surfaced through mutation error state in the dialog UI
    }
  };

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (!roleToDelete?.id) return;

    try {
      await deleteMutation.mutateAsync(roleToDelete.id);
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch {
      // Error is surfaced through deleteMutation.error in DeleteRoleDialog
    }
  };

  // Columns definition
  const columns = useMemo<ColumnDef<RoleDto>[]>(
    () => [
      {
        accessorKey: "id",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("id")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto"
          >
            <span>ID</span>
            {sortBy === "id" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-xs font-mono font-medium">
            #{getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto"
          >
            <span>Role Name & Slug</span>
            {sortBy === "name" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const role = row.original;
          const isSystemAdmin = role.slug === "admin" || role.slug === "ADMIN";

          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/20 shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 text-xs">
                    {role.name}
                  </span>
                  {isSystemAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-2.5 h-2.5" /> System
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {role.slug}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 line-clamp-1 max-w-[260px]">
            {getValue<string | null | undefined>() || (
              <span className="italic text-slate-400">No description provided</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Assigned Permissions",
        cell: ({ row }) => {
          const perms = row.original.permissions || [];
          const count = perms.length;

          if (count === 0) {
            return <span className="text-xs text-slate-400 italic">None</span>;
          }

          return (
            <div className="flex items-center gap-1.5 flex-wrap max-w-[320px]">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EBF6EE] text-[#45AC5E] border border-[#45AC5E]/30">
                {count} {count === 1 ? "permission" : "permissions"}
              </span>
              {perms.slice(0, 2).map((p, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {p.resource}:{p.action}
                </span>
              ))}
              {count > 2 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  +{count - 2} more
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("updatedAt")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto"
          >
            <span>Updated At</span>
            {sortBy === "updatedAt" ? (
              sortOrder === "ASC" ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => {
          const val = getValue<Date | string | undefined>();
          if (!val) return <span className="text-slate-400 text-xs">-</span>;
          const d = new Date(val);
          return (
            <span className="text-slate-600 text-xs font-mono">
              {d.toLocaleDateString()}{" "}
              {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const role = row.original;
          const isSystemAdmin = role.slug === "admin" || role.slug === "ADMIN";

          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateMutation.reset();
                  setRoleToEdit(role);
                  setIsFormDialogOpen(true);
                }}
                disabled={!canUpdateRole}
                title={!canUpdateRole ? "You do not have permission to edit roles" : undefined}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Edit ${role.name}`}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit</span>
              </Button>

              {!isSystemAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteMutation.reset();
                    setRoleToDelete(role);
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={!canDeleteRole}
                  title={!canDeleteRole ? "You do not have permission to delete roles" : undefined}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#F05A4A] bg-[#FFF0EE] hover:bg-[#FFE0DC] border border-[#F05A4A]/20 rounded-md transition-colors cursor-pointer h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Delete ${role.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#F05A4A]" />
                  <span>Delete</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdateRole, canDeleteRole]
  );

  const table = useReactTable({
    data: accumulatedRoles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 space-y-6 font-sans">
      {/* Top Controls & Filter Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Left Side: Search Input */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search roles..."
              value={search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E] transition-colors placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-3">
          <Button
            onClick={() => {
              createMutation.reset();
              setRoleToEdit(null);
              setIsFormDialogOpen(true);
            }}
            disabled={!canCreateRole}
            title={!canCreateRole ? "You do not have permission to create roles" : undefined}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#45AC5E] hover:bg-[#389350] rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldPlus className="w-3.5 h-3.5" />
            <span>Add Role</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load roles."}</span>
        </div>
      )}

      {/* Role Data Table rendered via TanStack Table + shadcn primitives */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-800"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-3 px-4 text-slate-800 font-bold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-sm">
            {accumulatedRoles.length === 0 && isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400 text-xs font-medium"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#45AC5E]" />
                    <span>Loading roles...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-400 text-xs font-medium"
                >
                  No roles found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors text-slate-700 font-medium"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel & Bottom Loading Indicator */}
      <div
        ref={sentinelRef}
        className="py-2 text-center text-xs text-slate-400 font-medium"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#45AC5E]" />
            <span>Loading more roles...</span>
          </div>
        ) : !hasNextPage && accumulatedRoles.length > 0 ? (
          <span>All {totalCount} roles loaded</span>
        ) : null}
      </div>

      {/* Role Form Dialog (Create & Edit) */}
      <RoleFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setRoleToEdit(null);
          createMutation.reset();
          updateMutation.reset();
        }}
        onSubmit={handleFormSubmit}
        roleToEdit={roleToEdit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={roleToEdit ? updateMutation.error : createMutation.error}
      />

      {/* Delete Role Dialog */}
      <DeleteRoleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setRoleToDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={handleDeleteConfirm}
        roleToDelete={roleToDelete}
        isLoading={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </div>
  );
};
