import React, { useState, useMemo } from "react";
import { Search, Upload, ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react";

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

export const CustomerListTable: React.FC<CustomerListTableProps> = ({
  onUploadBulkUsers,
  onEditUser,
  onDeleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerUser[]>(initialCustomers);
  const [currentPage, setCurrentPage] = useState(1);
  const totalCount = 33272;

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleDelete = (user: CustomerUser) => {
    setCustomers((prev) => prev.filter((c) => c.id !== user.id));
    onDeleteUser?.(user);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 space-y-6 font-sans">
      {/* Top Toolbar: Search Input + Bulk Upload & Pagination */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-800">
              <th className="py-3 px-4">Photo</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                  No customers found matching "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredCustomers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors text-slate-700 font-medium"
                >
                  {/* Photo Column */}
                  <td className="py-3.5 px-4">
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
                  </td>

                  {/* Code */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">{user.code}</td>

                  {/* Name */}
                  <td className="py-3.5 px-4 text-slate-900 font-semibold text-xs">{user.name}</td>

                  {/* Gender */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{user.gender}</td>

                  {/* Username */}
                  <td className="py-3.5 px-4 text-slate-700 text-xs font-mono">{user.username}</td>

                  {/* Phone Number */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">{user.phone}</td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
