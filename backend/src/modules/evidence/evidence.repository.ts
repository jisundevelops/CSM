import prisma from '../../shared/prisma';
import { CreateEvidenceInput } from './evidence.types';

export const evidenceRepository = {
  create: async (orgId: string, data: CreateEvidenceInput) => {
    return prisma.evidence.create({
      data: {
        organizationId: orgId,
        findingId: data.findingId,
        type: data.type,
        content: data.content
      }
    });
  },

  findByFindingId: async (findingId: string, orgId: string) => {
    return prisma.evidence.findMany({
      where: { findingId, organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });
  }
};