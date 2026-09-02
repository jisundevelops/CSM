import { assetRepository } from './asset.repository';
import { CreateAssetInput, UpdateAssetInput } from './asset.types';
import { auditService } from '../audit';

export const assetService = {
  list: async (orgId: string) => {
    return assetRepository.findByOrg(orgId);
  },

  get: async (id: string, orgId: string) => {
    return assetRepository.findById(id, orgId);
  },

  create: async (orgId: string, actorId: string, data: CreateAssetInput) => {
    const asset = await assetRepository.create(orgId, data);

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'Asset',
      entityId: asset.id
    });

    return asset;
  },

  update: async (id: string, orgId: string, actorId: string, data: UpdateAssetInput) => {
    const result = await assetRepository.update(id, orgId, data);

    if (result.count === 0) {
      throw new Error('Asset not found or access denied');
    }

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'UPDATE',
      entityType: 'Asset',
      entityId: id
    });

    return assetRepository.findById(id, orgId);
  },

  delete: async (id: string, orgId: string, actorId: string) => {
    const result = await assetRepository.delete(id, orgId);

    if (result.count === 0) {
      throw new Error('Asset not found or access denied');
    }

    await auditService.log({
      organizationId: orgId,
      actorId,
      action: 'DELETE',
      entityType: 'Asset',
      entityId: id
    });
  }
};