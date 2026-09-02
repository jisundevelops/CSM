import prisma from '../../shared/prisma';
import { CreateTaskInput, UpdateTaskInput } from './task.types';

export const taskRepository = {
  findByOrg: async (orgId: string) => {
    return prisma.task.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      include: {
        finding: {
          select: { id: true, title: true, severity: true, status: true }
        },
        assignee: {
          select: { id: true, email: true }
        },
        verifications: {
          orderBy: { verifiedAt: 'desc' },
          take: 1,
          select: { id: true, result: true, verifiedAt: true }
        }
      }
    });
  },

  findById: async (id: string, orgId: string) => {
    return prisma.task.findFirst({
      where: { id, organizationId: orgId },
      include: {
        finding: true,
        assignee: { select: { id: true, email: true } },
        verifications: { orderBy: { verifiedAt: 'desc' } }
      }
    });
  },

  create: async (orgId: string, data: CreateTaskInput) => {
    return prisma.task.create({
      data: {
        organizationId: orgId,
        findingId: data.findingId,
        assignedTo: data.assignedTo,
        status: data.status
      }
    });
  },

  update: async (id: string, orgId: string, data: UpdateTaskInput) => {
    return prisma.task.updateMany({
      where: { id, organizationId: orgId },
      data
    });
  }
};