import { Router, Request, Response } from 'express';
import { scannerService } from './scanner.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/run', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body;
    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }

    const summary = await scannerService.runScan(
      req.user!.organizationId,
      req.user!.id,
      assetId
    );

    res.status(200).json(summary);
  } catch (error: any) {
    if (error.message === 'Asset not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to run scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;