import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  listEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
  uploadFile,
  deleteFile,
  getEvidenceFile,
} from '../services/evidence.service';
import { storageProvider } from '../storage/local.storage';
import {
  linkEvidenceToObjectives,
  unlinkEvidenceFromObjective,
  getLinkedObjectivesForEvidence,
} from '../services/objectivecoverage.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// mergeParams: true so :id (engagementId) from the parent router is accessible
export const evidenceRouter = Router({ mergeParams: true });

evidenceRouter.use(authenticateSession);

// ─── Helper: error handler ────────────────────────────────────────────────────

function handleError(
  err: unknown,
  res: Response,
  context: string
): void {
  const error = err as { status?: number; message?: string };
  if (error.status && error.status < 500) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(`${context}:`, err);
  res.status(500).json({ error: 'Internal server error' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// IMPORTANT: /export must be registered BEFORE /:evidence_id to avoid route param capture

// GET /api/engagements/:id/evidence/export
// Roles: AL, EM, AN, QA, PC, RO, AD (IR excluded per US-9.4)
evidenceRouter.get(
  '/export',
  requireRole('AL', 'EM', 'AN', 'QA', 'PC', 'RO', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const engagementId = req.params.id;
      // Explicitly deny pure IR users (may have passed requireRole if IR has another granted role)
      const userRoles = req.user!.roles;
      const hasNonIRRole = userRoles.some((r: string) =>
        ['AL', 'EM', 'AN', 'QA', 'PC', 'RO', 'AD'].includes(r)
      );
      if (!hasNonIRRole) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      const result = await listEvidence(engagementId, { limit: 1000 }, userRoles);
      const rows = result.evidence;

      const headers = [
        'ID',
        'Type',
        'Source',
        'Date Received',
        'Custodian',
        'Description',
        'Sensitivity',
        'Objectives Linked',
        'Files',
      ];
      const csvLines = [
        headers.join(','),
        ...rows.map((e) =>
          [
            e.id,
            e.evidence_type,
            `"${(e.source || '').replace(/"/g, '""')}"`,
            e.date_received,
            `"${(e.custodian || '').replace(/"/g, '""')}"`,
            `"${(e.description || '').replace(/"/g, '""')}"`,
            e.sensitivity,
            e.objective_count ?? 0,
            e.file_count ?? 0,
          ].join(',')
        ),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="evidence-registry.csv"');
      res.send(csvLines.join('\n'));
    } catch (err) {
      handleError(err, res, 'GET /evidence/export');
    }
  }
);

// GET /api/engagements/:id/evidence — all authenticated roles
evidenceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { type, sensitivity, limit, offset } = req.query as Record<string, string>;
    const result = await listEvidence(
      req.params.id,
      {
        type: type as import('../services/evidence.service').EvidenceType | undefined,
        sensitivity:
          sensitivity as import('../services/evidence.service').Sensitivity | undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      },
      req.user!.roles
    );
    res.json(result);
  } catch (err) {
    handleError(err, res, 'GET /evidence');
  }
});

// POST /api/engagements/:id/evidence — AN, AD only
evidenceRouter.post(
  '/',
  requireRole('AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { evidence_type, source, date_received, custodian, description, sensitivity } =
        req.body;
      const evidence = await createEvidence(
        req.params.id,
        { evidence_type, source, date_received, custodian, description, sensitivity },
        req.user!.id
      );
      res.status(201).json({ evidence });
    } catch (err) {
      handleError(err, res, 'POST /evidence');
    }
  }
);

// GET /api/engagements/:id/evidence/:evidence_id — all authenticated roles (with sensitivity filter)
evidenceRouter.get('/:evidence_id', async (req: Request, res: Response) => {
  try {
    const evidence = await getEvidence(req.params.id, req.params.evidence_id, req.user!.roles);
    res.json({ evidence });
  } catch (err) {
    handleError(err, res, 'GET /evidence/:evidence_id');
  }
});

// PATCH /api/engagements/:id/evidence/:evidence_id — AN, AD only
evidenceRouter.patch(
  '/:evidence_id',
  requireRole('AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const { evidence_type, source, date_received, custodian, description, sensitivity } =
        req.body;
      const evidence = await updateEvidence(
        req.params.id,
        req.params.evidence_id,
        { evidence_type, source, date_received, custodian, description, sensitivity },
        req.user!.id
      );
      res.json({ evidence });
    } catch (err) {
      handleError(err, res, 'PATCH /evidence/:evidence_id');
    }
  }
);

// DELETE /api/engagements/:id/evidence/:evidence_id — AN, AD only
evidenceRouter.delete(
  '/:evidence_id',
  requireRole('AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const result = await deleteEvidence(req.params.id, req.params.evidence_id);
      res.json(result);
    } catch (err) {
      handleError(err, res, 'DELETE /evidence/:evidence_id');
    }
  }
);

// GET /api/engagements/:id/evidence/:evidence_id/files — all authenticated roles (with sensitivity check)
evidenceRouter.get(
  '/:evidence_id/files',
  async (req: Request, res: Response) => {
    try {
      const { evidence_id } = req.params;
      const engagementId = req.params.id;

      // Verify evidence item exists and check sensitivity access
      const item = await import('../db').then(({ db }) =>
        db('evidence_items').where({ id: evidence_id, engagement_id: engagementId }).first()
      );
      if (!item) {
        res.status(404).json({ error: 'Evidence item not found.' });
        return;
      }
      if (item.sensitivity === 'restricted') {
        const PRIVILEGED = new Set(['AN', 'EM', 'QA', 'IR', 'PC', 'AD']);
        if (!req.user!.roles.some((r: string) => PRIVILEGED.has(r))) {
          res.status(403).json({ error: 'Access denied — restricted evidence.' });
          return;
        }
      }

      const { db } = await import('../db');
      const rows = await db('evidence_files')
        .where({ evidence_id })
        .orderBy('uploaded_at', 'asc')
        .select('*');

      const files = rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        evidence_item_id: row.evidence_id,
        original_filename: row.filename ?? row.original_filename,
        file_size: row.file_size,
        mime_type: row.mime_type,
        storage_key: row.file_ref ?? row.storage_key,
        uploaded_by: row.uploaded_by,
        created_at: row.uploaded_at instanceof Date
          ? (row.uploaded_at as Date).toISOString()
          : row.uploaded_at,
      }));

      res.json({ files });
    } catch (err) {
      handleError(err, res, 'GET /evidence/:evidence_id/files');
    }
  }
);

// POST /api/engagements/:id/evidence/:evidence_id/files — AN, AD only
// Content-Type: multipart/form-data; field: file
evidenceRouter.post(
  '/:evidence_id/files',
  requireRole('AN', 'AD'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'No file provided.' });
        return;
      }
      const file = await uploadFile(
        req.params.id,
        req.params.evidence_id,
        {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
        },
        req.user!.id
      );
      res.json({ file });
    } catch (err) {
      handleError(err, res, 'POST /evidence/:evidence_id/files');
    }
  }
);

// DELETE /api/engagements/:id/evidence/:evidence_id/files/:file_id — AN, AD only
evidenceRouter.delete(
  '/:evidence_id/files/:file_id',
  requireRole('AN', 'AD'),
  async (req: Request, res: Response) => {
    try {
      const result = await deleteFile(
        req.params.id,
        req.params.evidence_id,
        req.params.file_id,
        req.user!.roles
      );
      res.json(result);
    } catch (err) {
      handleError(err, res, 'DELETE /evidence/:evidence_id/files/:file_id');
    }
  }
);

// GET /api/engagements/:id/evidence/:evidence_id/files/:file_id/download — all authenticated roles
evidenceRouter.get(
  '/:evidence_id/files/:file_id/download',
  async (req: Request, res: Response) => {
    try {
      const fileInfo = await getEvidenceFile(
        req.params.evidence_id,
        req.params.file_id,
        req.user!.roles
      );
      // Use storageProvider.get() to retrieve buffer, then send as stream
      const buffer = await storageProvider.get(fileInfo.storage_key);
      res.setHeader('Content-Type', fileInfo.mime_type);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileInfo.original_filename}"`
      );
      res.send(buffer);
    } catch (err) {
      handleError(err, res, 'GET /evidence/:evidence_id/files/:file_id/download');
    }
  }
);

// GET /api/engagements/:id/evidence/:evidence_id/objectives — objectives linked to this evidence item
// Moved here from objectivecoverage.ts — evidenceRouter intercepts this path
// (evidenceRouter is mounted at /:id/evidence, which prefixes /:evidence_id/objectives).
// Role access: all authenticated roles
evidenceRouter.get(
  '/:evidence_id/objectives',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const objectives = await getLinkedObjectivesForEvidence(
        req.params.id,
        req.params.evidence_id
      );
      res.json({ objectives });
    } catch (err: unknown) {
      handleError(err, res, 'GET /evidence/:evidence_id/objectives');
    }
  }
);

// POST /api/engagements/:id/evidence/:evidence_id/objectives — link evidence to one or more objectives
// Moved here from objectivecoverage.ts to avoid routing conflict:
// evidenceRouter is mounted at /:id/evidence and intercepts this path before objectiveCoverageRouter.
// Role access: AN, EM, AD
evidenceRouter.post(
  '/:evidence_id/objectives',
  requireRole('AN', 'EM', 'AD'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { objective_ids } = req.body;
      if (!Array.isArray(objective_ids) || objective_ids.length === 0) {
        res.status(422).json({ error: 'objective_ids must be a non-empty array.' });
        return;
      }
      const result = await linkEvidenceToObjectives(
        req.params.id,
        req.params.evidence_id,
        objective_ids,
        req.user!.id
      );
      res.json(result);
    } catch (err: unknown) {
      handleError(err, res, 'POST /evidence/:evidence_id/objectives');
    }
  }
);

// DELETE /api/engagements/:id/evidence/:evidence_id/objectives/:objective_id — unlink evidence from an objective
// Moved here from objectivecoverage.ts for the same routing conflict reason.
// Role access: AN, EM, AD
evidenceRouter.delete(
  '/:evidence_id/objectives/:objective_id',
  requireRole('AN', 'EM', 'AD'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await unlinkEvidenceFromObjective(
        req.params.id,
        req.params.evidence_id,
        req.params.objective_id
      );
      res.json(result);
    } catch (err: unknown) {
      handleError(err, res, 'DELETE /evidence/:evidence_id/objectives/:objective_id');
    }
  }
);
