import { evidenceRepository } from './evidence.repository';
import { CreateEvidenceInput } from './evidence.types';

import { auditService } from '../audit';
import { findingService } from '../finding';

export const evidenceService = {
  create: async (orgId: string, actorId: string, data: CreateEvidenceInput) => {
    const finding = await findingService.get(data.findingId, orgId);
    if (!finding) {
      throw new Error('Finding not found or access denied');
    }

    const evidence = await evidenceRepository.create(orgId, data);

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'Evidence',
      entityId: evidence.id
    });

    return evidence;
  },

  getByFindingId: async (findingId: string, orgId: string) => {
    return evidenceRepository.findByFindingId(findingId, orgId);
  }
};