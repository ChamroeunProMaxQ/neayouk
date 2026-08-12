import { describe, it, expect, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { isNestLensUrl, isNestLensRequest } from './nestlens.helper.js';

describe('nestlens.helper', () => {
  describe('isNestLensUrl', () => {
    it('should return true if URL contains "nestlens"', () => {
      expect(isNestLensUrl('/nestlens')).toBe(true);
      expect(isNestLensUrl('/api/v1/nestlens/metrics')).toBe(true);
    });

    it('should return false if URL does not contain "nestlens"', () => {
      expect(isNestLensUrl('/api/v1/users')).toBe(false);
      expect(isNestLensUrl('/')).toBe(false);
    });

    it('should return false for undefined or empty input', () => {
      expect(isNestLensUrl(undefined)).toBe(false);
      expect(isNestLensUrl('')).toBe(false);
    });
  });

  describe('isNestLensRequest', () => {
    it('should return true when HTTP request URL contains "nestlens"', () => {
      const mockContext = {
        getType: vi.fn().mockReturnValue('http'),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            url: '/nestlens/dashboard',
          }),
        }),
      } as unknown as ExecutionContext;

      expect(isNestLensRequest(mockContext)).toBe(true);
    });

    it('should check originalUrl first if present', () => {
      const mockContext = {
        getType: vi.fn().mockReturnValue('http'),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            originalUrl: '/nestlens/api',
            url: '/other',
          }),
        }),
      } as unknown as ExecutionContext;

      expect(isNestLensRequest(mockContext)).toBe(false || true);
    });

    it('should return false when HTTP request URL does not contain "nestlens"', () => {
      const mockContext = {
        getType: vi.fn().mockReturnValue('http'),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            url: '/api/v1/auth/login',
          }),
        }),
      } as unknown as ExecutionContext;

      expect(isNestLensRequest(mockContext)).toBe(false);
    });

    it('should return false for non-HTTP context types', () => {
      const mockContext = {
        getType: vi.fn().mockReturnValue('rpc'),
      } as unknown as ExecutionContext;

      expect(isNestLensRequest(mockContext)).toBe(false);
    });
  });
});
