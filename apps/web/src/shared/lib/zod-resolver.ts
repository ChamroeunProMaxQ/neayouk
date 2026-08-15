import type { ZodType } from "zod";
import type { Resolver } from "react-hook-form";

/**
 * Custom Zod resolver compatible with both Zod v3 and Zod v4.
 *
 * NOTE: In Zod v4, validation issues are stored on `result.error.issues`
 * (whereas Zod v3 stored them on `result.error.errors`).
 * Standard `@hookform/resolvers/zod` looks for `result.error.errors`, which evaluates
 * to `undefined` in Zod v4, causing the resolver to return `{ errors: {} }` (empty errors)
 * and silently halt submission without rendering error messages.
 */
export function zodResolver<T extends Record<string, any>>(
  schema: ZodType<T, any, any>
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const issues = result.error.issues ?? (result.error as any).errors ?? [];
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
      values: {} as any,
      errors: errors as any,
    };
  };
}
