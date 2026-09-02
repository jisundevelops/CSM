import { Router, Request, Response } from 'express';
import { evidenceService } from './evidence.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.query;
    if (!findingId) {
      return res.status(400).json({ error: 'findingId query parameter is required' });
    }

    const evidences = await evidenceService.getByFindingId(
      findingId as string,
      req.user!.organizationId
    );
    res.json(evidences);
  } catch (error) {
    console.error('Failed to list evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { findingId, type, content } = req.body;
    if (!findingId || !type || !content) {
      return res.status(400).json({ error: 'findingId, type, and content are required' });
    }

    const evidence = await evidenceService.create(
      req.user!.organizationId,
      req.user!.id,
      { findingId, type, content }
    );
    res.status(201).json(evidence);
  } catch (error: any) {
    if (error.message === 'Finding not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to create evidence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;