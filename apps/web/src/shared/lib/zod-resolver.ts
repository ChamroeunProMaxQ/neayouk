import type { ZodType } from "zod";
import type { FieldErrors, Resolver } from "react-hook-form";

/**
 * Custom Zod resolver compatible with both Zod v3 and Zod v4.
 *
 * NOTE: In Zod v4, validation issues are stored on `result.error.issues`
 * (whereas Zod v3 stored them on `result.error.errors`).
 * Standard `@hookform/resolvers/zod` looks for `result.error.errors`, which evaluates
 * to `undefined` in Zod v4, causing the resolver to return `{ errors: {} }` (empty errors)
 * and silently halt submission without rendering error messages.
 */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends Record<string, any>>(
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<T, any, any> | ZodType<T>
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data as T,
        errors: {},
      };
    }

    const errorObj = result.error as unknown as {
      issues?: { path: (string | number)[]; code?: string; message: string }[];
      errors?: { path: (string | number)[]; code?: string; message: string }[];
    };
    const issues = errorObj.issues ?? errorObj.errors ?? [];
    const errors: Record<string, { type: string; message: string }> = {};

    for (const issue of issues) {
      const fieldName = issue.path.join(".");
      if (fieldName && !errors[fieldName]) {
        errors[fieldName] = {
          type: issue.code || "validation",
          message: issue.message,
        };
      }
    }

    return {
      values: {},
      errors: errors as FieldErrors<T>,
    };
  };
}
