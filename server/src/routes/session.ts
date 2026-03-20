import { Router } from 'express';

const router = Router();

// GET /api/session
router.get('/', (_req, res) => {
  res.json({ name: 'Demo Manager', role: 'manager' });
});

export default router;
