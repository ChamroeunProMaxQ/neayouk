import {
  useState,
  useMemo,
  useEffect,
  type FC,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import {
  type GradingRuleComponent,
  type GradeScaleItem,
} from "@repo/contracts";
import { useClassesQuery } from "@/features/classes/hooks/use-classes-infinite-query";
import { useGradebookMatrixQuery } from "../hooks/use-gradebook-matrix-query";
import { useSaveGradebookMutation } from "../hooks/use-save-gradebook-mutation";
import { ExaminationFilterBar } from "./examination-filter-bar";
import { GradebookToolbar } from "./gradebook-toolbar";
import { GradeAnalyticsCards } from "./grade-analytics-cards";
import { StudentReportCardModal } from "./student-report-card-modal";
import { exportGradebookToPdf } from "../lib/export-gradebook-pdf";
import { usePermission } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Client-side score calculation helper for instant feedback
function calculateLocalScores(
  rawScores: Record<string, number>,
  components: GradingRuleComponent[],
  gradeScale: GradeScaleItem[]
) {
  let totalRaw = 0;
  let totalWeighted = 0;

  for (const comp of components) {
    const raw = rawScores[comp.id];
    if (raw !== undefined && !isNaN(raw)) {
      const clamped = Math.max(0, raw);
      totalRaw += clamped;
      if (comp.maxScore > 0) {
        totalWeighted += (clamped / comp.maxScore) * comp.weight;
      }
    }
  }

  const percentage = Number(totalWeighted.toFixed(1));
  let gradeLetter = "F";
  for (const scale of gradeScale) {
    if (percentage >= scale.minScore && percentage <= scale.maxScore) {
      gradeLetter = scale.letter;
      break;
    }
  }

  return {
    totalRawScore: Number(totalRaw.toFixed(1)),
    totalWeightedScore: percentage,
    percentage,
    gradeLetter,
  };
}

export const GradebookMatrix: FC = () => {
  const { can } = usePermission();
  const canManage = can("manage", "examination") || can("create", "examination") || can("update", "examination");

  // 1. Filter state: Class & Month
  const { data: classesData } = useClassesQuery({
    pageSize: 100,
    status: "ACTIVE",
  });
  const classesList = classesData?.data ?? [];

  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (!selectedClassId && classesList.length > 0) {
      const first = classesList[0];
      if (first) {
        setSelectedClassId(first.id);
      }
    }
  }, [classesList, selectedClassId]);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    today.getMonth() + 1
  );

  const monthStr = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  }, [selectedYear, selectedMonth]);

  // 2. Fetch Gradebook Matrix
  const {
    data: matrixData,
    isLoading,
  } = useGradebookMatrixQuery(selectedClassId, monthStr);

  const saveMutation = useSaveGradebookMutation();

  // 3. Local edits state: studentId -> { scores: Record<string, number>, feedback?: string }
  const [localEdits, setLocalEdits] = useState<
    Record<number, { scores: Record<string, number>; feedback?: string }>
  >({});

  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Feedback modal state
  const [editingFeedbackStudentId, setEditingFeedbackStudentId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");

  // Clear local edits when class or month changes
  useEffect(() => {
    setLocalEdits({});
    setIsDirty(false);
  }, [selectedClassId, monthStr]);

  // 4. UI controls
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<
    number | null
  >(null);

  const components = matrixData?.gradingRule?.components ?? [];
  const gradeScale = matrixData?.gradingRule?.gradeScale ?? [];

  // Compute live matrix rows combining server data + local edits
  const liveRows = useMemo(() => {
    if (!matrixData) return [];

    const rows = matrixData.rows.map((row) => {
      const edit = localEdits[row.studentId];
      const scores = edit ? edit.scores : row.scores;
      const feedback = edit?.feedback !== undefined ? edit.feedback : row.feedback;

      const calc = calculateLocalScores(scores, components, gradeScale);

      return {
        ...row,
        scores,
        totalRawScore: calc.totalRawScore,
        totalWeightedScore: calc.totalWeightedScore,
        percentage: calc.percentage,
        gradeLetter: calc.gradeLetter,
        feedback,
      };
    });

    // Recompute ranks live
    rows.sort((a, b) => b.percentage - a.percentage);
    let rank = 1;
    for (let i = 0; i < rows.length; i++) {
      const currentRow = rows[i];
      const prevRow = i > 0 ? rows[i - 1] : undefined;
      if (currentRow) {
        if (prevRow && currentRow.percentage === prevRow.percentage) {
          currentRow.rank = prevRow.rank;
        } else {
          currentRow.rank = rank;
        }
      }
      rank = i + 2;
    }

    return rows;
  }, [matrixData, localEdits, components, gradeScale]);

  // Check if any entered score exceeds the component maximum or is negative
  const hasInvalidScore = useMemo(() => {
    for (const row of liveRows) {
      for (const comp of components) {
        const raw = row.scores[comp.id];
        if (raw !== undefined && !isNaN(raw) && (raw < 0 || raw > comp.maxScore)) {
          return true;
        }
      }
    }
    return false;
  }, [liveRows, components]);

  // 5. Score change handler
  const handleScoreChange = (
    studentId: number,
    componentId: string,
    valueStr: string
  ) => {
    const num = valueStr === "" ? 0 : parseFloat(valueStr);
    if (isNaN(num)) return;

    setLocalEdits((prev) => {
      const serverRow = matrixData?.rows.find((r) => r.studentId === studentId);
      const currentStudent = prev[studentId] || {
        scores: { ...serverRow?.scores },
        feedback: serverRow?.feedback || undefined,
      };

      const updatedScores = {
        ...currentStudent.scores,
        [componentId]: num,
      };

      return {
        ...prev,
        [studentId]: {
          ...currentStudent,
          scores: updatedScores,
        },
      };
    });

    setIsDirty(true);
  };

  const handleOpenFeedback = (studentId: number) => {
    const edit = localEdits[studentId];
    const serverRow = matrixData?.rows.find((r) => r.studentId === studentId);
    setFeedbackText(edit?.feedback ?? serverRow?.feedback ?? "");
    setEditingFeedbackStudentId(studentId);
  };

  const handleSaveFeedback = () => {
    if (editingFeedbackStudentId === null) return;
    const studentId = editingFeedbackStudentId;

    setLocalEdits((prev) => {
      const serverRow = matrixData?.rows.find((r) => r.studentId === studentId);
      const currentStudent = prev[studentId] || {
        scores: { ...serverRow?.scores },
      };

      return {
        ...prev,
        [studentId]: {
          ...currentStudent,
          feedback: feedbackText,
        },
      };
    });

    setIsDirty(true);
    setEditingFeedbackStudentId(null);
  };

  // 6. Keyboard navigation (Arrow keys, Tab, Enter)
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    compIdx: number
  ) => {
    let nextStudentIdx = studentIdx;
    let nextCompIdx = compIdx;

    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      nextStudentIdx = Math.min(liveRows.length - 1, studentIdx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nextStudentIdx = Math.max(0, studentIdx - 1);
    } else if (e.key === "ArrowRight") {
      if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
        nextCompIdx = Math.min(components.length - 1, compIdx + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (e.currentTarget.selectionStart === 0) {
        nextCompIdx = Math.max(0, compIdx - 1);
      }
    }

    if (nextStudentIdx !== studentIdx || nextCompIdx !== compIdx) {
      const nextInput = document.getElementById(
        `cell-${nextStudentIdx}-${nextCompIdx}`
      ) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // 7. Save handler
  const handleSave = async () => {
    if (!selectedClassId || !matrixData || hasInvalidScore) return;

    const payloadScores = liveRows.map((row) => ({
      studentId: row.studentId,
      scores: row.scores,
      feedback: row.feedback || undefined,
    }));

    await saveMutation.mutateAsync({
      classId: selectedClassId,
      month: monthStr,
      scores: payloadScores,
    });

    setLocalEdits({});
    setIsDirty(false);
  };

  const handleReset = () => {
    setLocalEdits({});
    setIsDirty(false);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!matrixData) return;
    try {
      setIsExportingPdf(true);
      const snapshot: typeof matrixData = {
        ...matrixData,
        rows: liveRows,
      };
      await exportGradebookToPdf(snapshot);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getGradeBadge = (grade: string) => {
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

  const editingStudent = liveRows.find((r) => r.studentId === editingFeedbackStudentId);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <ExaminationFilterBar
        selectedClassId={selectedClassId}
        onSelectClassId={setSelectedClassId}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={(year, month) => {
          setSelectedYear(year);
          setSelectedMonth(month);
        }}
      />

      {/* Analytics Cards (Optional toggle) */}
      {showAnalytics && matrixData?.classStats && (
        <GradeAnalyticsCards stats={matrixData.classStats} />
      )}

      {/* Action Toolbar */}
      <GradebookToolbar
        isDirty={isDirty}
        dirtyCount={Object.keys(localEdits).length}
        hasInvalidScore={hasInvalidScore}
        isSaving={saveMutation.isPending}
        isExportingPdf={isExportingPdf}
        onSave={handleSave}
        onReset={handleReset}
        onExportPdf={handleExportPdf}
        showAnalytics={showAnalytics}
        onToggleAnalytics={() => setShowAnalytics((prev) => !prev)}
        canManage={canManage}
      />

      {/* Main Interactive Matrix Spreadsheet */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#45AC5E]" />
              <p className="text-sm font-medium text-slate-500">
                Loading class gradebook matrix...
              </p>
            </div>
          </div>
        ) : !selectedClassId ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Please select a class to view and enter scores.
          </div>
        ) : liveRows.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-500">
            No enrolled students found in this class.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <Table className="w-full text-left text-sm border-collapse">
              <TableHeader className="sticky top-0 z-30 bg-slate-100/95 shadow-sm backdrop-blur-sm">
                <TableRow className="border-b border-slate-200">
                  {/* Sticky Index */}
                  <TableHead className="w-12 text-center text-xs font-bold text-slate-600">
                    #
                  </TableHead>

                  {/* Sticky Student Name & ID */}
                  <TableHead className="min-w-[180px] text-xs font-bold uppercase tracking-wider text-slate-700">
                    Student Details
                  </TableHead>

                  <TableHead className="w-16 text-center text-xs font-bold text-slate-600">
                    Gender
                  </TableHead>

                  {/* Dynamic Score Components */}
                  {components.map((comp) => (
                    <TableHead
                      key={comp.id}
                      className="min-w-[110px] text-center text-xs font-bold text-slate-800"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-slate-900">
                          {comp.name}
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Max: {comp.maxScore} ({comp.weight}%)
                        </span>
                      </div>
                    </TableHead>
                  ))}

                  {/* Calculated Totals */}
                  <TableHead className="w-24 text-center text-xs font-bold text-slate-700">
                    Raw Total
                  </TableHead>
                  <TableHead className="w-28 text-center text-xs font-bold text-[#45AC5E]">
                    Weighted %
                  </TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold text-slate-700">
                    Grade
                  </TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold text-amber-600">
                    Rank
                  </TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold text-slate-600">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {liveRows.map((row, studentIdx) => {
                  const isRowEdited = Boolean(localEdits[row.studentId]);

                  return (
                    <TableRow
                      key={row.studentId}
                      className={`transition-colors hover:bg-slate-50/75 ${
                        isRowEdited ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* # Index */}
                      <TableCell className="text-center text-xs font-medium text-slate-400">
                        {studentIdx + 1}
                      </TableCell>

                      {/* Student Name */}
                      <TableCell>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReportStudentId(row.studentId)
                            }
                            className="text-left font-bold text-slate-900 hover:text-[#45AC5E] hover:underline"
                            title="Click to view full Report Card"
                          >
                            {row.lastName} {row.firstName}
                          </button>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>{row.studentCode || `STU-${row.studentId}`}</span>
                            {row.firstNameKm && (
                              <span className="font-khmer text-slate-400">
                                • {row.lastNameKm} {row.firstNameKm}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Gender */}
                      <TableCell className="text-center text-xs text-slate-600">
                        {row.gender}
                      </TableCell>

                      {/* Dynamic Component Input Cells */}
                      {components.map((comp, compIdx) => {
                        const rawVal = row.scores[comp.id];
                        const isExceeded =
                          rawVal !== undefined && rawVal > comp.maxScore;

                        return (
                          <TableCell
                            key={comp.id}
                            className="p-1.5 text-center"
                          >
                            <div className="relative inline-block">
                              <input
                                id={`cell-${studentIdx}-${compIdx}`}
                                type="number"
                                step="any"
                                min="0"
                                max={comp.maxScore}
                                value={rawVal !== undefined ? rawVal : ""}
                                placeholder="0"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleScoreChange(
                                    row.studentId,
                                    comp.id,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(
                                  e: KeyboardEvent<HTMLInputElement>
                                ) => handleKeyDown(e, studentIdx, compIdx)}
                                disabled={!canManage}
                                className={`h-9 w-20 rounded-lg border text-center text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                                  isExceeded
                                    ? "border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-200"
                                    : rawVal !== undefined && rawVal > 0
                                    ? "border-slate-300 bg-white text-slate-900 focus:border-[#45AC5E] focus:ring-[#45AC5E]/20"
                                    : "border-slate-200 bg-slate-50 text-slate-400 focus:border-[#45AC5E] focus:bg-white focus:ring-[#45AC5E]/20"
                                }`}
                              />
                            </div>
                          </TableCell>
                        );
                      })}

                      {/* Raw Total */}
                      <TableCell className="text-center font-semibold text-slate-700">
                        {row.totalRawScore}
                      </TableCell>

                      {/* Weighted Total Score (%) */}
                      <TableCell className="text-center font-bold text-[#45AC5E]">
                        {row.totalWeightedScore.toFixed(1)}%
                      </TableCell>

                      {/* Letter Grade */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-xs ${getGradeBadge(
                            row.gradeLetter
                          )}`}
                        >
                          {row.gradeLetter}
                        </span>
                      </TableCell>

                      {/* Rank in Class */}
                      <TableCell className="text-center font-bold text-amber-600">
                        #{row.rank ?? "-"}
                      </TableCell>

                      {/* Remarks & Report Trigger */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Remarks Dialog Trigger */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenFeedback(row.studentId)}
                            className={`h-8 w-8 rounded-lg ${
                              row.feedback
                                ? "text-[#45AC5E] hover:bg-[#45AC5E]/10"
                                : "text-slate-400 hover:text-slate-700"
                            }`}
                            title="Teacher Remarks / Feedback"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>

                          {/* Report Card Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSelectedReportStudentId(row.studentId)
                            }
                            className="h-8 w-8 text-slate-400 hover:text-[#45AC5E]"
                            title="View Report Card"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Teacher Feedback Modal Dialog */}
      <Dialog
        open={editingFeedbackStudentId !== null}
        onOpenChange={(open) => !open && setEditingFeedbackStudentId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Remarks for {editingStudent?.firstName} {editingStudent?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-slate-500">
              Qualitative advice or feedback on monthly performance:
            </label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Great improvement in reading fluency. Needs more vocabulary practice."
              rows={4}
              className="text-sm"
              disabled={!canManage}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingFeedbackStudentId(null)}
            >
              Cancel
            </Button>
            {canManage && (
              <Button
                type="button"
                onClick={handleSaveFeedback}
                className="bg-[#45AC5E] font-bold text-white hover:bg-[#3d9852]"
              >
                Apply Remarks
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Report Card Modal */}
      {selectedReportStudentId !== null && (
        <StudentReportCardModal
          isOpen={selectedReportStudentId !== null}
          onClose={() => setSelectedReportStudentId(null)}
          studentId={selectedReportStudentId}
          month={monthStr}
          classId={selectedClassId}
        />
      )}
    </div>
  );
};
