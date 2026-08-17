import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
  Edit2,
} from "lucide-react";
import { TeacherStatusBadge } from "./teacher-status-badge";
import { useTeacherDetailQuery } from "../hooks/use-teacher-detail-query";
import type { TeacherAttribute } from "@repo/contracts";

interface TeacherDetailDialogProps {
  teacherId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (teacher: TeacherAttribute) => void;
}

export function TeacherDetailDialog({
  teacherId,
  open,
  onOpenChange,
  onEdit,
}: TeacherDetailDialogProps) {
  const { data: teacher, isLoading } = useTeacherDetailQuery(teacherId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !teacher ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header / Avatar */}
            <DialogHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800 border-2 border-emerald-200">
                    {teacher.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-bold text-slate-900">
                        {teacher.name}
                      </DialogTitle>
                      <TeacherStatusBadge status={teacher.status} />
                    </div>
                    {teacher.nameKm && (
                      <p className="text-sm font-medium text-slate-500 font-khmer">
                        {teacher.nameKm}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {teacher.teacherCode || "NO CODE"}
                      </span>
                      {teacher.specialization && (
                        <span>• {teacher.specialization}</span>
                      )}
                    </div>
                  </div>
                </div>

                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(teacher);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 flex items-center gap-3">
                <div className="rounded-md bg-emerald-100 p-2 text-emerald-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Salary Rate
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    ${Number(teacher.salaryInHour).toFixed(2)}{" "}
                    <span className="text-xs font-normal text-slate-400">/ hour</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 flex items-center gap-3">
                <div className="rounded-md bg-blue-100 p-2 text-blue-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Assigned Classes
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {teacher.classes?.length ?? teacher.classCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 flex items-center gap-3">
                <div
                  className={`rounded-md p-2 ${
                    teacher.user ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Login Access
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {teacher.user ? (
                      <span className="text-emerald-700">Enabled ({teacher.user.username})</span>
                    ) : (
                      <span className="text-slate-400">No Account</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile & Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personal & Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Gender:</span>
                  <span className="font-semibold">{teacher.gender || "MALE"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-semibold">{teacher.dateOfBirth || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold">{teacher.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold">{teacher.email || "N/A"}</span>
                </div>
                {teacher.bio && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block mb-1">Biography / Notes:</span>
                    <p className="text-slate-700 leading-relaxed">{teacher.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Classes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Classes ({teacher.classes?.length ?? 0})
                </h4>
              </div>

              {teacher.classes && teacher.classes.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Class Name</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Grade</th>
                        <th className="px-3 py-2">Room & Shift</th>
                        <th className="px-3 py-2 text-right">Headcount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacher.classes.map((cls) => (
                        <tr key={cls.id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            {cls.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">
                            {cls.code || "-"}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {cls.gradeLevel ? `Grade ${cls.gradeLevel}` : "-"}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {cls.room || "Room -"} ({cls.shift || "MORNING"})
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Badge
                              variant="secondary"
                              className="font-medium bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              <Users className="mr-1 h-3 w-3 inline" />
                              {cls.studentCount ?? 0} Students
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  This teacher is not currently assigned to any classes.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
