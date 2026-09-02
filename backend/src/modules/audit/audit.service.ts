import { auditRepository } from './audit.repository';
import { CreateAuditLogInput } from './audit.types';

export const auditService = {
  log: async (data: CreateAuditLogInput) => {
    return auditRepository.create(data);
  },

  getLogs: async (organizationId: string, entityType?: string) => {
    return auditRepository.findByOrganization(organizationId, entityType);
  }
};