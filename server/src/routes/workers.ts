import { Router } from 'express';
import type { Role, Shift } from '../types.js';
import {
  getAllWorkers,
  getAllWorkersWithAvailability,
  getWorkerById,
  getAvailableWorkers,
  getWorkerAvailability,
  addAvailabilityOverride,
  createWorker,
  updateWorker,
  deleteWorker,
} from '../services/workers.js';

const router = Router();

// GET /api/workers — list all workers, optionally filtered by ?role=
router.get('/', (req, res) => {
  const role = req.query.role as Role | undefined;
  const workers = getAllWorkers(role);
  res.json(workers);
});

// GET /api/workers/with-availability — workers + weekly availability array
router.get('/with-availability', (req, res) => {
  const role = req.query.role as Role | undefined;
  const includeInactive = req.query.includeInactive === 'true';
  const result = getAllWorkersWithAvailability(role, includeInactive);
  res.json(result);
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

// POST /api/workers — create a new worker
router.post('/', (req, res) => {
  const { name, role, isPartTime, phone, hireDate, notes, weeklyAvailability } = req.body;
  if (!name || !role || !phone || !hireDate) {
    res.status(400).json({ error: 'name, role, phone, and hireDate are required' });
    return;
  }
  const worker = createWorker({ name, role, isPartTime: !!isPartTime, phone, hireDate, notes, weeklyAvailability });
  res.status(201).json(worker);
});

// PATCH /api/workers/:id — update a worker
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid worker ID' });
    return;
  }
  const updated = updateWorker(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Worker not found' });
    return;
  }
  res.json(updated);
});

// DELETE /api/workers/:id — delete a worker
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid worker ID' });
    return;
  }
  const deleted = deleteWorker(id);
  if (!deleted) {
    res.status(404).json({ error: 'Worker not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
