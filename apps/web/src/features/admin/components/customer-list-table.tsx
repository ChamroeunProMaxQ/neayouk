import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type FilterFn,
} from "@tanstack/react-table";
import { Search, Upload, ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export interface CustomerUser {
  id: string;
  code: string;
  name: string;
  gender: string;
  username: string;
  phone: string;
  photoUrl?: string;
}

const initialCustomers: CustomerUser[] = [
  { id: "1", code: "N/A", name: "Kim", gender: "Unisex", username: "085823292", phone: "N/A" },
  { id: "2", code: "N/A", name: "Sopheavattey Chhon", gender: "Unisex", username: "088720069", phone: "N/A" },
  { id: "3", code: "N/A", name: "Sophia Martin Uy", gender: "Unisex", username: "087973907", phone: "N/A" },
  { id: "4", code: "N/A", name: "So Moly", gender: "Unisex", username: "017721247", phone: "N/A" },
  { id: "5", code: "N/A", name: "Chonroth", gender: "Unisex", username: "086827561", phone: "N/A" },
  { id: "6", code: "C0000336", name: "Ladli Seng", gender: "Unisex", username: "0966665775", phone: "0966665775" },
  { id: "7", code: "N/A", name: "Kiman Sreypich", gender: "Unisex", username: "010263737", phone: "N/A" },
  { id: "8", code: "N/A", name: "Sreng Leaphea", gender: "Unisex", username: "061758668", phone: "N/A" },
  { id: "9", code: "N/A", name: "Koy Chyma", gender: "Unisex", username: "095989027", phone: "N/A" },
  { id: "10", code: "N/A", name: "Chhav Vakhim", gender: "Unisex", username: "010350699", phone: "N/A" },
];

interface CustomerListTableProps {
  onUploadBulkUsers?: () => void;
  onEditUser?: (user: CustomerUser) => void;
  onDeleteUser?: (user: CustomerUser) => void;
}

const customGlobalFilter: FilterFn<CustomerUser> = (row, _columnId, filterValue: string) => {
  if (!filterValue) return true;
  const q = filterValue.toLowerCase();
  const user = row.original;
  return (
    user.name.toLowerCase().includes(q) ||
    user.username.toLowerCase().includes(q) ||
    user.code.toLowerCase().includes(q) ||
    user.phone.toLowerCase().includes(q)
  );
};

export const CustomerListTable: React.FC<CustomerListTableProps> = ({
  onUploadBulkUsers,
  onEditUser,
  onDeleteUser,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [customers, setCustomers] = useState<CustomerUser[]>(initialCustomers);
  const totalCount = 33272;

  const handleDelete = (user: CustomerUser) => {
    setCustomers((prev) => prev.filter((c) => c.id !== user.id));
    onDeleteUser?.(user);
  };

  const columns = useMemo<ColumnDef<CustomerUser>[]>(
    () => [
      {
        id: "photo",
        header: "Photo",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500 font-semibold text-xs border border-slate-300">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>0</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-xs font-mono">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="text-slate-900 font-semibold text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ getValue }) => (
          <span className="text-slate-700 text-xs font-mono">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone Number",
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-xs font-mono">{getValue<string>()}</span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onEditUser?.(user)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
                aria-label={`Edit ${user.name}`}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDelete(user)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#F05A4A] bg-[#FFF0EE] hover:bg-[#FFE0DC] border border-[#F05A4A]/20 rounded-md transition-colors cursor-pointer"
                aria-label={`Delete ${user.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-[#F05A4A]" />
                <span>Delete</span>
              </button>
            </div>
          );
        },
      },
    ],
    [onEditUser, onDeleteUser]
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: customGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 space-y-6 font-sans">
      {/* Top Toolbar: Search Input + Bulk Upload & Pagination */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F05A4A]/20 focus:border-[#F05A4A] transition-colors placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <button
            onClick={onUploadBulkUsers}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#F05A4A] bg-[#FFF0EE] border border-[#F05A4A]/30 rounded-lg hover:bg-[#FFE0DC] transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Bulk Users</span>
          </button>

          {/* Pagination Counter & Navigation Buttons */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <span>
              1-10 of {totalCount.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Data Table rendered via TanStack Table + shadcn primitives */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-800">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-slate-800 font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-sm">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-slate-400 text-xs font-medium">
                  No customers found matching "{globalFilter}"
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
