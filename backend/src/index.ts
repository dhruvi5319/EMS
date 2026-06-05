import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import { apiRouter } from './routes';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check — no auth required
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded files (dev only — in prod, use S3/CDN)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api', apiRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(config.port, () => {
  console.log(`EMS backend listening on port ${config.port}`);
});

export { app, server };
