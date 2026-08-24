import { describe, it, expect } from 'vitest';
import { jsonArrayTransformer } from './json-transformer.helper.js';

describe('jsonArrayTransformer', () => {
  describe('to (serializing for DB)', () => {
    it('returns null for null/undefined/empty string', () => {
      expect(jsonArrayTransformer.to(null)).toBeNull();
      expect(jsonArrayTransformer.to(undefined)).toBeNull();
      expect(jsonArrayTransformer.to('')).toBeNull();
    });

    it('parses valid JSON string or wraps unparseable string', () => {
      expect(jsonArrayTransformer.to('["Book 1", "Book 2"]')).toEqual([
        'Book 1',
        'Book 2',
      ]);
      expect(jsonArrayTransformer.to('Single Item')).toEqual(['Single Item']);
    });

    it('returns array as is', () => {
      const arr = ['Level 1', 'Level 2'];
      expect(jsonArrayTransformer.to(arr)).toEqual(arr);
    });
  });

  describe('from (deserializing from DB)', () => {
    it('returns empty array for null or undefined or empty', () => {
      expect(jsonArrayTransformer.from(null)).toEqual([]);
      expect(jsonArrayTransformer.from(undefined)).toEqual([]);
    });

    it('returns array directly if already parsed by database driver', () => {
      expect(jsonArrayTransformer.from(['Book 1', 'Book 2'])).toEqual([
        'Book 1',
        'Book 2',
      ]);
    });

    it('parses JSON string into array', () => {
      expect(jsonArrayTransformer.from('["1", "2", "3"]')).toEqual([
        '1',
        '2',
        '3',
      ]);
      expect(jsonArrayTransformer.from('invalid json')).toEqual([]);
    });
  });
});
