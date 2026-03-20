import { Router } from 'express';
import type { Role, Shift } from '../types.js';
import { autoFillSchedule, fillGap, getGaps } from '../services/autofill.js';

const router = Router();

// POST /api/schedule/auto-fill
router.post('/auto-fill', (req, res) => {
  const { startDate, endDate, templateId } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate are required' });
    return;
  }
  const result = autoFillSchedule(startDate, endDate, templateId);
  res.json(result);
});

// POST /api/schedule/fill-gap
router.post('/fill-gap', (req, res) => {
  const { date, shift, role } = req.body;
  if (!date || !shift || !role) {
    res.status(400).json({ error: 'date, shift, and role are required' });
    return;
  }
  const result = fillGap(date, shift as Shift, role as Role);
  if (!result) {
    res.status(404).json({ error: 'No available worker found for this gap' });
    return;
  }
  res.json(result);
});

// GET /api/schedule/gaps
router.get('/gaps', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate query params are required' });
    return;
  }
  const result = getGaps(startDate as string, endDate as string);
  res.json(result);
});

export default router;
