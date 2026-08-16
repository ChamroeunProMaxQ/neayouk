import { useState, type FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useClassesQuery } from "../hooks/use-classes-query";
import { usePromoteStudentMutation } from "../hooks/use-student-mutations";
import { SemesterEnum, type StudentAttribute } from "@repo/contracts";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";

interface StudentPromoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAttribute;
  onSuccess?: () => void;
}

export const StudentPromoteDialog: FC<StudentPromoteDialogProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const currentClass = student.primaryClass;
  const currentYear = new Date().getFullYear();
  const nextAcademicYear = `${currentYear}-${currentYear + 1}`;

  const { data: classesRes, isLoading: isLoadingClasses } = useClassesQuery({ pageSize: 100 });
  const classes = classesRes?.data || [];

  const [toClassId, setToClassId] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>(nextAcademicYear);
  const [semester, setSemester] = useState<SemesterEnum>(SemesterEnum.SEMESTER_2);
  const [completePrevious, setCompletePrevious] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>("");

  const promoteMutation = usePromoteStudentMutation();

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toClassId || !currentClass) return;

    promoteMutation.mutate(
      {
        studentId: student.id,
        dto: {
          studentId: student.id,
          fromClassId: currentClass.id,
          toClassId: Number(toClassId),
          academicYear,
          semester,
          completePreviousEnrollment: completePrevious,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-white shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <GraduationCap className="w-5 h-5 text-[#45AC5E]" />
            Promote / Move to Next Semester Class
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Student: <span className="font-semibold text-slate-800">{student.firstName} {student.lastName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handlePromote} className="space-y-4 pt-2">
          {/* Visual Progression Route */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Class</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {currentClass?.name || "No primary class"}
              </p>
              <span className="text-[10px] text-slate-500">
                {currentClass?.semester || "Sem 1"} ({currentClass?.academicYear || "Current"})
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#EBF6EE] flex items-center justify-center text-[#45AC5E]">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Class</span>
              <p className="text-xs font-bold text-[#389350] mt-0.5">
                {classes.find((c) => String(c.id) === toClassId)?.name || "Select class"}
              </p>
              <span className="text-[10px] text-slate-500">
                {semester} ({academicYear})
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Select Target Class *</Label>
            <Select value={toClassId} onValueChange={setToClassId} disabled={isLoadingClasses}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Choose destination class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter((c) => !currentClass || c.id !== currentClass.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name} {c.gradeLevel ? `(Grade ${c.gradeLevel})` : ""} - ${Number(c.monthlyFee).toFixed(2)}/mo
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={`${currentYear - 1}-${currentYear}`} className="text-xs">
                    {currentYear - 1}-{currentYear}
                  </SelectItem>
                  <SelectItem value={`${currentYear}-${currentYear + 1}`} className="text-xs">
                    {currentYear}-{currentYear + 1}
                  </SelectItem>
                  <SelectItem value={`${currentYear + 1}-${currentYear + 2}`} className="text-xs">
                    {currentYear + 1}-{currentYear + 2}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Semester</Label>
              <Select value={semester} onValueChange={(val) => setSemester(val as SemesterEnum)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SemesterEnum.SEMESTER_1} className="text-xs">Semester 1</SelectItem>
                  <SelectItem value={SemesterEnum.SEMESTER_2} className="text-xs">Semester 2</SelectItem>
                  <SelectItem value={SemesterEnum.SUMMER} className="text-xs">Summer Semester</SelectItem>
                  <SelectItem value={SemesterEnum.FULL_YEAR} className="text-xs">Full Academic Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="completePrev"
              checked={completePrevious}
              onCheckedChange={(checked) => setCompletePrevious(Boolean(checked))}
            />
            <Label htmlFor="completePrev" className="text-xs font-medium text-slate-700 cursor-pointer">
              Mark previous class enrollment as "Completed"
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Progression Notes / Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs resize-none"
              rows={2}
              placeholder="e.g. Passed Semester 1 exams with Honors"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!toClassId || promoteMutation.isPending}
              className="bg-[#45AC5E] hover:bg-[#389350] text-white text-xs font-semibold h-9"
            >
              {promoteMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              )}
              Promote Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
