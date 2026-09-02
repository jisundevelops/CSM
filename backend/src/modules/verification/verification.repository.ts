import prisma from '../../shared/prisma';
import { CreateVerificationInput } from './verification.types';

export const verificationRepository = {
  create: async (orgId: string, actorId: string, data: CreateVerificationInput) => {
    return prisma.verification.create({
      data: {
        organizationId: orgId,
        taskId: data.taskId,
        verifiedBy: actorId,
        result: data.result
      }
    });
  },

  findByTaskId: async (taskId: string, orgId: string) => {
    return prisma.verification.findMany({
      where: { taskId, organizationId: orgId },
      orderBy: { verifiedAt: 'desc' }
    });
  }
};