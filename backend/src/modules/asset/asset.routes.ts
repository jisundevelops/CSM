import { Router, Request, Response } from 'express';
import { assetService } from './asset.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const assets = await assetService.list(req.user!.organizationId);
    res.json(assets);
  } catch (error) {
    console.error('Failed to list assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await assetService.get(req.params.id, req.user!.organizationId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Failed to get asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, identifier, criticality } = req.body;
    if (!type || !identifier || !criticality) {
      return res.status(400).json({ error: 'type, identifier, and criticality are required' });
    }

    const asset = await assetService.create(
      req.user!.organizationId,
      req.user!.id,
      { type, identifier, criticality }
    );
    res.status(201).json(asset);
  } catch (error) {
    console.error('Failed to create asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { type, identifier, criticality } = req.body;

    const asset = await assetService.update(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      { type, identifier, criticality }
    );
    res.json(asset);
  } catch (error: any) {
    if (error.message === 'Asset not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to update asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await assetService.delete(
      req.params.id,
      req.user!.organizationId,
      req.user!.id
    );
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Asset not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to delete asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;