import { Router } from 'express';
import { authRouter } from './auth';
import { searchRouter } from './search';
import { usersRouter } from './users';
import { auditRouter } from './audit';
import { requestsRouter } from './requests';
import { gateRouter } from './gate';
import { engagementsRouter } from './engagements';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRouter);

// Authenticated routes
apiRouter.use('/search', searchRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/engagements', auditRouter);

// Phase 3: Request intake
apiRouter.use('/requests', requestsRouter);

// Phase 3: Gate A1 decisions — mounted at /requests so full path is /api/requests/:id/gate/a1
apiRouter.use('/requests', gateRouter);

// Phase 4: Engagement list/detail/update
apiRouter.use('/engagements', engagementsRouter);
