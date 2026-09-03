import { CanonicalFinding } from './scanner.types';
import { findingService } from '../finding';

export async function normalizeAndUpsertFinding(
  orgId: string,
  actorId: string,
  canonical: CanonicalFinding
): Promise<{ findingId: string; created: boolean }> {
  const result = await findingService.upsertByFingerprint(orgId, actorId, canonical);
  return {
    findingId: result.finding.id,
    created: result.created
  };
}