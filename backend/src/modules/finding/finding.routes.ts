import { Router, Request, Response } from 'express';
import { findingService } from './finding.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const findings = await findingService.list(req.user!.organizationId);
    res.json(findings);
  } catch (error) {
    console.error('Failed to list findings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const finding = await findingService.get(req.params.id, req.user!.organizationId);
    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    res.json(finding);
  } catch (error) {
    console.error('Failed to get finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { assetId, title, severity, confidence, description, scannerSource, fingerprint, rawEvidence } = req.body;

    if (!assetId || !title || !severity || !confidence) {
      return res.status(400).json({ error: 'assetId, title, severity, and confidence are required' });
    }

    const finding = await findingService.create(
      req.user!.organizationId,
      req.user!.id,
      { assetId, title, severity, confidence, description, scannerSource, fingerprint, rawEvidence }
    );
    res.status(201).json(finding);
  } catch (error: any) {
    if (error.message === 'Asset not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to create finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, confidence, status } = req.body;
    const finding = await findingService.update(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      { title, description, severity, confidence, status }
    );
    res.json(finding);
  } catch (error: any) {
    if (error.message === 'Finding not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to update finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await findingService.delete(
      req.params.id,
      req.user!.organizationId,
      req.user!.id
    );
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Finding not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to delete finding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;