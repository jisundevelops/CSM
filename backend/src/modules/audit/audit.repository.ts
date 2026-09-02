import prisma from '../../shared/prisma';
import { CreateAuditLogInput } from './audit.types';

export const auditRepository = {
  create: async (data: CreateAuditLogInput) => {
    return prisma.auditLog.create({ data });
  },

  findByOrganization: async (organizationId: string, entityType?: string) => {
    return prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(entityType && { entityType })
      },
      orderBy: { timestamp: 'desc' },
      include: {
        actor: {
          select: { id: true, email: true }
        }
      }
    });
  }
};