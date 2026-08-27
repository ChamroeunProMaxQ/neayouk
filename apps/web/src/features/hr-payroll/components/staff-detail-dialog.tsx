import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStaffDetailQuery } from "../hooks/use-staff-mutations";
import { StaffStatusBadge } from "./staff-status-badge";
import {
  Loader2,
  Building,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  User,
} from "lucide-react";
import { StaffSalaryTypeEnum } from "@repo/contracts";

interface StaffDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number | null;
}

export function StaffDetailDialog({
  open,
  onOpenChange,
  staffId,
}: StaffDetailDialogProps) {
  const { data: response, isLoading } = useStaffDetailQuery(staffId);
  const staff = response?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Staff Member Dossier
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading personnel profile...</span>
          </div>
        ) : !staff ? (
          <div className="text-center py-8 text-muted-foreground">
            Staff profile not found.
          </div>
        ) : (
          <div className="space-y-6 pt-1">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {staff.name}
                  </h3>
                  {staff.nameKm && (
                    <span className="text-sm text-muted-foreground">
                      ({staff.nameKm})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {staff.staffCode || `#${staff.id}`}
                  </span>
                  <span>•</span>
                  <span className="text-xs font-medium">{staff.designation}</span>
                  <span>•</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {staff.department}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StaffStatusBadge status={staff.status} />
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Info */}
              <div className="p-4 rounded-lg border bg-card space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact & Identity
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{staff.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{staff.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Gender: {staff.gender}</span>
                    {staff.dateOfBirth && <span>• DOB: {staff.dateOfBirth}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    <span>Joined: {staff.joiningDate || "Not recorded"}</span>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="p-4 rounded-lg border bg-card space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Compensation Package
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Salary Type:</span>
                    <Badge variant="outline" className="text-[11px]">
                      {staff.salaryType === StaffSalaryTypeEnum.HOURLY
                        ? "Hourly Rate"
                        : "Monthly Fixed"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate / Salary:</span>
                    <span className="font-bold text-foreground">
                      {staff.salaryType === StaffSalaryTypeEnum.HOURLY ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-3.5 w-3.5" /> ${staff.hourlyRate?.toFixed(2)} / hr
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <DollarSign className="h-3.5 w-3.5" /> ${staff.baseSalary?.toFixed(2)} / mo
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Employment:</span>
                    <span>{staff.employmentType?.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div className="p-4 rounded-lg border bg-card space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Bank & Payment Route
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Bank</span>
                  <span className="font-medium text-foreground">
                    {staff.bankName || "Not assigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Account Holder</span>
                  <span className="font-medium text-foreground">
                    {staff.bankAccountName || "Not assigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Account Number</span>
                  <span className="font-mono font-medium text-foreground">
                    {staff.bankAccountNumber || "Not assigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked CMS User */}
            <div className="p-4 rounded-lg border bg-card space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Portal Access Account
              </h4>
              {staff.user ? (
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="outline" className="text-primary border-primary/30">
                    @{staff.user.username}
                  </Badge>
                  <span className="text-muted-foreground">User ID: #{staff.user.id}</span>
                  <span className="text-muted-foreground">Status: {staff.user.status}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No linked portal user login for this staff member.
                </p>
              )}
            </div>

            {/* Assigned Teaching Classes (If teacher) */}
            {staff.classes && staff.classes.length > 0 && (
              <div className="p-4 rounded-lg border bg-card space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Assigned Classes ({staff.classes.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {staff.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-2 rounded border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">{cls.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {cls.studentCount ?? 0} students
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {staff.bio && (
              <div className="p-4 rounded-lg border bg-card space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Biography & Notes
                </h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {staff.bio}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
