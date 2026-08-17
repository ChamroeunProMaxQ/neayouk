import z from "zod";
import { PaginationSchema, createSortSchema } from "./pagination.dto.js";

export const ProgramStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export type ProgramStatusType = z.infer<typeof ProgramStatusEnum>;

export const ProgramSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  code: z.string(),
  books: z.array(z.string()).default([]),
  gradeLevels: z.array(z.string()).default([]),
  status: ProgramStatusEnum.default("ACTIVE"),
  classCount: z.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateProgramSchema = z.object({
  name: z.string().min(1, "Program name is required").max(255),
  code: z.string().min(1, "Program code is required").max(50),
  books: z.array(z.string()).default([]).optional(),
  gradeLevels: z.array(z.string()).default([]).optional(),
  status: ProgramStatusEnum.default("ACTIVE").optional(),
});

export const UpdateProgramSchema = CreateProgramSchema.partial();

export const FindProgramsSchema = PaginationSchema.extend({
  ...createSortSchema(
    ["id", "name", "code", "status", "updatedAt"],
    "id"
  ),
  search: z.string().optional(),
  status: ProgramStatusEnum.optional(),
});

export type ProgramAttribute = z.infer<typeof ProgramSchema>;
export type CreateProgramDto = z.infer<typeof CreateProgramSchema>;
export type UpdateProgramDto = z.infer<typeof UpdateProgramSchema>;
export type FindProgramsDto = z.infer<typeof FindProgramsSchema>;
