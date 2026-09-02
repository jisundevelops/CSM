import { taskRepository } from './task.repository';
import { CreateTaskInput, UpdateTaskInput } from './task.types';
import { auditService } from '../audit';
import { findingService } from '../finding';

export const taskService = {
  list: async (orgId: string) => {
    return taskRepository.findByOrg(orgId);
  },

  get: async (id: string, orgId: string) => {
    return taskRepository.findById(id, orgId);
  },

  create: async (orgId: string, actorId: string, data: CreateTaskInput) => {
    const finding = await findingService.get(data.findingId, orgId);
    if (!finding) {
      throw new Error('Finding not found or access denied');
    }

    const status = data.status || (data.assignedTo ? 'assigned' : 'open');

    const task = await taskRepository.create(orgId, {
      ...data,
      status
    });

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task.id
    });

    return taskRepository.findById(task.id, orgId);
  },

  update: async (id: string, orgId: string, actorId: string, data: UpdateTaskInput) => {
    const result = await taskRepository.update(id, orgId, data);
    if (result.count === 0) {
      throw new Error('Task not found or access denied');
    }

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'UPDATE',
      entityType: 'Task',
      entityId: id
    });

    return taskRepository.findById(id, orgId);
  }
};