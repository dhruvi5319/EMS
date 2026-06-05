import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  listTeam,
  addTeamMember,
  removeTeamMember,
  listMilestones,
  upsertMilestones,
  MilestoneInput,
  checkP2Prerequisites,
} from '../services/team.service';

// mergeParams: true so `:id` from the parent engagementsRouter is accessible
export const teamRouter = Router({ mergeParams: true });

// All team routes require authentication
teamRouter.use(authenticateSession);

// ============================================================
// Team Assignment routes
// ============================================================

// GET /api/engagements/:id/team — view team (all authenticated users)
teamRouter.get('/team', async (req: Request, res: Response) => {
  try {
    const result = await listTeam(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; code?: string };
    if (error.status === 404) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('GET /team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/engagements/:id/team — add team member (EM or AD only)
teamRouter.post(
  '/team',
  requireRole('EM', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { user_id, role } = req.body;
      const result = await addTeamMember(req.params.id, { user_id, role });
      res.status(201).json(result);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; code?: string };
      if (error.status === 409) {
        res.status(409).json({ error: error.message, code: error.code });
        return;
      }
      if (error.status === 422) {
        res.status(422).json({ error: error.message });
        return;
      }
      console.error('POST /team error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/engagements/:id/team/:assignment_id — remove team member (EM or AD only)
teamRouter.delete(
  '/team/:assignment_id',
  requireRole('EM', 'AD'),
  async (req: Request, res: Response) => {
    try {
      await removeTeamMember(req.params.id, req.params.assignment_id);
      res.json({ message: 'Team member removed' });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; code?: string };
      if (error.status === 404) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.status === 409) {
        res.status(409).json({ error: error.message, code: error.code });
        return;
      }
      console.error('DELETE /team/:assignment_id error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================
// Milestone routes
// ============================================================

// GET /api/engagements/:id/milestones — view milestones (all authenticated users)
teamRouter.get('/milestones', async (req: Request, res: Response) => {
  try {
    const milestones = await listMilestones(req.params.id);
    res.json({ milestones });
  } catch (err: unknown) {
    console.error('GET /milestones error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/engagements/:id/milestones — upsert all 4 milestones (EM or AD only)
teamRouter.put(
  '/milestones',
  requireRole('EM', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const dates: MilestoneInput[] = req.body;
      if (!Array.isArray(dates)) {
        res.status(422).json({ error: 'Request body must be an array of milestone objects.' });
        return;
      }
      const milestones = await upsertMilestones(req.params.id, dates);
      res.json({ milestones });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; code?: string };
      if (error.status === 422) {
        res.status(422).json({ error: error.message });
        return;
      }
      console.error('PUT /milestones error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================
// Gate P2 prerequisites route
// ============================================================

// GET /api/engagements/:id/gate/p2/prerequisites — P2 checklist (all authenticated users)
teamRouter.get('/gate/p2/prerequisites', async (req: Request, res: Response) => {
  try {
    const result = await checkP2Prerequisites(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    console.error('GET /gate/p2/prerequisites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
