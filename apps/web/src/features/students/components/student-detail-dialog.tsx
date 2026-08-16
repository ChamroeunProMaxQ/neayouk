import { useState, type FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentPaymentTracker } from "./student-payment-tracker";
import { StudentPromoteDialog } from "./student-promote-dialog";
import {
  User,
  BookOpen,
  DollarSign,
  GraduationCap,
  Phone,
} from "lucide-react";
import { usePermission } from "@/features/auth";
import type { StudentAttribute } from "@repo/contracts";

interface StudentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentAttribute | null;
  onStudentUpdated?: () => void;
}

export const StudentDetailDialog: FC<StudentDetailDialogProps> = ({
  isOpen,
  onClose,
  student,
  onStudentUpdated,
}) => {
  const { can } = usePermission();
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);

  if (!student) return null;

  const canEdit = can("update", "student") || can("manage", "student");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-6 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF6EE] flex items-center justify-center text-[#45AC5E] font-black text-lg border border-[#45AC5E]/20">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {student.firstName} {student.lastName}
                  {(student.firstNameKm || student.lastNameKm) && (
                    <span className="text-sm font-semibold text-slate-500 font-sans">
                      ({student.lastNameKm || ""} {student.firstNameKm || ""})
                    </span>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-mono text-slate-600 bg-slate-50">
                    {student.studentCode || `ID #${student.id}`}
                  </Badge>
                  <Badge className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    {student.status}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                    {student.gender}
                  </Badge>
                </div>
              </div>
            </div>

            {canEdit && (
              <Button
                onClick={() => setIsPromoteOpen(true)}
                className="bg-[#45AC5E] hover:bg-[#389350] text-white text-xs font-semibold h-9 shadow-sm"
              >
                <GraduationCap className="w-4 h-4 mr-1.5" />
                Promote / Move Class
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="fees" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="fees" className="text-xs font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Tuition & Unpaid Months
            </TabsTrigger>
            <TabsTrigger value="classes" className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Classes & Enrollment ({student.enrollments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Profile Details
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Tuition Fee Tracker */}
          <TabsContent value="fees" className="pt-4">
            <StudentPaymentTracker
              student={student}
              onPaymentRecorded={() => onStudentUpdated?.()}
            />
          </TabsContent>

          {/* TAB 2: Class Enrollments History */}
          <TabsContent value="classes" className="pt-4 space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Class Name</th>
                    <th className="py-2.5 px-4 font-semibold">Grade / Program</th>
                    <th className="py-2.5 px-4 font-semibold">Academic Year</th>
                    <th className="py-2.5 px-4 font-semibold">Semester</th>
                    <th className="py-2.5 px-4 font-semibold">Monthly Fee</th>
                    <th className="py-2.5 px-4 font-semibold">Enrollment Status</th>
                    <th className="py-2.5 px-4 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.enrollments && student.enrollments.length > 0 ? (
                    student.enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                          {enr.isPrimary && (
                            <Badge className="bg-[#EBF6EE] text-[#389350] border-[#45AC5E]/30 text-[10px] py-0">
                              Primary
                            </Badge>
                          )}
                          {enr.class?.name || `Class #${enr.classId}`}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {enr.class?.gradeLevel ? `Grade ${enr.class.gradeLevel}` : "-"}
                          {enr.class?.program ? ` (${enr.class.program})` : ""}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-700">
                          {enr.academicYear}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {enr.semester}
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-900">
                          ${Number(enr.class?.monthlyFee || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            className={`text-[10px] ${enr.status === "ENROLLED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : enr.status === "COMPLETED"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {enr.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 italic max-w-xs truncate">
                          {enr.remarks || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No enrollment records available for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: Profile Details */}
          <TabsContent value="profile" className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#45AC5E]" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">English Name:</span>
                    <p className="font-semibold text-slate-800">{student.firstName} {student.lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Khmer Name:</span>
                    <p className="font-semibold text-slate-800">{student.lastNameKm || ""} {student.firstNameKm || "-"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Gender:</span>
                    <p className="font-semibold text-slate-800">{student.gender}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date of Birth:</span>
                    <p className="font-semibold text-slate-800">{student.dateOfBirth || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Registration Date:</span>
                    <p className="font-semibold text-slate-800">
                      {student.registeredAt ? new Date(student.registeredAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Monthly Due Day:</span>
                    <p className="font-semibold text-slate-800">Day {student.payableDate || 1} of each month</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#45AC5E]" />
                  Contact & Guardian Info
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Student Phone:</span>
                    <p className="font-semibold text-slate-800">{student.contact || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Guardian Name:</span>
                    <p className="font-semibold text-slate-800">{student.guardianName || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Guardian Phone:</span>
                    <p className="font-semibold text-slate-800">{student.guardianPhone || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Base Discount:</span>
                    <p className="font-black text-emerald-700">${Number(student.discount || 0).toFixed(2)}/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-4 font-semibold"
          >
            Close
          </Button>
        </div>

        {/* Promote Dialog */}
        <StudentPromoteDialog
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          student={student}
          onSuccess={() => {
            onStudentUpdated?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
