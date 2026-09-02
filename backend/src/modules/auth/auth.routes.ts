import { Router, Request, Response } from 'express';
import { authService } from './auth.service';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, orgName } = req.body;

    if (!email || !password || !orgName) {
      return res.status(400).json({ error: 'Email, password, and orgName are required' });
    }

    const result = await authService.register({ email, password, orgName });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;