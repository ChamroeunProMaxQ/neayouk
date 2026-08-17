import { useMemo, useState } from "react";
import { type ClassAttribute } from "@repo/contracts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useClassStudentsQuery } from "../hooks/use-class-students-query";
import { useClassQuery } from "../hooks/use-classes-infinite-query";
import { ClassTimetableGrid } from "./class-timetable-grid";
import { PromoteClassDialog } from "./promote-class-dialog";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Loader2,
  DollarSign,
  GraduationCap,
} from "lucide-react";

interface ClassDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls?: ClassAttribute | null;
  initialTab?: string;
}

export function ClassDetailDialog({
  open,
  onOpenChange,
  cls: initialCls,
  initialTab = "overview",
}: ClassDetailDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchStudent, setSearchStudent] = useState("");
  const [promoteOpen, setPromoteOpen] = useState(false);

  const classId = initialCls?.id;
  const { data: classData } = useClassQuery(classId);
  const { data: studentsData, isLoading: isLoadingStudents } =
    useClassStudentsQuery(classId);

  const cls = classData?.data ?? initialCls;
  const enrollments = useMemo(
    () => (studentsData?.data ?? []).filter((e) => e.status === "ENROLLED"),
    [studentsData]
  );
  const filteredEnrollments = useMemo(() => {
    if (!searchStudent) return enrollments;
    const q = searchStudent.toLowerCase();
    return enrollments.filter((e) => {
      const stu = e.student;
      if (!stu) return false;
      return (
        stu.firstName?.toLowerCase().includes(q) ||
        stu.lastName?.toLowerCase().includes(q) ||
        stu.studentCode?.toLowerCase().includes(q) ||
        stu.firstNameKm?.includes(q) ||
        stu.lastNameKm?.includes(q)
      );
    });
  }, [enrollments, searchStudent]);

  if (!cls) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-white p-0">
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white rounded-t-lg">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45AC5E]/20 text-[#45AC5E] border border-[#45AC5E]/30">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <DialogTitle className="text-xl font-bold text-white">
                    {cls.name}
                  </DialogTitle>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {cls.code && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-emerald-400 border border-slate-700">
                      {cls.code}
                    </span>
                  )}
                  {cls.programName && (
                    <span>Program: <strong>{cls.programName}</strong></span>
                  )}
                  {cls.academicYear && (
                    <span>Session: <strong>{cls.academicYear}</strong></span>
                  )}
                  {cls.semester && (
                    <Badge variant="outline" className="text-slate-300 border-slate-700">
                      {cls.semester}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Headcount pill */}
              <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-right">
                <p className="text-[11px] font-medium text-slate-400">Enrolled Students</p>
                <p className="text-xl font-black text-white flex items-center justify-end gap-1.5 mt-0.5">
                  <Users className="h-4 w-4 text-[#45AC5E]" />
                  <span>{cls.studentCount ?? enrollments.length}</span>
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tab Navigation & Content */}
        <div className="p-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:text-[#45AC5E] data-[state=active]:shadow-sm font-semibold text-xs py-2"
              >
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Overview & Config
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-white data-[state=active]:text-[#45AC5E] data-[state=active]:shadow-sm font-semibold text-xs py-2"
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Enrolled Students ({cls.studentCount ?? enrollments.length})
              </TabsTrigger>
              <TabsTrigger
                value="timetable"
                className="data-[state=active]:bg-white data-[state=active]:text-[#45AC5E] data-[state=active]:shadow-sm font-semibold text-xs py-2"
              >
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Weekly Timetable
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schedule & Timing Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#45AC5E]" />
                    Daily Schedule & Shift
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Shift</span>
                      <Badge className="bg-[#45AC5E] text-white hover:bg-[#45AC5E]">
                        {cls.shift || "MORNING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Daily Time Range</span>
                      <span className="font-semibold text-slate-800">
                        {cls.startTime || "07:30"} - {cls.endTime || "11:30"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Classroom / Room</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {cls.room || "Not Assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Section</span>
                      <span className="font-semibold text-slate-800">
                        {cls.section || "A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Term & Financials Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-[#45AC5E]" />
                    Academic Term & Fees
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Monthly Tuition Fee</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ${Number(cls.monthlyFee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Academic Term Dates</span>
                      <span className="font-semibold text-slate-800">
                        {cls.startDate ? new Date(cls.startDate).toLocaleDateString() : "01-Sep-2025"} &rarr; {cls.endDate ? new Date(cls.endDate).toLocaleDateString() : "30-Jun-2026"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Grade Level</span>
                      <span className="font-semibold text-slate-800">
                        {cls.gradeLevel || "Standard"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Status</span>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                        {cls.status || "ACTIVE"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: ENROLLED STUDENTS ROSTER */}
            <TabsContent value="students" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search student by name or ID..."
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredEnrollments.length} of {enrollments.length} students
                  </span>
                  {enrollments.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setPromoteOpen(true)}
                      className="h-8 bg-[#45AC5E] hover:bg-[#3d9853] text-white text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Promote Class &rarr;
                    </Button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Student Code</TableHead>
                      <TableHead className="text-xs font-bold">Student Name</TableHead>
                      <TableHead className="text-xs font-bold">Gender</TableHead>
                      <TableHead className="text-xs font-bold">Enrolled Date</TableHead>
                      <TableHead className="text-xs font-bold">Type</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
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
                          No students found enrolled in this class.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEnrollments.map((enr) => {
                        const s = enr.student;
                        if (!s) return null;
                        return (
                          <TableRow key={enr.id}>
                            <TableCell className="font-mono text-xs font-semibold text-slate-700">
                              {s.studentCode || `STU-${s.id}`}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-xs font-bold text-slate-900">
                                  {s.firstName} {s.lastName}
                                </p>
                                {(s.firstNameKm || s.lastNameKm) && (
                                  <p className="text-[11px] text-slate-500">
                                    {s.lastNameKm} {s.firstNameKm}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs capitalize text-slate-600">
                              {s.gender?.toLowerCase()}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {enr.enrolledAt
                                ? new Date(enr.enrolledAt).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${enr.isPrimary
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                              >
                                {enr.isPrimary ? "Primary" : "Elective"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-[10px] ${enr.status === "ENROLLED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                                  }`}
                              >
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
            </TabsContent>

            {/* TAB 3: WEEKLY TIMETABLE */}
            <TabsContent value="timetable">
              <ClassTimetableGrid classId={cls.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      <PromoteClassDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        fromClass={cls}
      />
    </Dialog>
  );
}
