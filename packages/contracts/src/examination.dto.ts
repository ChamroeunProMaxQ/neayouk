import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import { SemesterEnum } from "./semester.enum.js";

export const GradingRuleComponentSchema = z.object({
  id: z.string().min(1, "Component ID is required"),
  name: z.string().min(1, "Component name is required"),
  maxScore: z.coerce.number().positive("Max score must be greater than 0"),
  weight: z.coerce.number().min(0).max(100, "Weight must be between 0 and 100"),
  description: z.string().optional(),
});

export type GradingRuleComponent = z.infer<typeof GradingRuleComponentSchema>;

export const GradeScaleItemSchema = z.object({
  letter: z.string().min(1, "Grade letter is required"),
  minScore: z.coerce.number().min(0, "Min score cannot be negative"),
  maxScore: z.coerce.number().max(100, "Max score cannot exceed 100"),
  label: z.string().min(1, "Label is required"),
});

export type GradeScaleItem = z.infer<typeof GradeScaleItemSchema>;

export const DefaultGradingComponents: GradingRuleComponent[] = [
  { id: "reading", name: "Reading", maxScore: 10, weight: 5, description: "Reading comprehension & fluency" },
  { id: "vocab", name: "Vocabulary", maxScore: 30, weight: 30, description: "Vocabulary quiz & spelling" },
  { id: "grammar", name: "Grammar", maxScore: 20, weight: 15, description: "Grammar rules & sentence structure" },
  { id: "listening", name: "Listening", maxScore: 20, weight: 20, description: "Listening test & audio comprehension" },
  { id: "speaking", name: "Speaking", maxScore: 10, weight: 15, description: "Oral presentation & fluency" },
  { id: "homework", name: "Homework & Attendance", maxScore: 10, weight: 15, description: "Monthly participation & assignments" },
];

export const DefaultGradeScale: GradeScaleItem[] = [
  { letter: "A", minScore: 90, maxScore: 100, label: "Excellent / ល្អប្រសើរ" },
  { letter: "B", minScore: 80, maxScore: 89.99, label: "Very Good / ល្អណាស់" },
  { letter: "C", minScore: 70, maxScore: 79.99, label: "Good / ល្អ" },
  { letter: "D", minScore: 60, maxScore: 69.99, label: "Fair / មធ្យម" },
  { letter: "E", minScore: 50, maxScore: 59.99, label: "Pass / ខ្សោយ" },
  { letter: "F", minScore: 0, maxScore: 49.99, label: "Fail / ធ្លាក់" },
];

export const GradingRuleSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  code: z.string(),
  academicYear: z.string().nullable().optional(),
  semester: z.nativeEnum(SemesterEnum).nullable().optional(),
  components: z.array(GradingRuleComponentSchema),
  gradeScale: z.array(GradeScaleItemSchema),
  isDefault: z.boolean().default(true),
  status: z.string().default("ACTIVE"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type GradingRuleAttribute = z.infer<typeof GradingRuleSchema>;

export const CreateGradingRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    academicYear: z.string().optional().nullable(),
    semester: z.nativeEnum(SemesterEnum).optional().nullable(),
    components: z.array(GradingRuleComponentSchema).min(1, "At least one grading component is required"),
    gradeScale: z.array(GradeScaleItemSchema).min(1, "Grade scale is required"),
    isDefault: z.boolean().default(false),
    status: z.string().default("ACTIVE"),
  })
  .refine(
    (data) => {
      const totalWeight = data.components.reduce((sum, c) => sum + Number(c.weight), 0);
      return Math.abs(totalWeight - 100) < 0.01;
    },
    {
      message: "Component weights must sum to exactly 100%",
      path: ["components"],
    }
  );

export type CreateGradingRuleDto = z.infer<typeof CreateGradingRuleSchema>;

export const UpdateGradingRuleSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    academicYear: z.string().optional().nullable(),
    semester: z.nativeEnum(SemesterEnum).optional().nullable(),
    components: z.array(GradingRuleComponentSchema).min(1).optional(),
    gradeScale: z.array(GradeScaleItemSchema).min(1).optional(),
    isDefault: z.boolean().optional(),
    status: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.components) return true;
      const totalWeight = data.components.reduce((sum, c) => sum + Number(c.weight), 0);
      return Math.abs(totalWeight - 100) < 0.01;
    },
    {
      message: "Component weights must sum to exactly 100%",
      path: ["components"],
    }
  );

export type UpdateGradingRuleDto = z.infer<typeof UpdateGradingRuleSchema>;

export const FindGradingRulesSchema = PaginationSchema.extend({
  ...createSortSchema(["id", "name", "code", "createdAt"], "createdAt"),
  search: z.string().optional(),
  status: z.string().optional(),
  academicYear: z.string().optional(),
});

export type FindGradingRulesDto = z.infer<typeof FindGradingRulesSchema>;

// ==================== STUDENT SCORES & GRADEBOOK ====================

export const StudentScoreSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  studentId: z.number(),
  classId: z.number(),
  month: z.string(),
  academicYear: z.string(),
  semester: z.string(),
  scores: z.record(z.string(), z.number()),
  totalRawScore: z.number(),
  totalWeightedScore: z.number(),
  percentage: z.number(),
  gradeLetter: z.string(),
  rank: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
  recordedBy: z.number().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type StudentScoreAttribute = z.infer<typeof StudentScoreSchema>;

export const GetGradebookMatrixSchema = z.object({
  classId: z.coerce.number(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

export type GetGradebookMatrixDto = z.infer<typeof GetGradebookMatrixSchema>;

export const SaveGradebookScoreItemSchema = z.object({
  studentId: z.coerce.number(),
  scores: z.record(z.string(), z.coerce.number().min(0)),
  feedback: z.string().optional().nullable(),
});

export type SaveGradebookScoreItemDto = z.infer<typeof SaveGradebookScoreItemSchema>;

export const BatchSaveGradebookSchema = z.object({
  classId: z.coerce.number(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  scores: z.array(SaveGradebookScoreItemSchema),
});

export type BatchSaveGradebookDto = z.infer<typeof BatchSaveGradebookSchema>;

export const GradebookMatrixRowSchema = z.object({
  studentId: z.number(),
  studentCode: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  firstNameKm: z.string().nullable().optional(),
  lastNameKm: z.string().nullable().optional(),
  gender: z.string().default("MALE"),
  scores: z.record(z.string(), z.number()),
  totalRawScore: z.number().default(0),
  totalWeightedScore: z.number().default(0),
  percentage: z.number().default(0),
  gradeLetter: z.string().default("F"),
  rank: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
});

export type GradebookMatrixRow = z.infer<typeof GradebookMatrixRowSchema>;

export const ClassGradeStatsSchema = z.object({
  totalStudents: z.number().default(0),
  gradedCount: z.number().default(0),
  averageScore: z.number().default(0),
  highestScore: z.number().default(0),
  lowestScore: z.number().default(0),
  passCount: z.number().default(0),
  failCount: z.number().default(0),
  passRate: z.number().default(0),
  gradeDistribution: z.record(z.string(), z.number()).default({}),
});

export type ClassGradeStatsDto = z.infer<typeof ClassGradeStatsSchema>;

export const GradebookMatrixSchema = z.object({
  classId: z.number(),
  className: z.string(),
  classCode: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  month: z.string(),
  academicYear: z.string(),
  semester: z.string(),
  gradingRule: GradingRuleSchema,
  rows: z.array(GradebookMatrixRowSchema),
  classStats: ClassGradeStatsSchema,
});

export type GradebookMatrixDto = z.infer<typeof GradebookMatrixSchema>;

export const ReportCardComponentScoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxScore: z.number(),
  weight: z.number(),
  rawScore: z.number(),
  weightedScore: z.number(),
});

export const StudentReportCardSchema = z.object({
  studentId: z.number(),
  studentCode: z.string().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  firstNameKm: z.string().nullable().optional(),
  lastNameKm: z.string().nullable().optional(),
  gender: z.string(),
  classId: z.number(),
  className: z.string(),
  month: z.string(),
  academicYear: z.string(),
  semester: z.string(),
  components: z.array(ReportCardComponentScoreSchema),
  totalRawScore: z.number(),
  totalWeightedScore: z.number(),
  percentage: z.number(),
  gradeLetter: z.string(),
  rank: z.number().nullable().optional(),
  totalStudents: z.number(),
  feedback: z.string().nullable().optional(),
  attendanceSummary: z
    .object({
      presentDays: z.number(),
      absentDays: z.number(),
      lateDays: z.number(),
      attendanceRate: z.number(),
    })
    .optional(),
});

export type StudentReportCardDto = z.infer<typeof StudentReportCardSchema>;
