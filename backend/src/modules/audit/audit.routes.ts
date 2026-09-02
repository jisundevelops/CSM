import { Router } from 'express';
import { auditService } from './audit.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const { entityType } = req.query;

    const logs = await auditService.getLogs(
      organizationId,
      entityType as string | undefined
    );

    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;