import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  UserPlus,
  Edit3,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  FindUsersSchema,
  UserStatusEnum,
  UserTypeEnum,
  type UserAttribute,
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
import { useUsersInfiniteQuery } from "../hooks/use-users-query";
import { useBranchesQuery } from "@/features/branches/hooks/use-branches-query";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../hooks/use-user-mutations";
import { UserFormDialog, type UserFormValues } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";

export const UserListTable: FC = () => {
  const { can, isSuperAdmin } = usePermission();
  const canCreateUser = can("create", "user");
  const canUpdateUser = can("update", "user");
  const canDeleteUser = can("delete", "user");

  const { values, setValue, setValues } = useUrlFilters(FindUsersSchema);
  const { search, userType, branchId, sortBy, sortOrder } = values;

  const { data: branchesData } = useBranchesQuery();
  const branches = useMemo(() => branchesData?.data ?? [], [branchesData]);

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

  // Fetch users via TanStack Query useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useUsersInfiniteQuery(queryParams);

  // Derive flattened array of users from infinite pages
  const accumulatedUsers = useMemo<UserAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserAttribute | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAttribute | null>(null);

  // Filter change handlers
  const handleUserTypeChange = (selectedUserType: UserTypeEnum) => {
    setValue("userType", selectedUserType);
  };

  const handleSearchChange = (searchTerm: string) => {
    setValue("search", searchTerm);
  };

  // Toggle sorting handler
  const handleSort = (field: "username" | "updatedAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  // Mutations
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const totalCount =
    data?.pages[0]?.pagination?.totalCount ?? accumulatedUsers.length;

  // Infinite Scroll IntersectionObserver hook
  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Form submission handler
  const handleFormSubmit = async (formValues: UserFormValues) => {
    if (userToEdit) {
      await updateMutation.mutateAsync({
        id: userToEdit.id,
        dto: {
          username: formValues.username,
          userType: formValues.userType,
          status: formValues.status,
          branchId: formValues.branchId !== undefined ? formValues.branchId : undefined,
          roles: formValues.roles,
          ...(formValues.password ? { password: formValues.password } : {}),
        },
      });
      setIsFormDialogOpen(false);
      setUserToEdit(null);
      return;
    }

    if (!formValues.username) return;

    await createMutation.mutateAsync({
      username: formValues.username,
      password: formValues.password || "password123",
      userType: formValues.userType,
      status: formValues.status,
      branchId: formValues.branchId !== undefined ? formValues.branchId : undefined,
      roles: formValues.roles,
    });
    setIsFormDialogOpen(false);
    setUserToEdit(null);
  };

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    await deleteMutation.mutateAsync(userToDelete.id);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Columns definition
  const columns = useMemo<ColumnDef<UserAttribute>[]>(
    () => [
      {
        id: "photo",
        header: "Avatar",
        cell: ({ row }) => {
          const user = row.original;
          const initial = user.username.charAt(0).toUpperCase();
          return (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[#45AC5E] font-bold text-xs border border-slate-200">
              <span>{initial || "U"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "computedNameId",
        header: "User ID",
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-xs font-mono font-medium">
            {getValue<string>() || "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "username",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("username")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto"
          >
            <span>Username</span>
            {sortBy === "username" ? (
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
          <span className="text-slate-900 font-semibold text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "branch",
        header: "Branch / Campus",
        cell: ({ row }) => {
          const user = row.original;
          const branch = user.branch;
          if (!branch) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Global / All Campuses
              </span>
            );
          }

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-900 font-semibold text-xs inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {branch.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Code: {branch.code}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "userType",
        header: "User Type",
        cell: ({ getValue }) => {
          const role = getValue<UserTypeEnum>();
          let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
          if (role === UserTypeEnum.ADMIN) {
            badgeStyle = "bg-[#EBF6EE] text-[#45AC5E] border-[#45AC5E]/30";
          } else if (role === UserTypeEnum.CMS) {
            badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
          }

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyle}`}
            >
              {role || "CUSTOMER"}
            </span>
          );
        },
      },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => {
          const user = row.original;
          const roles = user.roles ?? [];
          if (!roles || roles.length === 0) {
            return <span className="text-[11px] text-slate-400 italic">None</span>;
          }

          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {roles.map((r) => {
                const slug = typeof r === "string" ? r : r.slug;
                const name = typeof r === "string" ? r : r.name;
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#45AC5E] border border-[#45AC5E]/30"
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const user = row.original;
          const isDeleted = Boolean(user.deletedAt);

          if (isDeleted) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Deleted
              </span>
            );
          }

          const status = user.status;
          const isActive = status === UserStatusEnum.ACTIVE;

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {status || "ACTIVE"}
            </span>
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
          const user = row.original;
          const isDeleted = Boolean(user.deletedAt);

          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserToEdit(user);
                  setIsFormDialogOpen(true);
                }}
                disabled={!canUpdateUser}
                title={!canUpdateUser ? "You do not have permission to edit users" : undefined}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Edit ${user.username}`}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit</span>
              </Button>

              {!isDeleted && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setUserToDelete(user);
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={!canDeleteUser}
                  title={!canDeleteUser ? "You do not have permission to delete users" : undefined}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#F05A4A] bg-[#FFF0EE] hover:bg-[#FFE0DC] border border-[#F05A4A]/20 rounded-md transition-colors cursor-pointer h-auto disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Delete ${user.username}`}
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
    [sortBy, sortOrder, canUpdateUser, canDeleteUser]
  );

  const table = useReactTable({
    data: accumulatedUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 space-y-6 font-sans">
      {/* Top Controls & Filter Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Left Side: Search & Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input using shadcn Input primitive */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Input
              type="text"
              placeholder="Search user name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E] transition-colors placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* User Role Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="role-filter"
              className="text-xs font-bold text-slate-600 uppercase tracking-wide"
            >
              Role:
            </label>
            <select
              id="role-filter"
              aria-label="Filter by User Role"
              value={userType}
              onChange={(e) =>
                handleUserTypeChange(e.target.value as UserTypeEnum)
              }
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E] text-slate-700"
            >
              <option value="">All Roles</option>
              <option value={UserTypeEnum.ADMIN}>Admin</option>
              <option value={UserTypeEnum.CMS}>CMS Editor</option>
              <option value={UserTypeEnum.CUSTOMER}>Customer</option>
            </select>
          </div>

          {/* Branch / Campus Filter (SuperAdmin Only) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="branch-filter"
                className="text-xs font-bold text-slate-600 uppercase tracking-wide"
              >
                Branch:
              </label>
              <select
                id="branch-filter"
                aria-label="Filter by Branch"
                value={branchId ?? ""}
                onChange={(e) =>
                  setValue("branchId", e.target.value ? Number(e.target.value) : undefined)
                }
                className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20 focus:border-[#45AC5E] text-slate-700"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center justify-between xl:justify-end gap-3">
          {/* Add User Button with disabled state if !canCreateUser */}
          <Button
            onClick={() => {
              setUserToEdit(null);
              setIsFormDialogOpen(true);
            }}
            disabled={!canCreateUser}
            title={!canCreateUser ? "You do not have permission to create users" : undefined}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#45AC5E] hover:bg-[#389350] rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load users."}</span>
        </div>
      )}

      {/* User Data Table rendered via TanStack Table + shadcn primitives */}
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
            {accumulatedUsers.length === 0 && isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400 text-xs font-medium"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#45AC5E]" />
                    <span>Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-400 text-xs font-medium"
                >
                  No users found matching your filter criteria.
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
            <span>Loading more users...</span>
          </div>
        ) : !hasNextPage && accumulatedUsers.length > 0 ? (
          <span>All {totalCount} users loaded</span>
        ) : null}
      </div>

      {/* User Form Dialog (Create & Edit) */}
      <UserFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setUserToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        userToEdit={userToEdit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
          deleteMutation.reset();
        }}
        onConfirm={handleDeleteConfirm}
        userToDelete={userToDelete}
        isLoading={deleteMutation.isPending}
        error={deleteMutation.error}
      />
    </div>
  );
};
