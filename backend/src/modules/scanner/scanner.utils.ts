import { createHash } from 'crypto';

export function makeFingerprint(parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex');
}