import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  getPlanningRecord,
  upsertPlanningRecord,
  submitPlanningRecord,
  addObjective,
  updateObjective,
  deleteObjective,
  recordP2Decision,
  requestRevision,
  setIndependenceAffirmations,
} from '../services/planning.service';

// mergeParams: true so `:id` from the parent engagementsRouter is accessible
export const planningRouter = Router({ mergeParams: true });

// All planning routes require authentication
planningRouter.use(authenticateSession);

// ============================================================
// Planning Record routes
// ============================================================

// GET /api/engagements/:id/planning — all authenticated roles (read-only)
planningRouter.get('/planning', async (req: Request, res: Response) => {
  try {
    const result = await getPlanningRecord(req.params.id);
    res.json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('GET /planning error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/engagements/:id/planning/independence — EM, AD set independence affirmations
planningRouter.put(
  '/planning/independence',
  requireRole('EM', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { affirmations } = req.body;
      if (!Array.isArray(affirmations)) {
        res.status(400).json({ error: 'affirmations array is required' });
        return;
      }
      const result = await setIndependenceAffirmations(req.params.id, affirmations, req.user!.id);
      res.json(result);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('PUT /planning/independence error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/engagements/:id/planning — EM, AN, AD only
planningRouter.put(
  '/planning',
  requireRole('EM', 'AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { design_approach, schedule_notes, risk_notes, data_reliability_notes } = req.body;
      const planning_record = await upsertPlanningRecord(
        req.params.id,
        { design_approach, schedule_notes, risk_notes, data_reliability_notes },
        req.user!.id
      );
      res.json({ planning_record });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('PUT /planning error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/engagements/:id/planning/submit — EM, AN, AD only
planningRouter.post(
  '/planning/submit',
  requireRole('EM', 'AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const planning_record = await submitPlanningRecord(req.params.id);
      res.json({ planning_record });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 422 || error.status === 409 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('POST /planning/submit error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================
// Objectives routes
// ============================================================

// POST /api/engagements/:id/planning/objectives — EM, AN, AD only
planningRouter.post(
  '/planning/objectives',
  requireRole('EM', 'AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { objective_text, information_need } = req.body;
      const objective = await addObjective(
        req.params.id,
        req.user!.id,
        { objective_text, information_need }
      );
      res.status(201).json({ objective });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('POST /planning/objectives error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/engagements/:id/planning/objectives/:objective_id — EM, AN, AD only
planningRouter.patch(
  '/planning/objectives/:objective_id',
  requireRole('EM', 'AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { objective_text, information_need, sort_order } = req.body;
      const objective = await updateObjective(
        req.params.id,
        req.params.objective_id,
        { objective_text, information_need, sort_order }
      );
      res.json({ objective });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('PATCH /planning/objectives/:objective_id error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/engagements/:id/planning/objectives/:objective_id — EM, AN, AD only
planningRouter.delete(
  '/planning/objectives/:objective_id',
  requireRole('EM', 'AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      await deleteObjective(req.params.id, req.params.objective_id);
      res.json({ message: 'Objective deleted' });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 409) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.status === 404) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('DELETE /planning/objectives/:objective_id error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================
// Gate P2 route
// ============================================================

// POST /api/engagements/:id/gate/p2 — QA, AD only
planningRouter.post(
  '/gate/p2',
  requireRole('QA', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { decision, comment } = req.body;
      const result = await recordP2Decision(
        req.params.id,
        { decision, comment },
        req.user!.id
      );
      res.json(result);
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        message?: string;
        failed_prerequisites?: unknown[];
      };
      if (error.status === 422) {
        res.status(422).json({
          error: error.message,
          ...(error.failed_prerequisites
            ? { failed_prerequisites: error.failed_prerequisites }
            : {}),
        });
        return;
      }
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('POST /gate/p2 error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================================
// Planning Revisions route
// ============================================================

// POST /api/engagements/:id/planning/revisions — EM, AD only
planningRouter.post(
  '/planning/revisions',
  requireRole('EM', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { revision_note } = req.body;
      const planning_record = await requestRevision(
        req.params.id,
        { revision_note },
        req.user!.id
      );
      res.json({ planning_record });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error('POST /planning/revisions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
