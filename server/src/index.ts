import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import workersRouter from './routes/workers.js';
import templatesRouter from './routes/templates.js';
import assignmentsRouter from './routes/assignments.js';
import scheduleRouter from './routes/schedule.js';
import sessionRouter from './routes/session.js';
import chatRouter from './routes/chat.js';
import { removeAvailabilityOverride } from './services/workers.js';
import { initDatabase } from './db/init.js';

dotenv.config({ path: '../.env' });

// --- Auto-initialize database on startup ---
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS ---
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(','),
  credentials: true,
}));

app.use(express.json());

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Top-level route for deleting availability overrides ---
app.delete('/api/availability-overrides/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid override ID' });
    return;
  }
  removeAvailabilityOverride(id);
  res.status(204).end();
});

// --- Route modules ---
app.use('/api/workers', workersRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/session', sessionRouter);
app.use('/api/chat', chatRouter);

// --- Serve client static files in production ---
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// --- Error handling middleware ---
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  },
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
