import { Router } from 'express';
import type { Role, Shift } from '../types.js';
import {
  getAllWorkers,
  getWorkerById,
  getAvailableWorkers,
  getWorkerAvailability,
  addAvailabilityOverride,
} from '../services/workers.js';

const router = Router();

// GET /api/workers — list all workers, optionally filtered by ?role=
router.get('/', (req, res) => {
  const role = req.query.role as Role | undefined;
  const workers = getAllWorkers(role);
  res.json(workers);
});

// GET /api/workers/available — must be registered BEFORE /:id
router.get('/available', (req, res) => {
  const { date, shift, role } = req.query;
  if (!date || !shift || !role) {
    res.status(400).json({ error: 'date, shift, and role query params are required' });
    return;
  }
  const workers = getAvailableWorkers(
    date as string,
    shift as Shift,
    role as Role,
  );
  res.json(workers);
});

// GET /api/workers/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid worker ID' });
    return;
  }
  const result = getWorkerById(id);
  if (!result) {
    res.status(404).json({ error: 'Worker not found' });
    return;
  }
  res.json(result);
});

// GET /api/workers/:id/availability
router.get('/:id/availability', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid worker ID' });
    return;
  }
  const result = getWorkerAvailability(id);
  res.json(result);
});

// POST /api/workers/:id/availability-overrides
router.post('/:id/availability-overrides', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid worker ID' });
    return;
  }
  const { date, isAvailable, reason } = req.body;
  if (!date || typeof isAvailable !== 'boolean') {
    res.status(400).json({ error: 'date and isAvailable are required' });
    return;
  }
  const override = addAvailabilityOverride(id, date, isAvailable, reason);
  res.status(201).json(override);
});

export default router;
