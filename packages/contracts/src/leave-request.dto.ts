import { z } from "zod";
import { createSortSchema, PaginationSchema } from "./pagination.dto.js";
import {
  LeaveTypeEnum,
  LeaveStatusEnum,
} from "./attendance-status.enum.js";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const LeaveRequestSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  teacherId: z.number(),
  teacherName: z.string().optional(),
  teacherCode: z.string().nullable().optional(),
  userId: z.number().nullable().optional(),
  leaveType: z.nativeEnum(LeaveTypeEnum).default(LeaveTypeEnum.CASUAL),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.coerce.number().default(1),
  reason: z.string(),
  attachmentUrl: z.string().nullable().optional(),
  status: z.nativeEnum(LeaveStatusEnum).default(LeaveStatusEnum.PENDING),
  reviewerId: z.number().nullable().optional(),
  reviewerName: z.string().nullable().optional(),
  reviewedAt: z.date().or(z.string()).nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
});

export type LeaveRequestAttribute = z.infer<typeof LeaveRequestSchema>;

export const CreateLeaveRequestSchema = z
  .object({
    teacherId: z.coerce.number(),
    leaveType: z.nativeEnum(LeaveTypeEnum).default(LeaveTypeEnum.CASUAL),
    startDate: z.string().regex(dateRegex, "Start date must be in YYYY-MM-DD format"),
    endDate: z.string().regex(dateRegex, "End date must be in YYYY-MM-DD format"),
    totalDays: z.coerce.number().min(0.5, "Total days must be at least 0.5").default(1),
    reason: z.string().min(3, "Reason must be at least 3 characters"),
    attachmentUrl: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

export type CreateLeaveRequestDto = z.infer<typeof CreateLeaveRequestSchema>;

export const UpdateLeaveRequestSchema = z
  .object({
    teacherId: z.coerce.number().optional(),
    leaveType: z.nativeEnum(LeaveTypeEnum).optional(),
    startDate: z.string().regex(dateRegex, "Start date must be in YYYY-MM-DD format").optional(),
    endDate: z.string().regex(dateRegex, "End date must be in YYYY-MM-DD format").optional(),
    totalDays: z.coerce.number().min(0.5).optional(),
    reason: z.string().min(3).optional(),
    attachmentUrl: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

export type UpdateLeaveRequestDto = z.infer<typeof UpdateLeaveRequestSchema>;

export const ReviewLeaveRequestSchema = z.object({
  status: z.enum([LeaveStatusEnum.APPROVED, LeaveStatusEnum.REJECTED]),
  rejectionReason: z.string().optional().nullable(),
  syncAttendance: z.boolean().default(true).optional(),
});

export type ReviewLeaveRequestDto = z.infer<typeof ReviewLeaveRequestSchema>;

export const FindLeaveRequestsSchema = PaginationSchema.extend({
  ...createSortSchema(['id', 'startDate', 'endDate', 'totalDays', 'status', 'createdAt'], 'createdAt'),
  teacherId: z.coerce.number().optional(),
  leaveType: z.nativeEnum(LeaveTypeEnum).optional(),
  status: z.nativeEnum(LeaveStatusEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

export type FindLeaveRequestsDto = z.infer<typeof FindLeaveRequestsSchema>;
