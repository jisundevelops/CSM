import prisma from '../../shared/prisma';
import { CreateRiskInput } from './risk.types';

export const riskRepository = {
  create: async (data: CreateRiskInput) => {
    return prisma.risk.create({ data });
  },

  findByFindingId: async (findingId: string, orgId: string) => {
    return prisma.risk.findFirst({
      where: { findingId, organizationId: orgId }
    });
  }
};