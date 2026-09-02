import { verificationRepository } from './verification.repository';
import { CreateVerificationInput } from './verification.types';
import { auditService } from '../audit';
import { taskService } from '../task';

export const verificationService = {
  create: async (orgId: string, actorId: string, data: CreateVerificationInput) => {
    const task = await taskService.get(data.taskId, orgId);
    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const verification = await verificationRepository.create(orgId, actorId, data);

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'Verification',
      entityId: verification.id
    });

    return verification;
  },

  getByTaskId: async (taskId: string, orgId: string) => {
    return verificationRepository.findByTaskId(taskId, orgId);
  }
};