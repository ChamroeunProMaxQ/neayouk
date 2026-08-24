import { useState } from "react";
import { useClassesQuery } from "@/features/classes/hooks/use-classes-infinite-query";
import { useGradebookMatrixQuery, StudentReportCardModal } from "@/features/examinations";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { FileText, Loader2, Calendar as CalendarIcon, GraduationCap } from "lucide-react";

export function ReportCardsPage() {
  const { data: classesData } = useClassesQuery({
    pageSize: 100,
    status: "ACTIVE",
  });
  const classesList = classesData?.data ?? [];

  const today = new Date();
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    classesList[0]?.id
  );
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const { data: matrixData, isLoading } = useGradebookMatrixQuery(
    selectedClassId || classesList[0]?.id,
    monthStr
  );

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const currentClassId = selectedClassId || classesList[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Student Progress Report Cards
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate, preview, and print official monthly report cards and transcripts for students.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[#45AC5E]" />
          <select
            value={currentClassId ?? ""}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20"
          >
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#45AC5E]" />
          <input
            type="month"
            value={monthStr}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-");
              if (y && m) {
                setSelectedYear(Number(y));
                setSelectedMonth(Number(m));
              }
            }}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#45AC5E]/20"
          />
        </div>
      </div>

      {/* Roster of Students */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#45AC5E]" />
          </div>
        ) : !matrixData || matrixData.rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No student records found for this class and month.
          </div>
        ) : (
          <Table className="w-full text-left text-sm">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-12 text-center text-xs font-bold text-slate-600">#</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Student Name</TableHead>
                <TableHead className="w-32 text-xs font-bold text-slate-700">Student Code</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold text-slate-700">Gender</TableHead>
                <TableHead className="w-28 text-center text-xs font-bold text-[#45AC5E]">Score %</TableHead>
                <TableHead className="w-20 text-center text-xs font-bold text-slate-700">Grade</TableHead>
                <TableHead className="w-20 text-center text-xs font-bold text-amber-600">Rank</TableHead>
                <TableHead className="w-36 text-center text-xs font-bold text-slate-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {matrixData.rows.map((row, idx) => (
                <TableRow key={row.studentId} className="hover:bg-slate-50/50">
                  <TableCell className="text-center text-xs text-slate-400">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {row.lastName} {row.firstName}
                      </span>
                      {row.firstNameKm && (
                        <span className="font-khmer text-xs text-slate-500">
                          {row.lastNameKm} {row.firstNameKm}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {row.studentCode || `STU-${row.studentId}`}
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-600">{row.gender}</TableCell>
                  <TableCell className="text-center font-bold text-[#45AC5E]">
                    {row.totalWeightedScore.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-800">
                      {row.gradeLetter}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-amber-600">
                    #{row.rank ?? "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudentId(row.studentId)}
                      className="gap-1.5 text-xs font-semibold text-[#45AC5E] hover:bg-[#45AC5E]/10"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedStudentId !== null && (
        <StudentReportCardModal
          isOpen={selectedStudentId !== null}
          onClose={() => setSelectedStudentId(null)}
          studentId={selectedStudentId}
          month={monthStr}
          classId={currentClassId}
        />
      )}
    </div>
  );
}
