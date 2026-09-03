import { scanners } from './scanners';
import { normalizeAndUpsertFinding } from './scanner.normalizer';
import { ScanResult, ScanSummary } from './scanner.types';
import { assetService } from '../asset';

export const scannerService = {
  runScan: async (orgId: string, actorId: string, assetId: string): Promise<ScanSummary> => {
    const startedAt = new Date().toISOString();

    const asset = await assetService.get(assetId, orgId);
    if (!asset) {
      throw new Error('Asset not found or access denied');
    }

    const applicableScanners = scanners.filter(s =>
      s.supportedAssetTypes.includes(asset.type)
    );

    if (applicableScanners.length === 0) {
      return {
        assetId: asset.id,
        startedAt,
        finishedAt: new Date().toISOString(),
        results: [],
        totalCreated: 0,
        totalUpdated: 0,
      };
    }

    const results: ScanResult[] = [];
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const scanner of applicableScanners) {
      const scanResult: ScanResult = {
        scanner: scanner.name,
        created: 0,
        updated: 0,
        errors: [],
        findingIds: [],
      };

      try {
        const canonicalFindings = await scanner.run({
          id: asset.id,
          type: asset.type,
          identifier: asset.identifier,
          organizationId: orgId,
        });

        for (const canonical of canonicalFindings) {
          try {
            const { findingId, created } = await normalizeAndUpsertFinding(
              orgId,
              actorId,
              canonical
            );
            scanResult.findingIds.push(findingId);
            if (created) {
              scanResult.created++;
              totalCreated++;
            } else {
              scanResult.updated++;
              totalUpdated++;
            }
          } catch (err: any) {
            scanResult.errors.push(
              `Failed to upsert finding "${canonical.title}": ${err?.message || String(err)}`
            );
          }
        }
      } catch (err: any) {
        scanResult.errors.push(`Scanner failed: ${err?.message || String(err)}`);
      }

      results.push(scanResult);
    }

    return {
      assetId: asset.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      results,
      totalCreated,
      totalUpdated,
    };
  },
};