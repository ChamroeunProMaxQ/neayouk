import { useState, useMemo, type FC } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  FindBranchesSchema,
  BranchStatusEnum,
  type BranchDto,
  type CreateBranchWithAdminDto,
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
import { useBranchesQuery } from "../hooks/use-branches-query";
import { useCreateBranchWithAdminMutation } from "../hooks/use-branch-mutations";
import { CreateBranchDialog } from "./create-branch-dialog";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";

export const BranchListTable: FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { values, setValue } = useUrlFilters(FindBranchesSchema);
  const { search, status } = values;

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError, error } = useBranchesQuery({
    search: debouncedSearch,
    status,
  });

  const createMutation = useCreateBranchWithAdminMutation();

  const handleCreateSubmit = async (formData: CreateBranchWithAdminDto) => {
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
  };

  const branches = useMemo(() => data?.data || [], [data]);

  const columns = useMemo<ColumnDef<BranchDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
              {row.original.code}
            </span>
            {row.original.isDefault && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Branch / School Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{row.original.name}</div>
              {row.original.address && (
                <div className="text-xs text-slate-400">{row.original.address}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-1 text-xs text-slate-600">
            {row.original.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{row.original.phone}</span>
              </div>
            )}
            {row.original.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{row.original.email}</span>
              </div>
            )}
            {!row.original.phone && !row.original.email && (
              <span className="text-slate-400 italic">No contact info</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.status === BranchStatusEnum.ACTIVE;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {row.original.status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: branches,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search || ""}
              onChange={(e) => setValue("search", e.target.value)}
              placeholder="Search branch name or code..."
              className="pl-9 bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status || ""}
            onChange={(e) =>
              setValue(
                "status",
                e.target.value ? (e.target.value as BranchStatusEnum) : undefined
              )
            }
            aria-label="Filter branches by status"
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Statuses</option>
            <option value={BranchStatusEnum.ACTIVE}>Active</option>
            <option value={BranchStatusEnum.INACTIVE}>Inactive</option>
          </select>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#45AC5E] hover:bg-[#3d9a53] text-white flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Branch</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Loading branches...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-rose-500">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">Failed to load branches</p>
            <p className="text-xs text-slate-500">{error?.message}</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Building2 className="w-12 h-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No branches found</p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              No branches match your filter criteria. Click "Provision Branch" to create a new one.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold text-slate-600">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Provision Dialog */}
      <CreateBranchDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};
