import prisma from '../../shared/prisma';

export const organizationRepository = {
  findOrgById: async (id: string) => {
    return prisma.organization.findUnique({ where: { id } });
  },

  findUsersByOrgId: async (orgId: string) => {
    return prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  findUserByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  createUserInOrg: async (orgId: string, email: string, passwordHash: string, role: string) => {
    return prisma.user.create({
      data: {
        organizationId: orgId,
        email,
        passwordHash,
        role
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }
};