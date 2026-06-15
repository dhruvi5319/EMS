import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadMiddleware, handleUploadErrors } from '../middleware/upload';
import {
  listRequests,
  createRequest,
  getRequest,
  updateRequest,
  submitRequest,
  uploadIntakeDocument,
  deleteIntakeDocument,
} from '../services/requests.service';

export const requestsRouter = Router();

// All request routes require authentication
requestsRouter.use(authenticateSession);

// GET /api/requests
requestsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, requester, limit, offset } = req.query as Record<string, string>;
    const result = await listRequests({
      status: status || undefined,
      requester: requester || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('List requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/requests — AL and AD can create requests
requestsRouter.post('/', requireRole('AL', 'AD'), async (req: Request, res: Response) => {
  try {
    const { request_type, requester_name, requester_org, topic, agency_program, due_date, notes } = req.body;
    const request = await createRequest({
      request_type,
      requester_name,
      requester_org,
      topic,
      agency_program,
      due_date,
      notes,
      created_by: req.user!.id,
    });
    res.status(201).json({ request });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/requests/:id
requestsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const request = await getRequest(req.params.id);
    if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
    res.json({ request });
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/requests/:id — AL and AD (Draft only)
requestsRouter.patch('/:id', requireRole('AL', 'AD'), async (req: Request, res: Response) => {
  try {
    const { request_type, requester_name, requester_org, topic, agency_program, due_date, notes } = req.body;
    const request = await updateRequest(req.params.id, {
      request_type, requester_name, requester_org, topic, agency_program, due_date, notes,
    });
    res.json({ request });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message }); return;
    }
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/requests/:id/submit — AL and AD
requestsRouter.post('/:id/submit', requireRole('AL', 'AD'), async (req: Request, res: Response) => {
  try {
    const request = await submitRequest(req.params.id, req.user!.id);
    res.json({ request });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; fields?: string[] };
    if (error.status === 422) {
      res.status(422).json({ error: error.message, fields: error.fields }); return;
    }
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message }); return;
    }
    console.error('Submit request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/requests/:id/intake-document — multipart upload
requestsRouter.post(
  '/:id/intake-document',
  requireRole('AL', 'AD'),
  (req: Request, res: Response, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return handleUploadErrors(err, req, res, next);
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided. Send file in field named "file".' });
        return;
      }
      const result = await uploadIntakeDocument(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );
      res.json(result);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status && error.status < 500) {
        res.status(error.status).json({ error: error.message }); return;
      }
      console.error('Upload intake document error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/requests/:id/intake-document
requestsRouter.delete(
  '/:id/intake-document',
  requireRole('AL', 'AD'),
  async (req: Request, res: Response) => {
    try {
      await deleteIntakeDocument(req.params.id);
      res.json({ message: 'Intake document removed' });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 404) {
        res.status(404).json({ error: error.message }); return;
      }
      console.error('Delete intake document error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
