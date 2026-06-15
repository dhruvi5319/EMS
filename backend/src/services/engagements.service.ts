import { db } from '../db';

export type EngagementPhase = 'intake' | 'planning' | 'evidence' | 'draft' | 'readiness' | 'issuance' | 'closed';
export type EngagementStatus = 'active' | 'on_hold' | 'cancelled' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface EngagementRecord {
  id: string;
  job_code: string; // "ENG-YYYY-NNNNN"
  title: string | null;
  phase: EngagementPhase;
  status: EngagementStatus;
  risk_level: RiskLevel | null;
  owner_id: string | null;
  portfolio: string | null;
  request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GateDecisionRecord {
  id: string;
  gate_name: string;
  decision: string;
  risk_level: string | null;
  rationale: string | null;
  decided_by: string | null;
  decided_at: string;
}

export interface Blocker {
  type: string;
  message: string;
  link?: string;
}

function toRecord(row: Record<string, unknown>): EngagementRecord {
  return {
    id: row.id as string,
    job_code: row.job_code as string,
    title: row.title as string | null,
    phase: row.phase as EngagementPhase,
    status: row.status as EngagementStatus,
    risk_level: row.risk_level as RiskLevel | null,
    owner_id: row.owner_id as string | null,
    portfolio: row.portfolio as string | null,
    request_id: row.request_id as string | null,
    created_at: row.created_at instanceof Date ? (row.created_at as Date).toISOString() : (row.created_at as string),
    updated_at: row.updated_at instanceof Date ? (row.updated_at as Date).toISOString() : (row.updated_at as string),
  };
}

function toGateDecisionRecord(row: Record<string, unknown>): GateDecisionRecord {
  // gate_decisions table has: id, engagement_id, gate_type, status, decided_by, decided_at, rationale, comment
  // Map to GateDecisionRecord shape expected by consumers:
  // gate_name = gate_type, decision = status (passed/failed/returned), risk_level from comment field
  let risk_level: string | null = null;
  if (row.comment && typeof row.comment === 'string') {
    const match = row.comment.match(/^risk_level:(\w+)$/);
    if (match) risk_level = match[1];
  }

  return {
    id: row.id as string,
    gate_name: row.gate_type as string,
    decision: row.status as string,
    risk_level,
    rationale: row.rationale as string | null,
    decided_by: row.decided_by as string | null,
    decided_at: row.decided_at instanceof Date ? (row.decided_at as Date).toISOString() : (row.decided_at as string),
  };
}

export interface ListEngagementsFilters {
  phase?: string;
  status?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  isAdmin?: boolean;
}

export async function listEngagements(
  filters: ListEngagementsFilters
): Promise<{ engagements: EngagementRecord[]; total: number }> {
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  let q = db('engagements').orderBy('updated_at', 'desc');

  if (filters.phase) q = q.where({ phase: filters.phase });
  if (filters.status) q = q.where({ status: filters.status });
  if (filters.owner_id) q = q.where({ owner_id: filters.owner_id });

  // Role scoping: non-admins can only see engagements they're assigned to or own
  if (!filters.isAdmin && filters.userId) {
    const userId = filters.userId;
    q = q.where(function (this: ReturnType<typeof db>) {
      this.where({ owner_id: userId }).orWhereIn(
        'id',
        db('team_assignments').select('engagement_id').where({ user_id: userId })
      );
    });
  }

  const countResult = (await q.clone().clearOrder().count('id as count').first()) as { count: string | number };
  const total = typeof countResult.count === 'string' ? parseInt(countResult.count, 10) : countResult.count;

  const rows = await q.select('*').limit(limit).offset(offset);
  return { engagements: rows.map(toRecord), total };
}

export interface EngagementCounts {
  team: number;
  objectives: number;
  evidence: number;
  findings: number;
  draft_status: string | null;
  objectives_without_evidence: number;
  reference_check_total: number;
  reference_check_complete: number;
  reference_check_pct: number;
}

export async function getEngagement(
  id: string
): Promise<{
  engagement: EngagementRecord;
  gate_decisions: GateDecisionRecord[];
  blockers: Blocker[];
  counts: EngagementCounts;
} | null> {
  const row = await db('engagements').where({ id }).first();
  if (!row) return null;

  const engagement = toRecord(row as Record<string, unknown>);

  // Fetch all gate_decisions for this engagement (A1, P2, P3, P4 all stored with engagement_id)
  const gateRows = await db('gate_decisions')
    .where({ engagement_id: id })
    .orderBy('decided_at', 'asc');

  const gate_decisions = gateRows.map((r: Record<string, unknown>) => toGateDecisionRecord(r));

  // Compute blockers from engagement state
  const blockers: Blocker[] = [];

  if (!engagement.owner_id) {
    blockers.push({ type: 'no_owner', message: 'No owner assigned.' });
  }

  // Artifact counts for the engagement detail dashboard (PRD F15).
  const n = (r: Record<string, unknown> | undefined): number =>
    parseInt(String(r?.c ?? 0), 10);
  const [teamC, objC, evC, findC, draftRow, objNoEvRow, stmtRow] = await Promise.all([
    db('team_assignments').where({ engagement_id: id }).count('id as c').first(),
    db('objectives').where({ engagement_id: id, status: 'active' }).count('id as c').first(),
    db('evidence_items').where({ engagement_id: id }).count('id as c').first(),
    db('findings').where({ engagement_id: id }).count('id as c').first(),
    db('draft_products').where({ engagement_id: id }).first(),
    db('objectives as o')
      .where({ 'o.engagement_id': id, 'o.status': 'active' })
      .whereNotExists(function () {
        this.select('*')
          .from('objective_evidence_links as oel')
          .whereRaw('oel.objective_id = o.id');
      })
      .count('o.id as c')
      .first(),
    db('draft_statements as ds')
      .join('draft_products as dp', 'dp.id', 'ds.draft_product_id')
      .where('dp.engagement_id', id)
      .select(
        db.raw('count(*) as total'),
        db.raw("count(*) FILTER (WHERE ds.ref_status IN ('passed','waived')) as done")
      )
      .first(),
  ]);

  const refTotal = parseInt(String((stmtRow as Record<string, unknown>)?.total ?? 0), 10);
  const refDone = parseInt(String((stmtRow as Record<string, unknown>)?.done ?? 0), 10);

  const counts: EngagementCounts = {
    team: n(teamC),
    objectives: n(objC),
    evidence: n(evC),
    findings: n(findC),
    draft_status: draftRow ? ((draftRow as Record<string, unknown>).status as string) : null,
    objectives_without_evidence: n(objNoEvRow),
    reference_check_total: refTotal,
    reference_check_complete: refDone,
    reference_check_pct: refTotal > 0 ? Math.round((refDone / refTotal) * 100) : 0,
  };

  return { engagement, gate_decisions, blockers, counts };
}

export async function updateEngagement(
  id: string,
  data: {
    title?: string;
    risk_level?: string;
    owner_id?: string;
    portfolio?: string;
  },
  actorId: string
): Promise<EngagementRecord> {
  // Check engagement exists
  const existing = await db('engagements').where({ id }).first();
  if (!existing) {
    throw Object.assign(new Error('Engagement not found'), { status: 404 });
  }

  // Validate provided fields
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      throw Object.assign(new Error('Title must not be empty'), { status: 422 });
    }
    if (data.title.length > 500) {
      throw Object.assign(new Error('Title must be 500 characters or fewer'), { status: 422 });
    }
  }

  if (data.risk_level !== undefined) {
    const validRiskLevels: RiskLevel[] = ['low', 'medium', 'high'];
    if (!validRiskLevels.includes(data.risk_level as RiskLevel)) {
      throw Object.assign(new Error('risk_level must be one of: low, medium, high'), { status: 422 });
    }
  }

  if (data.owner_id !== undefined) {
    // owner_id must reference a user with EM role
    const ownerRole = await db('user_roles')
      .where({ user_id: data.owner_id, role: 'EM' })
      .first();
    if (!ownerRole) {
      throw Object.assign(new Error('owner_id must reference a user with EM role'), { status: 422 });
    }
  }

  // Build update payload — only include defined fields
  const updatePayload: Record<string, unknown> = { updated_at: db.fn.now() };
  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.risk_level !== undefined) updatePayload.risk_level = data.risk_level;
  if (data.owner_id !== undefined) updatePayload.owner_id = data.owner_id;
  if (data.portfolio !== undefined) updatePayload.portfolio = data.portfolio;

  const [updated] = await db('engagements').where({ id }).update(updatePayload).returning('*');

  return toRecord(updated as Record<string, unknown>);
}
