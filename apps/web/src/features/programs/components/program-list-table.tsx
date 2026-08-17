import { useState } from "react";
import { Link } from "react-router-dom";
import {
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
import { useProgramsQuery } from "../hooks/use-programs-query";
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
} from "lucide-react";

export function ProgramListTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramAttribute | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<ProgramAttribute | null>(null);

  const { data, isLoading, isError, refetch } = useProgramsQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
  });

  const programs = data?.programs ?? [];

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

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search program, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#45AC5E]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleCreate}
          className="bg-[#45AC5E] hover:bg-[#3d9852] text-white shadow-sm h-9 px-4 text-sm font-medium gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[240px] font-semibold text-slate-700 text-xs">
                Program & Code
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-xs">
                Curriculum Books
              </TableHead>
              <TableHead className="w-[180px] font-semibold text-slate-700 text-xs">
                Levels
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-xs text-center">
                Classes
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-xs text-center">
                Status
              </TableHead>
              <TableHead className="w-[100px] font-semibold text-slate-700 text-xs text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#45AC5E] border-t-transparent" />
                    <span className="text-xs">Loading programs from database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-rose-500">
                    <span className="text-sm font-medium">Failed to load academic programs</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="text-xs"
                    >
                      Try Again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
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
                      className="mt-2 bg-[#45AC5E] hover:bg-[#3d9852] text-white text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add First Program
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              programs.map((prog) => {
                const booksList: string[] = Array.isArray(prog.books) ? prog.books : [];
                const levels: string[] = Array.isArray(prog.gradeLevels)
                  ? prog.gradeLevels
                  : [];
                const classCount = prog.classCount ?? 0;

                return (
                  <TableRow key={prog.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Program & Code */}
                    <TableCell className="py-3.5">
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
                    </TableCell>

                    {/* Books */}
                    <TableCell className="py-3.5">
                      {booksList.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No books configured</span>
                      ) : (
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
                      )}
                    </TableCell>

                    {/* Grade Levels */}
                    <TableCell className="py-3.5">
                      {levels.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No levels</span>
                      ) : (
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
                      )}
                    </TableCell>

                    {/* Classes Count */}
                    <TableCell className="text-center py-3.5">
                      <Link
                        to={`/academics/classes?program=${encodeURIComponent(prog.name)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#45AC5E] border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        title="View classes in this program"
                      >
                        <GraduationCap className="h-3 w-3" />
                        <span>{classCount}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                      </Link>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center py-3.5">
                      {prog.status === "ACTIVE" ? (
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
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-3.5 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(prog)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-[#45AC5E] hover:bg-emerald-50"
                          title="Edit Program"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(prog)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Program"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
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
}
