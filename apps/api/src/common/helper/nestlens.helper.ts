import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';

/**
 * Checks if the given URL string belongs to NestLens routes.
 */
export function isNestLensUrl(url?: string): boolean {
  return typeof url === 'string' && url.includes('nestlens');
}

/**
 * Checks if the execution context or arguments host is targeting a NestLens route.
 */
export function isNestLensRequest(
  context: ExecutionContext | ArgumentsHost,
): boolean {
  if (context.getType() === 'http') {
    const request = context.switchToHttp().getRequest();
    const url = request?.originalUrl || request?.url || request?.path || '';
    return isNestLensUrl(url);
  }
  return false;
}
