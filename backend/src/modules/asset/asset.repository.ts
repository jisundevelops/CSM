import prisma from '../../shared/prisma';
import { CreateAssetInput, UpdateAssetInput } from './asset.types';

export const assetRepository = {
  findByOrg: async (orgId: string) => {
    return prisma.asset.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { findings: true } }
      }
    });
  },

  findById: async (id: string, orgId: string) => {
    return prisma.asset.findFirst({
      where: { id, organizationId: orgId }
    });
  },

  create: async (orgId: string, data: CreateAssetInput) => {
    return prisma.asset.create({
      data: {
        organizationId: orgId,
        ...data
      }
    });
  },

  update: async (id: string, orgId: string, data: UpdateAssetInput) => {
    return prisma.asset.updateMany({
      where: { id, organizationId: orgId },
      data
    });
  },

  delete: async (id: string, orgId: string) => {
    return prisma.asset.deleteMany({
      where: { id, organizationId: orgId }
    });
  }
};