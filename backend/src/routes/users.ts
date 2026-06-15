import { Router, Request, Response } from 'express';
import { authenticateSession } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { listUsers, searchUsers, createUser, updateUserRoles, deactivateUser, activateUser } from '../services/users.service';

export const usersRouter = Router();

// All user routes require authentication.
usersRouter.use(authenticateSession);

// GET /api/users/search?q= — lightweight user lookup for assignment pickers
// (e.g. adding engagement team members). Available to Engagement Managers and
// Admins — the roles permitted to manage teams. Defined BEFORE the admin guard
// below so it is not restricted to AD, and before "/:id" so it matches first.
usersRouter.get('/search', requireRole('EM', 'AD'), async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) ?? '').trim();
    if (q.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' });
      return;
    }
    const users = await searchUsers(q);
    res.json({ users });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All remaining user-management routes require Admin role.
usersRouter.use(requireRole('AD'));

// GET /api/users
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const users = await listUsers();
    const user = users.find((u) => u.id === req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username, email, display_name, password, roles } = req.body;
    if (!username || !email || !display_name || !password) {
      res.status(400).json({ error: 'username, email, display_name, and password are required' });
      return;
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ error: 'At least one role is required.' });
      return;
    }
    const user = await createUser({ username, email, display_name, password, roles });
    res.status(201).json({ user });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; code?: string };
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message, code: error.code });
      return;
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/roles
usersRouter.put('/:id/roles', async (req: Request, res: Response) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ error: 'At least one role is required.' });
      return;
    }
    const user = await updateUserRoles(req.params.id, roles);
    res.json({ user });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; code?: string };
    if (error.status && error.status < 500) {
      res.status(error.status).json({ error: error.message, code: error.code });
      return;
    }
    console.error('Update roles error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/deactivate
usersRouter.put('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const user = await deactivateUser(req.params.id);
    res.json({ user });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status === 404) { res.status(404).json({ error: error.message }); return; }
    console.error('Deactivate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/activate
usersRouter.put('/:id/activate', async (req: Request, res: Response) => {
  try {
    const user = await activateUser(req.params.id);
    res.json({ user });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status === 404) { res.status(404).json({ error: error.message }); return; }
    console.error('Activate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
