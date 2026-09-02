import { Router, Request, Response } from 'express';
import { taskService } from './task.service';
import { authMiddleware } from '../../shared/middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.list(req.user!.organizationId);
    res.json(tasks);
  } catch (error) {
    console.error('Failed to list tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await taskService.get(req.params.id, req.user!.organizationId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Failed to get task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { findingId, assignedTo, status } = req.body;
    if (!findingId) {
      return res.status(400).json({ error: 'findingId is required' });
    }

    const task = await taskService.create(
      req.user!.organizationId,
      req.user!.id,
      { findingId, assignedTo, status }
    );
    res.status(201).json(task);
  } catch (error: any) {
    if (error.message === 'Finding not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to create task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { assignedTo, status } = req.body;

    const validStatuses = ['open', 'assigned', 'fixing', 'verification', 'verified', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const task = await taskService.update(
      req.params.id,
      req.user!.organizationId,
      req.user!.id,
      { assignedTo, status }
    );
    res.json(task);
  } catch (error: any) {
    if (error.message === 'Task not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to update task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;