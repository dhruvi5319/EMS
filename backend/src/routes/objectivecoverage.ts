import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  getObjectiveCoverage,
  setSufficiency,
} from '../services/objectivecoverage.service';

export const objectiveCoverageRouter = Router({ mergeParams: true });
objectiveCoverageRouter.use(authenticateSession);

// GET /objectives/coverage — objective coverage summary (gap view data)
// Full path: GET /api/engagements/:id/objectives/coverage
// Role access: all authenticated roles
objectiveCoverageRouter.get(
  '/objectives/coverage',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await getObjectiveCoverage(req.params.id);
      res.json(result);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('Get coverage error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /objectives/sufficiency — set sufficiency for multiple objectives
// Full path: PUT /api/engagements/:id/objectives/sufficiency
// Role access: QA, EM, AD only (per US-10.2)
objectiveCoverageRouter.put(
  '/objectives/sufficiency',
  requireRole('QA', 'EM', 'AD'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updates = req.body; // array of { objective_id, sufficiency }
      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(422).json({
          error: 'Body must be a non-empty array of { objective_id, sufficiency } objects.',
        });
        return;
      }
      const result = await setSufficiency(req.params.id, updates, req.user!.id);
      res.json(result);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('Set sufficiency error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
