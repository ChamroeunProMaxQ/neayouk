import type { ValueTransformer } from 'typeorm';

/**
 * TypeORM ValueTransformer for JSON array columns (e.g. string[] in MySQL JSON/TEXT).
 * Ensures clean serialization when writing to DB and parsing when reading from DB.
 */
export const jsonArrayTransformer: ValueTransformer = {
  to: (value: string[] | string | null | undefined) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  },
  from: (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  },
};
