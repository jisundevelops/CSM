import bcrypt from 'bcrypt';
import { organizationRepository } from './organization.repository';
import { AddMemberInput } from './organization.types';
import { auditService } from '../audit';

export const organizationService = {
  getCurrentOrg: async (orgId: string) => {
    return organizationRepository.findOrgById(orgId);
  },

  getMembers: async (orgId: string) => {
    return organizationRepository.findUsersByOrgId(orgId);
  },

  addMember: async (orgId: string, actorId: string, data: AddMemberInput) => {
    const existingUser = await organizationRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await organizationRepository.createUserInOrg(
      orgId,
      data.email,
      passwordHash,
      data.role
    );

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id
    });

    return newUser;
  }
};