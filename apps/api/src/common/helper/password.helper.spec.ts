import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.helper.js';

describe('password.helper', () => {
  describe('hashPassword', () => {
    it('should generate a hashed password in salt:key format', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(':');

      const parts = hash.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password due to random salt', () => {
      const password = 'mySecretPassword123';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);

      const isValid = comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for non-matching password', () => {
      const password = 'mySecretPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = hashPassword(password);

      const isValid = comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should return false for malformed stored hash', () => {
      expect(comparePassword('password', 'invalidhash')).toBe(false);
      expect(comparePassword('password', '')).toBe(false);
      expect(comparePassword('password', ':')).toBe(false);
    });
  });
});
