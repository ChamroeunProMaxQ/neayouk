import { z } from "zod";

export enum ReportDatePresetEnum {
  TODAY = "TODAY",
  THIS_MONTH = "THIS_MONTH",
  LAST_MONTH = "LAST_MONTH",
  THIS_QUARTER = "THIS_QUARTER",
  THIS_YEAR = "THIS_YEAR",
  CUSTOM = "CUSTOM",
}

// ---------------------------------------------------------------------------
// Financial Reports
// ---------------------------------------------------------------------------

export const FinancialReportQuerySchema = z.object({
  preset: z.nativeEnum(ReportDatePresetEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  academicYear: z.string().optional(),
  classId: z.coerce.number().optional(),
});
export type FinancialReportQueryDto = z.infer<typeof FinancialReportQuerySchema>;

export const FinancialReportSummarySchema = z.object({
  totalRevenue: z.number(),
  totalOutstanding: z.number(),
  totalExpenses: z.number(),
  totalPayroll: z.number(),
  netOperatingMargin: z.number(),
  collectionRate: z.number(),
  previousPeriodRevenue: z.number().optional(),
  revenueGrowthRate: z.number().optional(),
  totalInvoicesCount: z.number(),
  paidInvoicesCount: z.number(),
  unpaidInvoicesCount: z.number(),
  overdueInvoicesCount: z.number(),
  monthlyTrends: z.array(
    z.object({
      month: z.string(), // "2026-01"
      revenue: z.number(),
      expense: z.number(),
      payroll: z.number(),
      net: z.number(),
    })
  ),
  revenueByCategory: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  expenseByCategory: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  paymentMethodsDistribution: z.array(
    z.object({
      method: z.string(),
      count: z.number(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
});
export type FinancialReportSummaryDto = z.infer<typeof FinancialReportSummarySchema>;

// ---------------------------------------------------------------------------
// Academic Reports
// ---------------------------------------------------------------------------

export const AcademicReportQuerySchema = z.object({
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  month: z.string().optional(),
  programId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  gradeLevel: z.coerce.number().optional(),
});
export type AcademicReportQueryDto = z.infer<typeof AcademicReportQuerySchema>;

export const AcademicReportSummarySchema = z.object({
  totalStudentsAssessed: z.number(),
  overallAverageScore: z.number(),
  passRate: z.number(),
  honorRollCount: z.number(),
  honorRollPercentage: z.number(),
  atRiskCount: z.number(),
  atRiskPercentage: z.number(),
  gradeDistribution: z.array(
    z.object({
      gradeLetter: z.string(), // "A", "B", "C", "D", "E", "F"
      count: z.number(),
      percentage: z.number(),
    })
  ),
  subjectMastery: z.array(
    z.object({
      subjectId: z.string(),
      subjectName: z.string(),
      maxScore: z.number(),
      averageScore: z.number(),
      averagePercentage: z.number(),
      passingCount: z.number(),
    })
  ),
  classBenchmarks: z.array(
    z.object({
      classId: z.number(),
      className: z.string(),
      gradeLevel: z.number().nullable().optional(),
      totalStudents: z.number(),
      averageScore: z.number(),
      passRate: z.number(),
      highestScore: z.number(),
      lowestScore: z.number(),
    })
  ),
  topPerformers: z.array(
    z.object({
      studentId: z.number(),
      studentCode: z.string().nullable().optional(),
      studentName: z.string(),
      studentNameKm: z.string().nullable().optional(),
      className: z.string(),
      totalScore: z.number(),
      percentage: z.number(),
      gradeLetter: z.string(),
      rank: z.number(),
    })
  ),
  atRiskStudents: z.array(
    z.object({
      studentId: z.number(),
      studentCode: z.string().nullable().optional(),
      studentName: z.string(),
      studentNameKm: z.string().nullable().optional(),
      className: z.string(),
      totalScore: z.number(),
      percentage: z.number(),
      gradeLetter: z.string(),
      feedback: z.string().nullable().optional(),
    })
  ),
});
export type AcademicReportSummaryDto = z.infer<typeof AcademicReportSummarySchema>;

// ---------------------------------------------------------------------------
// Attendance Reports
// ---------------------------------------------------------------------------

export const AttendanceReportQuerySchema = z.object({
  preset: z.nativeEnum(ReportDatePresetEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  academicYear: z.string().optional(),
  classId: z.coerce.number().optional(),
  targetType: z.enum(["STUDENT", "TEACHER"]).optional().default("STUDENT"),
});
export type AttendanceReportQueryDto = z.infer<typeof AttendanceReportQuerySchema>;

export const AttendanceReportSummarySchema = z.object({
  studentAttendanceRate: z.number(),
  teacherAttendanceRate: z.number(),
  averageDailyAbsences: z.number(),
  chronicAbsenteeismCount: z.number(),
  totalApprovedLeaves: z.number(),
  totalSessionsRecorded: z.number(),
  dailyTrends: z.array(
    z.object({
      date: z.string(),
      present: z.number(),
      absent: z.number(),
      late: z.number(),
      excused: z.number(),
      halfDay: z.number(),
      attendanceRate: z.number(),
    })
  ),
  classAttendanceList: z.array(
    z.object({
      classId: z.number(),
      className: z.string(),
      enrolledCount: z.number(),
      attendanceRate: z.number(),
      presentCount: z.number(),
      absentCount: z.number(),
      lateCount: z.number(),
      excusedCount: z.number(),
    })
  ),
  weekdayAbsencePatterns: z.array(
    z.object({
      dayOfWeek: z.string(), // "Monday", "Tuesday", etc.
      dayIndex: z.number(), // 1 for Monday
      absenceCount: z.number(),
      averageAbsenceRate: z.number(),
    })
  ),
  leaveTypeBreakdown: z.array(
    z.object({
      leaveType: z.string(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
  chronicAbsenteeismList: z.array(
    z.object({
      studentId: z.number(),
      studentCode: z.string().nullable().optional(),
      studentName: z.string(),
      studentNameKm: z.string().nullable().optional(),
      className: z.string(),
      totalRecorded: z.number(),
      absentDays: z.number(),
      unexcusedAbsences: z.number(),
      attendanceRate: z.number(),
      parentPhone: z.string().nullable().optional(),
    })
  ),
});
export type AttendanceReportSummaryDto = z.infer<typeof AttendanceReportSummarySchema>;

// ---------------------------------------------------------------------------
// Report Overview Hub
// ---------------------------------------------------------------------------

export const ReportOverviewSchema = z.object({
  financial: z.object({
    totalRevenue: z.number(),
    totalExpenses: z.number(),
    netMargin: z.number(),
    collectionRate: z.number(),
  }),
  academic: z.object({
    totalStudents: z.number(),
    averageScore: z.number(),
    passRate: z.number(),
    honorRollCount: z.number(),
  }),
  attendance: z.object({
    studentRate: z.number(),
    teacherRate: z.number(),
    chronicAbsentCount: z.number(),
  }),
});
export type ReportOverviewDto = z.infer<typeof ReportOverviewSchema>;
