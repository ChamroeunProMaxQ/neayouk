import z from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().default(1).optional(),
  pageSize: z.coerce.number().default(10).optional(),
});

export function createSortSchema<const T extends readonly string[]>(
  attributes: T,
  defaultSortField?: T[number],
) {
  return z.object({
    sortBy: z.enum(attributes).default(defaultSortField ?? attributes[0]),
    sortOrder: z
      .enum(["ASC", "DESC", "asc", "desc"])
      .transform((value) => value.toUpperCase() as "ASC" | "DESC")
      .default("DESC"),
  }).shape;
}

export type PaginationDto = z.infer<typeof PaginationSchema>;
