import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = scryptSync(password, salt, 64);

  return `${salt}:${derivedKey.toString('hex')}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');

  if (!salt || !key) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);

  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}
