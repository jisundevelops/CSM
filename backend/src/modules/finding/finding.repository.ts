import prisma from '../../shared/prisma';
import { CreateFindingInput, UpdateFindingInput } from './finding.types';

export const findingRepository = {
  findByOrg: async (orgId: string) => {
    return prisma.finding.findMany({
      where: { organizationId: orgId },
      orderBy: { lastSeen: 'desc' },
      include: {
        asset: { select: { id: true, identifier: true, criticality: true } },
        risks: { select: { id: true, score: true } }
      }
    });
  },

  findById: async (id: string, orgId: string) => {
    return prisma.finding.findFirst({
      where: { id, organizationId: orgId },
      include: {
        asset: true,
        risks: true,
        tasks: true,
        evidences: true
      }
    });
  },

  findByFingerprint: async (fingerprint: string, orgId: string) => {
    return prisma.finding.findFirst({
      where: { fingerprint, organizationId: orgId }
    });
  },

  create: async (orgId: string, data: CreateFindingInput) => {
    return prisma.finding.create({
      data: {
        organizationId: orgId,
        assetId: data.assetId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        confidence: data.confidence,
        status: data.status || 'open',
        scannerSource: data.scannerSource || 'manual',
        fingerprint: data.fingerprint || `manual-${Date.now()}`,
        rawEvidence: data.rawEvidence
      }
    });
  },

  update: async (id: string, orgId: string, data: UpdateFindingInput) => {
    return prisma.finding.updateMany({
      where: { id, organizationId: orgId },
      data
    });
  },

  delete: async (id: string, orgId: string) => {
    return prisma.finding.deleteMany({
      where: { id, organizationId: orgId }
    });
  }
};