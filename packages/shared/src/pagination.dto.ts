import z from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(10),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;
