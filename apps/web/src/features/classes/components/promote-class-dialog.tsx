import { useState, useEffect, useMemo, type FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClassesQuery } from "../hooks/use-classes-infinite-query";
import { useClassStudentsQuery } from "../hooks/use-class-students-query";
import { useBatchPromoteStudentsMutation } from "@/features/students/hooks/use-student-mutations";
import {
  SemesterEnum,
  type ClassAttribute,
} from "@repo/contracts";
import {
  GraduationCap,
  ArrowRight,
  Loader2,
  Users,
  Search,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface PromoteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromClass?: ClassAttribute | null;
  onSuccess?: () => void;
}

export const PromoteClassDialog: FC<PromoteClassDialogProps> = ({
  open,
  onOpenChange,
  fromClass,
  onSuccess,
}) => {
  const classId = fromClass?.id;
  const { data: studentsData, isLoading: isLoadingStudents } =
    useClassStudentsQuery(classId);
  const { data: classesRes, isLoading: isLoadingClasses } = useClassesQuery({
    pageSize: 100,
  });

  const availableClasses = useMemo(() => {
    return (classesRes?.data || []).filter((c) => c.id !== classId);
  }, [classesRes, classId]);

  const enrollments = useMemo(() => {
    return (studentsData?.data || []).filter(
      (e) => e.status === "ENROLLED"
    );
  }, [studentsData]);

  // Form States
  const [toClassId, setToClassId] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>(
    fromClass?.academicYear || "2025-2026"
  );
  const [semester, setSemester] = useState<SemesterEnum>(
    fromClass?.semester === SemesterEnum.SEMESTER_1
      ? SemesterEnum.SEMESTER_2
      : SemesterEnum.SEMESTER_1
  );
  const [completePrevious, setCompletePrevious] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync state whenever fromClass or enrolled students load
  useEffect(() => {
    if (fromClass) {
      setAcademicYear(fromClass.academicYear || "2025-2026");
      setSemester(
        fromClass.semester === SemesterEnum.SEMESTER_1
          ? SemesterEnum.SEMESTER_2
          : SemesterEnum.SEMESTER_1
      );
      setRemarks(`End of term promotion from ${fromClass.name}`);
    }
  }, [fromClass]);

  useEffect(() => {
    if (enrollments.length > 0) {
      setSelectedStudentIds(enrollments.map((e) => e.studentId));
    } else {
      setSelectedStudentIds([]);
    }
  }, [enrollments]);

  const batchPromoteMutation = useBatchPromoteStudentsMutation();

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === enrollments.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(enrollments.map((e) => e.studentId));
    }
  };

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredEnrollments = useMemo(() => {
    if (!searchQuery) return enrollments;
    const q = searchQuery.toLowerCase();
    return enrollments.filter((e) => {
      const s = e.student;
      if (!s) return false;
      return (
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q) ||
        s.firstNameKm?.includes(q) ||
        s.lastNameKm?.includes(q)
      );
    });
  }, [enrollments, searchQuery]);

  const selectedDestinationClass = useMemo(() => {
    return availableClasses.find((c) => String(c.id) === toClassId);
  }, [availableClasses, toClassId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromClass || !toClassId || selectedStudentIds.length === 0) return;

    batchPromoteMutation.mutate(
      {
        studentIds: selectedStudentIds,
        fromClassId: fromClass.id,
        toClassId: Number(toClassId),
        academicYear,
        semester,
        completePreviousEnrollment: completePrevious,
        remarks: remarks || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  if (!fromClass) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-0">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white rounded-t-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45AC5E]/20 text-[#45AC5E] border border-[#45AC5E]/30">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  Promote Class & Cohort
                  <Badge className="bg-[#45AC5E] text-white text-[10px] uppercase font-bold tracking-wider">
                    End of Semester
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-300 mt-1">
                  Transition all or selected students from{" "}
                  <span className="font-semibold text-emerald-400">
                    {fromClass.name}
                  </span>{" "}
                  to their next academic level (e.g. Solutions 3 &rarr; Solutions 4).
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Progression Visual Route Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
              {/* Source Class Box */}
              <div className="md:col-span-5 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Source Class
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {fromClass.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Badge variant="outline" className="text-[10px] bg-slate-50">
                    {fromClass.academicYear || "2025-2026"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">
                    {fromClass.semester || "Semester 1"}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    {enrollments.length} Enrolled Students
                  </Badge>
                </div>
              </div>

              {/* Center Transition Indicator */}
              <div className="md:col-span-1 flex justify-center py-1 md:py-0">
                <div className="h-8 w-8 rounded-full bg-[#45AC5E] text-white flex items-center justify-center shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Target Class Box */}
              <div className="md:col-span-5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Target Next Class
                </span>
                <p className="text-sm font-bold text-emerald-950 mt-0.5 truncate">
                  {selectedDestinationClass?.name || "Select target class below..."}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Badge variant="outline" className="text-[10px] bg-white border-emerald-200 text-emerald-800">
                    {academicYear}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white border-emerald-200 text-emerald-800">
                    {semester}
                  </Badge>
                  <Badge className="bg-[#45AC5E] text-white text-[10px]">
                    {selectedStudentIds.length} Selected to Promote
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Form Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Class Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Destination Class <span className="text-red-500">*</span>
              </Label>
              <Select value={toClassId} onValueChange={setToClassId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select next class..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => {
                    const programLabel =
                      typeof cls.program === "object" && cls.program
                        ? (cls.program as { name?: string }).name
                        : cls.programName || cls.program;
                    return (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        <span className="font-semibold">{cls.name}</span>
                        {programLabel ? ` (${programLabel})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Target Academic Year */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Target Academic Year <span className="text-red-500">*</span>
              </Label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="h-9 text-xs"
              />
            </div>

            {/* Target Semester */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Target Semester <span className="text-red-500">*</span>
              </Label>
              <Select
                value={semester}
                onValueChange={(val) => setSemester(val as SemesterEnum)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select semester..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SemesterEnum).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student Roster Selection Table */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Students to Advance ({selectedStudentIds.length} of {enrollments.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleSelectAll}
                  className="h-7 text-xs gap-1.5"
                >
                  {selectedStudentIds.length === enrollments.length ? (
                    <>
                      <Square className="h-3.5 w-3.5 text-slate-500" /> Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 text-[#45AC5E]" /> Select All ({enrollments.length})
                    </>
                  )}
                </Button>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="h-7 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          enrollments.length > 0 &&
                          selectedStudentIds.length === enrollments.length
                        }
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold">Code</TableHead>
                    <TableHead className="text-xs font-bold">Student Name</TableHead>
                    <TableHead className="text-xs font-bold">Gender</TableHead>
                    <TableHead className="text-xs font-bold">Type</TableHead>
                    <TableHead className="text-xs font-bold">Current Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingStudents ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                        <p className="mt-2 text-xs text-slate-500">Loading student roster...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        {enrollments.length === 0
                          ? "No active students enrolled in this class to promote."
                          : "No students matching your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEnrollments.map((enr) => {
                      const s = enr.student;
                      if (!s) return null;
                      const isSelected = selectedStudentIds.includes(enr.studentId);
                      return (
                        <TableRow
                          key={enr.id}
                          onClick={() => handleToggleStudent(enr.studentId)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleStudent(enr.studentId)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-slate-700">
                            {s.studentCode || `STU-${s.id}`}
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-bold text-slate-900">
                              {s.firstName} {s.lastName}
                            </p>
                            {(s.firstNameKm || s.lastNameKm) && (
                              <p className="text-[10px] text-slate-500">
                                {s.lastNameKm} {s.firstNameKm}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs capitalize text-slate-600">
                            {s.gender?.toLowerCase()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                enr.isPrimary
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {enr.isPrimary ? "Primary" : "Elective"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                              {enr.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Options & Remarks */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Checkbox
                id="completePrev"
                checked={completePrevious}
                onCheckedChange={(c) => setCompletePrevious(!!c)}
              />
              <Label
                htmlFor="completePrev"
                className="text-xs font-medium text-slate-700 cursor-pointer"
              >
                Mark previous enrollments in <strong>{fromClass.name}</strong> as COMPLETED (archive historical record)
              </Label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-600">
                Promotion Remarks / Transition Notes
              </Label>
              <Textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. End of Semester 1 cohort progression into Semester 2"
                className="text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={batchPromoteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !toClassId ||
                selectedStudentIds.length === 0 ||
                batchPromoteMutation.isPending
              }
              className="bg-[#45AC5E] hover:bg-[#3d9853] text-white font-semibold gap-2 shadow-sm"
            >
              {batchPromoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Promoting Students...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  Promote {selectedStudentIds.length} Students &rarr;
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
