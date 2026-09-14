import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret =
    process.env.APP_SECRET ||
    process.env.JWT_SECRET ||
    'neayouk-super-secure-default-encryption-key-2026';
  return scryptSync(secret, 'neayouk-salt-2026', 32);
}

export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(cipherText: string): string {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText; // Fallback if plain

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function maskToken(token: string): string {
  if (!token) return '';
  if (token.includes(':')) {
    const [botId] = token.split(':');
    return `${botId}:••••••••••••••••••••••••••••••••••`;
  }
  if (token.length <= 8) {
    return '••••••••';
  }
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}
