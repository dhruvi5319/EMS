import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check — required by Plan 01-03 RBAC middleware
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder — routes registered in Plan 01-03
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(config.port, () => {
  console.log(`EMS backend listening on port ${config.port}`);
});

export { app, server };
