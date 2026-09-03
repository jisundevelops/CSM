import { findingRepository } from './finding.repository';
import { CreateFindingInput, UpdateFindingInput } from './finding.types';

import { auditService } from '../audit';
import { assetService } from '../asset';
import { riskService } from '../risk';

interface CanonicalFinding {
  asset_id: string;
  scanner_source: string;
  fingerprint: string;
  title: string;
  description: string | null;
  severity: string;
  confidence: string;
  status: string;
  raw_evidence: any;
}

export const findingService = {
  list: async (orgId: string) => {
    return findingRepository.findByOrg(orgId);
  },

  get: async (id: string, orgId: string) => {
    return findingRepository.findById(id, orgId);
  },

  create: async (orgId: string, actorId: string, data: CreateFindingInput) => {
    const asset = await assetService.get(data.assetId, orgId);
    if (!asset) {
      throw new Error('Asset not found or access denied');
    }

    const finding = await findingRepository.create(orgId, {
      ...data,
      status: data.status || 'open',
      scannerSource: data.scannerSource || 'manual',
      fingerprint: data.fingerprint || `manual-${Date.now()}`
    });

    await riskService.calculateAndCreate(orgId, finding.id, data.severity, asset.criticality);

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'Finding',
      entityId: finding.id
    });

    return findingRepository.findById(finding.id, orgId);
  },

  update: async (id: string, orgId: string, actorId: string, data: UpdateFindingInput) => {
    const result = await findingRepository.update(id, orgId, data);
    if (result.count === 0) {
      throw new Error('Finding not found or access denied');
    }

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'UPDATE',
      entityType: 'Finding',
      entityId: id
    });

    return findingRepository.findById(id, orgId);
  },

  delete: async (id: string, orgId: string, actorId: string) => {
    const result = await findingRepository.delete(id, orgId);
    if (result.count === 0) {
      throw new Error('Finding not found or access denied');
    }

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'DELETE',
      entityType: 'Finding',
      entityId: id
    });
  },

  upsertByFingerprint: async (
    orgId: string,
    actorId: string,
    data: CanonicalFinding
  ): Promise<{ finding: any; created: boolean }> => {
    const existing = await findingRepository.findByFingerprint(data.fingerprint, orgId);

    if (existing) {
      await findingRepository.update(existing.id, orgId, {
        lastSeen: new Date(),
        rawEvidence: data.raw_evidence
      });

      await auditService.log({
        organizationId: orgId,
        actorId,
        action: 'UPDATE',
        entityType: 'Finding',
        entityId: existing.id
      });

      return { finding: existing, created: false };
    } else {
      const asset = await assetService.get(data.asset_id, orgId);
      if (!asset) {
        throw new Error('Asset not found or access denied');
      }

      const finding = await findingRepository.create(orgId, {
        assetId: data.asset_id,
        scannerSource: data.scanner_source,
        fingerprint: data.fingerprint,
        title: data.title,
        description: data.description || undefined,
        severity: data.severity,
        confidence: data.confidence,
        status: data.status,
        rawEvidence: data.raw_evidence
      });

      await riskService.calculateAndCreate(orgId, finding.id, data.severity, asset.criticality);

      await auditService.log({
        organizationId: orgId,
        actorId,
        action: 'CREATE',
        entityType: 'Finding',
        entityId: finding.id
      });

      return { finding, created: true };
    }
  }
};