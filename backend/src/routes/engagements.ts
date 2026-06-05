import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { listEngagements, getEngagement, updateEngagement } from '../services/engagements.service';

export const engagementsRouter = Router();
engagementsRouter.use(authenticateSession);

// GET /api/engagements — all authenticated roles; role-scoped
engagementsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { phase, status, owner_id, limit, offset } = req.query as Record<string, string>;
    const isAdmin = req.user!.roles.includes('AD');
    const result = await listEngagements({
      phase: phase || undefined,
      status: status || undefined,
      owner_id: owner_id || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      userId: req.user!.id,
      isAdmin,
    });
    res.json(result);
  } catch (err) {
    console.error('List engagements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagements/:id — all authenticated roles
engagementsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await getEngagement(req.params.id);
    if (!result) { res.status(404).json({ error: 'Engagement not found' }); return; }
    res.json(result);
  } catch (err) {
    console.error('Get engagement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/engagements/:id — EM and AD only
engagementsRouter.patch('/:id', requireRole('EM', 'AD'), async (req: Request, res: Response) => {
  try {
    const { title, risk_level, owner_id, portfolio } = req.body;
    const engagement = await updateEngagement(req.params.id, { title, risk_level, owner_id, portfolio }, req.user!.id);
    res.json({ engagement });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; fields?: string[] };
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Update engagement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
