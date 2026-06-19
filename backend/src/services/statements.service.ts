import { db } from '../db';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RefStatus = 'not_started' | 'in_review' | 'passed' | 'failed' | 'waived';

export interface Statement {
  id: string;
  engagement_id: string;
  draft_product_id: string;
  statement_text: string;
  ref_status: RefStatus;
  display_order: number;
  assigned_to: string | null;
  assigned_ir_name: string | null;
  discrepancy_notes: string | null;
  evidence_ids: string[];
  evidence_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StatementFilters {
  ref_status?: string | string[];
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateStatementInput {
  statement_text?: string;
  evidence_ids?: string[];
  ref_status?: string;
  discrepancy_notes?: string;
  assigned_to?: string | null;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function toStatement(
  row: Record<string, unknown>,
  evidenceIds: string[]
): Statement {
  return {
    id: row.id as string,
    engagement_id: row.engagement_id as string,
    draft_product_id: row.draft_product_id as string,
    statement_text: row.statement_text as string,
    ref_status: row.ref_status as RefStatus,
    display_order: row.display_order as number,
    assigned_to: row.assigned_to as string | null,
    assigned_ir_name: (row.assigned_ir_name as string | null) ?? null,
    discrepancy_notes: row.discrepancy_notes as string | null,
    evidence_ids: evidenceIds,
    evidence_count: evidenceIds.length,
    created_by: row.created_by as string,
    created_at:
      row.created_at instanceof Date
        ? (row.created_at as Date).toISOString()
        : (row.created_at as string),
    updated_at:
      row.updated_at instanceof Date
        ? (row.updated_at as Date).toISOString()
        : (row.updated_at as string),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getEvidenceIdsForStatements(
  statementIds: string[]
): Promise<Map<string, string[]>> {
  if (statementIds.length === 0) return new Map();
  const links = await db('statement_evidence_links')
    .whereIn('statement_id', statementIds)
    .select('statement_id', 'evidence_id');
  const map = new Map<string, string[]>();
  for (const link of links) {
    const sid = link.statement_id as string;
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid)!.push(link.evidence_id as string);
  }
  return map;
}

async function getDraftProductId(engagementId: string): Promise<string> {
  const product = await db('draft_products')
    .where({ engagement_id: engagementId })
    .select('id')
    .first();
  if (!product) {
    throw Object.assign(
      new Error('Draft product not found for this engagement.'),
      { status: 404 }
    );
  }
  return product.id as string;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function listStatements(
  engagementId: string,
  filters: StatementFilters
): Promise<{ statements: Statement[]; total: number }> {
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = filters.offset ?? 0;

  // Draft product acts as the bridge between engagement and statements
  let q = db('draft_statements as ds')
    .join('draft_products as dp', 'dp.id', 'ds.draft_product_id')
    .leftJoin('users as ir_user', 'ir_user.id', 'ds.assigned_to')
    .where('dp.engagement_id', engagementId)
    .select(
      'ds.*',
      'dp.engagement_id',
      db.raw(
        "COALESCE(ir_user.display_name, ir_user.username, '') AS assigned_ir_name"
      )
    );

  // Filter by ref_status — support single value or comma-separated
  if (filters.ref_status) {
    const statuses = Array.isArray(filters.ref_status)
      ? filters.ref_status
      : (filters.ref_status as string).split(',').map((s) => s.trim());
    q = q.whereIn('ds.ref_status', statuses);
  }

  // Filter by assigned_to (IR queue)
  if (filters.assigned_to) {
    q = q.where('ds.assigned_to', filters.assigned_to);
  }

  // Default sort: not_started first, then in_review, failed, passed
  q = q.orderByRaw(
    "CASE ds.ref_status WHEN 'not_started' THEN 0 WHEN 'in_review' THEN 1 WHEN 'failed' THEN 2 WHEN 'passed' THEN 3 ELSE 4 END"
  ).orderBy('ds.display_order', 'asc');

  const countResult = (await q.clone().clearOrder().clearSelect().count('ds.id as count').first()) as {
    count: string | number;
  };
  const total =
    typeof countResult.count === 'string'
      ? parseInt(countResult.count, 10)
      : (countResult.count as number);

  const rows = await q.clone().limit(limit).offset(offset);

  if (rows.length === 0) {
    return { statements: [], total };
  }

  const statementIds = rows.map((r: Record<string, unknown>) => r.id as string);
  const evidenceMap = await getEvidenceIdsForStatements(statementIds);

  const statements = rows.map((row: Record<string, unknown>) =>
    toStatement(row, evidenceMap.get(row.id as string) ?? [])
  );

  return { statements, total };
}

export async function createStatement(
  engagementId: string,
  data: { statement_text: string; evidence_ids: string[] },
  userId: string
): Promise<Statement> {
  // Validate ≥1 evidence_id
  if (!data.evidence_ids || data.evidence_ids.length === 0) {
    throw Object.assign(
      new Error('At least one evidence item must be linked to a statement.'),
      { status: 422 }
    );
  }

  // Validate evidence_ids exist for this engagement
  const validEvidence = await db('evidence_items')
    .where('engagement_id', engagementId)
    .whereIn('id', data.evidence_ids)
    .select('id');
  if (validEvidence.length !== data.evidence_ids.length) {
    throw Object.assign(
      new Error('One or more evidence items not found for this engagement.'),
      { status: 422 }
    );
  }

  const draftProductId = await getDraftProductId(engagementId);

  // Determine display_order = max + 1 (0-based within this draft product)
  const maxOrderResult = await db('draft_statements')
    .where({ draft_product_id: draftProductId })
    .max('display_order as max_order')
    .first() as { max_order: number | null };
  const nextOrder = (maxOrderResult.max_order ?? -1) + 1;

  const [row] = await db('draft_statements')
    .insert({
      draft_product_id: draftProductId,
      statement_text: data.statement_text,
      ref_status: 'not_started',
      display_order: nextOrder,
      created_by: userId,
      updated_at: db.fn.now(),
    })
    .returning('*');

  // Insert evidence links
  const linkRows = data.evidence_ids.map((eid) => ({
    statement_id: row.id,
    evidence_id: eid,
    linked_by: userId,
  }));
  await db('statement_evidence_links').insert(linkRows);

  return toStatement(
    { ...row, engagement_id: engagementId },
    data.evidence_ids
  );
}

export async function updateStatement(
  engagementId: string,
  statementId: string,
  data: UpdateStatementInput,
  userRoles: string[],
  userId: string
): Promise<Statement> {
  // Fetch existing statement (join to verify engagement ownership)
  const existing = await db('draft_statements as ds')
    .join('draft_products as dp', 'dp.id', 'ds.draft_product_id')
    .where('ds.id', statementId)
    .where('dp.engagement_id', engagementId)
    .select('ds.*', 'dp.engagement_id')
    .first();

  if (!existing) {
    throw Object.assign(new Error('Statement not found.'), { status: 404 });
  }

  // ref_status validation
  if (data.ref_status !== undefined) {
    const validStatuses: RefStatus[] = ['not_started', 'in_review', 'passed', 'failed', 'waived'];
    if (!validStatuses.includes(data.ref_status as RefStatus)) {
      throw Object.assign(
        new Error(`Invalid ref_status. Must be one of: ${validStatuses.join(', ')}.`),
        { status: 422 }
      );
    }

    // 'failed' requires discrepancy_notes (documenting the discrepancy found by IR)
    if (data.ref_status === 'failed') {
      const notes = data.discrepancy_notes ?? (existing.discrepancy_notes as string | null);
      if (!notes || notes.trim().length === 0) {
        throw Object.assign(
          new Error('Discrepancy notes are required when reference status is Failed.'),
          { status: 422 }
        );
      }
    }

    // 'waived' is restricted to EM/AD (management decision, not an IR action)
    // and requires a justification string in discrepancy_notes
    if (data.ref_status === 'waived') {
      const canWaive = userRoles.includes('EM') || userRoles.includes('AD');
      if (!canWaive) {
        throw Object.assign(
          new Error('Only Engagement Managers or Administrators can waive a reference check.'),
          { status: 403 }
        );
      }
      const justification = data.discrepancy_notes ?? (existing.discrepancy_notes as string | null);
      if (!justification || justification.trim().length === 0) {
        throw Object.assign(
          new Error('A justification (discrepancy_notes) is required when waiving a reference check.'),
          { status: 422 }
        );
      }
    }
  }

  // Build update payload
  const updates: Record<string, unknown> = {
    updated_at: db.fn.now(),
  };
  if (data.statement_text !== undefined) updates.statement_text = data.statement_text;
  if (data.ref_status !== undefined) updates.ref_status = data.ref_status;
  if (data.discrepancy_notes !== undefined) updates.discrepancy_notes = data.discrepancy_notes;
  if (data.assigned_to !== undefined) updates.assigned_to = data.assigned_to;

  const [updatedRow] = await db('draft_statements')
    .where({ id: statementId })
    .update(updates)
    .returning('*');

  // Handle evidence_ids replacement
  if (data.evidence_ids !== undefined) {
    if (data.evidence_ids.length === 0) {
      throw Object.assign(
        new Error('At least one evidence item must be linked to a statement.'),
        { status: 422 }
      );
    }
    // Validate evidence items
    const validEvidence = await db('evidence_items')
      .where('engagement_id', engagementId)
      .whereIn('id', data.evidence_ids)
      .select('id');
    if (validEvidence.length !== data.evidence_ids.length) {
      throw Object.assign(
        new Error('One or more evidence items not found for this engagement.'),
        { status: 422 }
      );
    }
    // Replace links: delete old, insert new
    await db('statement_evidence_links').where({ statement_id: statementId }).delete();
    const linkRows = data.evidence_ids.map((eid) => ({
      statement_id: statementId,
      evidence_id: eid,
      linked_by: userId,
    }));
    await db('statement_evidence_links').insert(linkRows);
  }

  // Create AuditEvent for discrepancy assignment
  // Triggered when ref_status=failed and assigned_to is provided (discrepancy back-assignment)
  if (data.ref_status === 'failed' && data.assigned_to !== undefined && data.assigned_to !== null) {
    await db('audit_events').insert({
      engagement_id: engagementId,
      actor_id: userId,
      action: 'STATEMENT_DISCREPANCY_ASSIGNED',
      object_type: 'statement',
      object_id: statementId,
      summary: `Statement discrepancy assigned to user ${data.assigned_to}`,
      after_state: JSON.stringify({
        assigned_to: data.assigned_to,
        statement_id: statementId,
      }),
    });
  }

  // Return fresh statement with evidence_ids
  const evidenceMap = await getEvidenceIdsForStatements([statementId]);
  const finalEvidenceIds = evidenceMap.get(statementId) ?? [];

  return toStatement(
    { ...updatedRow, engagement_id: engagementId },
    finalEvidenceIds
  );
}

export async function deleteStatement(
  engagementId: string,
  statementId: string
): Promise<{ message: string }> {
  // Fetch existing statement (join to verify engagement ownership)
  const existing = await db('draft_statements as ds')
    .join('draft_products as dp', 'dp.id', 'ds.draft_product_id')
    .where('ds.id', statementId)
    .where('dp.engagement_id', engagementId)
    .select('ds.*')
    .first();

  if (!existing) {
    throw Object.assign(new Error('Statement not found.'), { status: 404 });
  }

  // Block delete if ref_status is 'passed' or 'waived' (waived statements are
  // management decisions and should be un-waived before deletion)
  if (existing.ref_status === 'waived') {
    throw Object.assign(
      new Error(
        'Cannot delete — this statement has been waived. Remove the waiver before deleting.'
      ),
      { status: 409 }
    );
  }
  if (existing.ref_status === 'passed') {
    throw Object.assign(
      new Error(
        'Cannot delete — this statement is linked to a completed reference check. Change status first.'
      ),
      { status: 409 }
    );
  }

  // Delete evidence links first (CASCADE handles this, but explicit for clarity)
  await db('statement_evidence_links').where({ statement_id: statementId }).delete();
  // Delete statement
  await db('draft_statements').where({ id: statementId }).delete();

  return { message: 'Statement deleted.' };
}
