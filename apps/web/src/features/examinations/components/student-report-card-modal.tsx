import { type FC, useRef } from "react";
import { useStudentReportCardQuery } from "../hooks/use-student-report-card-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Award } from "lucide-react";

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: number;
  month?: string;
  classId?: number;
}

export const StudentReportCardModal: FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  studentId,
  month,
  classId,
}) => {
  const { data: report, isLoading } = useStudentReportCardQuery(
    studentId,
    month,
    classId
  );

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-emerald-500 text-white";
      case "B":
        return "bg-blue-500 text-white";
      case "C":
        return "bg-indigo-500 text-white";
      case "D":
        return "bg-amber-500 text-white";
      case "E":
        return "bg-orange-500 text-white";
      default:
        return "bg-rose-500 text-white";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#45AC5E]" />
            <DialogTitle className="text-lg font-bold text-slate-900">
              Student Monthly Progress Report
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !report}
              className="gap-1.5 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#45AC5E]" />
          </div>
        ) : !report ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No report card record found for this student.
          </div>
        ) : (
          <div ref={printRef} className="space-y-6 p-6 print:p-0">
            {/* Header / Student Info Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Student Name</p>
                  <p className="font-bold text-slate-900">
                    {report.lastName} {report.firstName}
                  </p>
                  {report.lastNameKm && (
                    <p className="text-xs font-khmer text-slate-600">
                      {report.lastNameKm} {report.firstNameKm}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Student ID</p>
                  <p className="font-semibold text-slate-800">
                    {report.studentCode || `STU-${report.studentId}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Class & Term</p>
                  <p className="font-semibold text-slate-800">{report.className}</p>
                  <p className="text-xs text-slate-500">{report.academicYear}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Evaluation Month</p>
                  <p className="font-bold text-[#45AC5E]">{report.month}</p>
                </div>
              </div>
            </div>

            {/* Component Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/75 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Evaluation Component</th>
                    <th className="px-4 py-3 text-center">Max Points</th>
                    <th className="px-4 py-3 text-center">Weight (%)</th>
                    <th className="px-4 py-3 text-center">Raw Score</th>
                    <th className="px-4 py-3 text-right">Weighted Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.components.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {c.maxScore}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-600">
                        {c.weight}%
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">
                        {c.rawScore}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {c.weightedScore.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td className="px-4 py-3">Total Performance</td>
                    <td className="px-4 py-3 text-center">-</td>
                    <td className="px-4 py-3 text-center">100%</td>
                    <td className="px-4 py-3 text-center">{report.totalRawScore}</td>
                    <td className="px-4 py-3 text-right text-base text-[#45AC5E]">
                      {report.totalWeightedScore.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Performance Summary Badges */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black ${getGradeBadgeColor(
                    report.gradeLetter
                  )}`}
                >
                  {report.gradeLetter}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Letter Grade</p>
                  <p className="text-sm font-bold text-slate-800">
                    {report.percentage.toFixed(1)}% Overall
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl font-black text-amber-600">
                  #{report.rank ?? "-"}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Class Rank</p>
                  <p className="text-sm font-bold text-slate-800">
                    out of {report.totalStudents} students
                  </p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Evaluation Result</p>
                <p className="text-sm font-bold text-emerald-600">
                  {report.percentage >= 50 ? "PASSED" : "NEEDS IMPROVEMENT"}
                </p>
              </div>
            </div>

            {/* Teacher Feedback / Comments */}
            {report.feedback && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Teacher Remarks & Feedback:
                </p>
                <p className="mt-1 text-sm italic text-slate-700">
                  "{report.feedback}"
                </p>
              </div>
            )}

            {/* Signatures section for printable report */}
            <div className="hidden pt-12 print:grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
              <div className="border-t border-slate-400 pt-2">Homeroom Teacher</div>
              <div className="border-t border-slate-400 pt-2">Academic Director</div>
              <div className="border-t border-slate-400 pt-2">Parent Signature</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
