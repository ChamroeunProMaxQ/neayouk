import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";

export function useUrlFilters<T extends z.ZodType>(
    schema: T
) {
    const [searchParams, setSearchParams] = useSearchParams();

    const values = useMemo(() => {
        const raw = Object.fromEntries(searchParams.entries());

        return schema.parse(raw);
    }, [schema, searchParams]);

    const setValues = useCallback(
        (updates: Partial<z.infer<T>>) => {
            setSearchParams((current) => {
                const next = new URLSearchParams(current);

                for (const [key, value] of Object.entries(updates)) {
                    if (value === undefined || value === null || value === "") {
                        next.delete(key);
                        continue;
                    }

                    next.set(key, String(value));
                }

                return next;
            });
        },
        [setSearchParams],
    );

    const setValue = useCallback(
        <K extends keyof z.infer<T>>(
            key: K,
            value: z.infer<T>[K],
        ) => {
            setSearchParams((current) => {
                const next = new URLSearchParams(current);

                if (value === undefined || value === null || value === "") {
                    next.delete(String(key));
                } else {
                    next.set(String(key), String(value));
                }

                return next;
            });
        },
        [setSearchParams],
    );

    const reset = useCallback(() => {
        setSearchParams({});
    }, [setSearchParams])

    return {
        values,
        setValue,
        setValues,
        reset,
    };
}