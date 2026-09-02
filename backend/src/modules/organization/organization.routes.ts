import { Router, Request, Response } from 'express';
import { organizationService } from './organization.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const org = await organizationService.getCurrentOrg(req.user!.organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await organizationService.getMembers(req.user!.organizationId);
    res.json(members);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/members', async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
    }

    const newMember = await organizationService.addMember(
      req.user!.organizationId,
      req.user!.id,
      { email, password, role }
    );

    res.status(201).json(newMember);
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Failed to add member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;