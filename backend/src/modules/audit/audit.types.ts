export interface CreateAuditLogInput {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
}