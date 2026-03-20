import { Router } from 'express';
import type { Role, Shift } from '../types.js';
import { getAssignments, createAssignment, deleteAssignment } from '../services/assignments.js';

const router = Router();

// GET /api/assignments — requires startDate and endDate query params
router.get('/', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate query params are required' });
    return;
  }
  const result = getAssignments(startDate as string, endDate as string);
  res.json(result);
});

// POST /api/assignments
router.post('/', (req, res) => {
  const { workerId, date, shift, role } = req.body;
  if (!workerId || !date || !shift || !role) {
    res.status(400).json({ error: 'workerId, date, shift, and role are required' });
    return;
  }
  const result = createAssignment(workerId, date, shift as Shift, role as Role);
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(result);
});

// DELETE /api/assignments/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid assignment ID' });
    return;
  }
  const result = deleteAssignment(id);
  if (!result) {
    res.status(404).json({ error: 'Assignment not found' });
    return;
  }
  res.json(result);
});

export default router;
