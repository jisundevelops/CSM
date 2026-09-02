import { Router, Request, Response } from 'express';
import { verificationService } from './verification.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;
    if (!taskId) {
      return res.status(400).json({ error: 'taskId query parameter is required' });
    }

    const verifications = await verificationService.getByTaskId(
      taskId as string,
      req.user!.organizationId
    );
    res.json(verifications);
  } catch (error) {
    console.error('Failed to list verifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { taskId, result } = req.body;
    if (!taskId || !result) {
      return res.status(400).json({ error: 'taskId and result are required' });
    }

    const verification = await verificationService.create(
      req.user!.organizationId,
      req.user!.id,
      { taskId, result }
    );
    res.status(201).json(verification);
  } catch (error: any) {
    if (error.message === 'Task not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to create verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;