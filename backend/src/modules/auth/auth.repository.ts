import prisma from '../../shared/prisma';

export const authRepository = {
  createUserWithOrg: async (email: string, passwordHash: string, orgName: string) => {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName }
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'admin',
          organizationId: org.id
        },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true
        }
      });

      return user;
    });
  },

  findUserByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        organizationId: true
      }
    });
  }
};