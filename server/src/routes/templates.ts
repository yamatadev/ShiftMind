import { Router } from 'express';
import type { Role, Shift } from '../types.js';
import { getAllTemplates, getTemplateById, updateTemplateSlot } from '../services/templates.js';

const router = Router();

// GET /api/templates
router.get('/', (_req, res) => {
  const templates = getAllTemplates();
  res.json(templates);
});

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid template ID' });
    return;
  }
  const result = getTemplateById(id);
  if (!result) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(result);
});

// PATCH /api/templates/:id/slots
router.patch('/:id/slots', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid template ID' });
    return;
  }
  const { role, shift, requiredCount } = req.body;
  if (!role || !shift || typeof requiredCount !== 'number') {
    res.status(400).json({ error: 'role, shift, and requiredCount are required' });
    return;
  }
  const result = updateTemplateSlot(id, role as Role, shift as Shift, requiredCount);
  if (!result) {
    res.status(404).json({ error: 'Slot not found' });
    return;
  }
  res.json(result);
});

export default router;
