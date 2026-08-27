import { useState, useMemo, type FC } from "react";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FindProgramsSchema,
  ProgramStatusEnum,
  type ProgramAttribute,
} from "@repo/contracts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProgramsInfiniteQuery } from "../hooks/use-programs-query";
import { ProgramFormDialog } from "./program-form-dialog";
import { DeleteProgramDialog } from "./delete-program-dialog";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useInfiniteScroll } from "@/hooks/use-intersection-observer";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/features/auth";

export const ProgramListTable: FC = () => {
  const { can } = usePermission();
  const canCreateProgram = can("create", "academic") || can("manage", "academic");
  const canUpdateProgram = can("update", "academic") || can("manage", "academic");
  const canDeleteProgram = can("delete", "academic") || can("manage", "academic");

  // 1. URL Filters & Debounced Search
  const { values, setValue, setValues } = useUrlFilters(FindProgramsSchema);
  const { search, status, sortBy = "id", sortOrder = "DESC" } = values;

  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 800);

  const queryParams = useMemo(
    () => ({
      ...values,
      search: debouncedSearch,
      pageSize,
    }),
    [debouncedSearch, pageSize, values]
  );

  // 2. Fetch programs via TanStack Query useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useProgramsInfiniteQuery(queryParams);

  // 3. Derive flattened array of programs
  const accumulatedPrograms = useMemo<ProgramAttribute[]>(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const totalCount =
    data?.pages[0]?.pagination?.totalCount ?? accumulatedPrograms.length;

  // 4. Infinite Scroll Sentinel
  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(hasNextPage),
    isLoading,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramAttribute | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramAttribute | null>(null);

  const handleEdit = (program: ProgramAttribute) => {
    setSelectedProgram(program);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedProgram(null);
    setFormOpen(true);
  };

  const handleDelete = (program: ProgramAttribute) => {
    setProgramToDelete(program);
    setDeleteOpen(true);
  };

  const handleSort = (field: "id" | "name" | "code" | "status" | "updatedAt") => {
    const nextOrder = sortBy === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setValues({
      sortBy: field,
      sortOrder: nextOrder,
    });
  };

  const columns = useMemo<ColumnDef<ProgramAttribute>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort("name")}
            className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
          >
            <span>Program & Code</span>
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
          const prog = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#45AC5E] font-bold text-xs border border-emerald-100 shrink-0">
                {prog.code.slice(0, 3)}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  {prog.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Code: <span className="text-slate-600 font-semibold">{prog.code}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "books",
        header: () => <span className="text-xs font-bold text-slate-700">Curriculum Books</span>,
        cell: ({ row }) => {
          const prog = row.original;
          const booksList: string[] = Array.isArray(prog.books) ? prog.books : [];
          if (booksList.length === 0) {
            return <span className="text-xs text-slate-400 italic">No books configured</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {booksList.map((b) => (
                <Badge
                  key={b}
                  variant="secondary"
                  className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-800 border-blue-200 font-medium"
                >
                  {b}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "gradeLevels",
        header: () => <span className="text-xs font-bold text-slate-700">Levels</span>,
        cell: ({ row }) => {
          const prog = row.original;
          const levels: string[] = Array.isArray(prog.gradeLevels) ? prog.gradeLevels : [];
          if (levels.length === 0) {
            return <span className="text-xs text-slate-400 italic">No levels</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {levels.slice(0, 6).map((lvl) => (
                <Badge
                  key={lvl}
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-700 border-slate-200 font-normal"
                >
                  {lvl}
                </Badge>
              ))}
              {levels.length > 6 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0.5 text-slate-500 border-slate-300 font-medium"
                >
                  +{levels.length - 6}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "classCount",
        header: () => <div className="text-center text-xs font-bold text-slate-700">Classes</div>,
        cell: ({ row }) => {
          const prog = row.original;
          const classCount = prog.classCount ?? 0;
          return (
            <div className="text-center">
              <Link
                to={`/academics/classes?program=${encodeURIComponent(prog.name)}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#45AC5E] border border-emerald-100 hover:bg-emerald-100 transition-colors"
                title="View classes in this program"
              >
                <GraduationCap className="h-3 w-3" />
                <span>{classCount}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort("status")}
              className="inline-flex items-center gap-1 hover:text-[#45AC5E] transition-colors font-bold cursor-pointer p-0 h-auto text-xs"
            >
              <span>Status</span>
              {sortBy === "status" ? (
                sortOrder === "ASC" ? (
                  <ArrowUp className="w-3.5 h-3.5 text-[#45AC5E]" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-[#45AC5E]" />
                )
              ) : (
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </Button>
          </div>
        ),
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return (
            <div className="text-center">
              {s === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  <XCircle className="h-3 w-3 text-slate-400" />
                  Inactive
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right text-xs font-bold text-slate-700 pr-4">Actions</div>,
        cell: ({ row }) => {
          const prog = row.original;
          return (
            <div className="flex items-center justify-end gap-1 pr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(prog)}
                disabled={!canUpdateProgram}
                title={!canUpdateProgram ? "You do not have permission to edit programs" : "Edit Program"}
                className="h-8 w-8 p-0 text-slate-500 hover:text-[#45AC5E] hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(prog)}
                disabled={!canDeleteProgram}
                title={!canDeleteProgram ? "You do not have permission to delete programs" : "Delete Program"}
                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, canUpdateProgram, canDeleteProgram]
  );

  const table = useReactTable({
    data: accumulatedPrograms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search program, code..."
              value={search ?? ""}
              onChange={(e) => setValue("search", e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status ?? ""}
            onChange={(e) => setValue("status", (e.target.value as "ACTIVE" | "INACTIVE") || undefined)}
            aria-label="Filter by Status"
            className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="">All Statuses</option>
            <option value={ProgramStatusEnum.enum.ACTIVE}>Active Only</option>
            <option value={ProgramStatusEnum.enum.INACTIVE}>Inactive Only</option>
          </select>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleCreate}
          disabled={!canCreateProgram}
          title={!canCreateProgram ? "You do not have permission to create programs" : undefined}
          className="bg-[#45AC5E] hover:bg-[#3d9852] text-white shadow-sm h-9 px-4 text-sm font-medium gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error?.message || "Failed to load academic programs."}</span>
        </div>
      )}

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-xs font-bold text-slate-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading && accumulatedPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-[#45AC5E]" />
                    <span className="text-xs">Loading programs from database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : accumulatedPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Layers className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                    <span className="text-sm font-medium text-slate-600">
                      No academic programs found
                    </span>
                    <span className="text-xs text-slate-400 max-w-sm">
                      Create your first program category to configure books and grade levels dynamically.
                    </span>
                    <Button
                      onClick={handleCreate}
                      size="sm"
                      className="mt-2 bg-[#45AC5E] hover:bg-[#3d9852] text-white text-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add First Program
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Sentinel / Bottom status */}
      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#45AC5E]" />
            <span>Loading more programs...</span>
          </div>
        ) : !hasNextPage && accumulatedPrograms.length > 0 ? (
          <span>All {totalCount} programs loaded</span>
        ) : null}
      </div>

      {/* Dialogs */}
      <ProgramFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        program={selectedProgram}
      />

      <DeleteProgramDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        program={programToDelete}
      />
    </div>
  );
};

