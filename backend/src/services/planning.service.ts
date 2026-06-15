import { db } from '../db';
import { checkP2Prerequisites } from './team.service';

// ---- Types ----

export type PlanningStatus = 'draft' | 'ready_for_review' | 'approved';

export interface PlanningRecord {
  id: string;
  engagement_id: string;
  status: PlanningStatus;
  design_approach: string | null;
  schedule_notes: string | null;
  risk_notes: string | null;
  data_reliability_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  engagement_id: string;
  objective_text: string;
  information_need: string | null;
  sort_order: number;
  independence_confirmed: boolean | null;
  created_at: string;
  updated_at: string;
}

// ---- Helpers ----

function toPlanningRecord(row: Record<string, unknown>): PlanningRecord {
  return {
    id: row.id as string,
    engagement_id: row.engagement_id as string,
    status: row.status as PlanningStatus,
    design_approach: row.design_approach as string | null,
    schedule_notes: row.schedule_notes as string | null,
    risk_notes: row.risk_notes as string | null,
    data_reliability_notes: row.data_reliability_notes as string | null,
    created_by: row.created_by as string,
    created_at: row.created_at instanceof Date
      ? (row.created_at as Date).toISOString()
      : (row.created_at as string),
    updated_at: row.updated_at instanceof Date
      ? (row.updated_at as Date).toISOString()
      : (row.updated_at as string),
  };
}

function toObjective(row: Record<string, unknown>): Objective {
  return {
    id: row.id as string,
    engagement_id: row.engagement_id as string,
    objective_text: row.objective_text as string,
    information_need: row.information_need as string | null,
    sort_order: row.display_order as number,
    independence_confirmed: row.independence_confirmed as boolean | null,
    created_at: row.created_at instanceof Date
      ? (row.created_at as Date).toISOString()
      : (row.created_at as string),
    updated_at: row.updated_at instanceof Date
      ? (row.updated_at as Date).toISOString()
      : (row.updated_at as string),
  };
}

// ---- Service Functions ----

/**
 * Get planning record with objectives for an engagement.
 * Note: Independence status is tracked on objectives.independence_confirmed field.
 */
// UI tracks independence per team member as affirmed | pending | exception_noted.
// The DB stores affirmed | conflict | recused (one row = a submitted status;
// "pending" = no row). Map between the two vocabularies here.
type UiAffirmStatus = 'affirmed' | 'pending' | 'exception_noted';

export interface IndependenceAffirmation {
  id: string;
  engagement_id: string;
  user_id: string;
  status: UiAffirmStatus;
  created_at: string;
  updated_at: string;
}

function toUiAffirmation(row: Record<string, unknown>): IndependenceAffirmation {
  const dbStatus = row.status as string;
  return {
    id: row.id as string,
    engagement_id: row.engagement_id as string,
    user_id: row.user_id as string,
    status: dbStatus === 'affirmed' ? 'affirmed' : 'exception_noted',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function listAffirmations(engagementId: string): Promise<IndependenceAffirmation[]> {
  const rows = await db('independence_affirmations').where({ engagement_id: engagementId });
  return rows.map(toUiAffirmation);
}

export async function getPlanningRecord(engagementId: string): Promise<{
  planning_record: PlanningRecord | null;
  objectives: Objective[];
  independence_affirmations: IndependenceAffirmation[];
}> {
  const pr = await db('planning_records')
    .where({ engagement_id: engagementId })
    .first();

  const independence_affirmations = await listAffirmations(engagementId);

  if (!pr) {
    return { planning_record: null, objectives: [], independence_affirmations };
  }

  const objectives = await db('objectives')
    .where({ engagement_id: engagementId, status: 'active' })
    .orderBy('display_order', 'asc');

  return {
    planning_record: toPlanningRecord(pr),
    objectives: objectives.map(toObjective),
    independence_affirmations,
  };
}

// Persist independence affirmations for team members (Gate P2 prerequisite).
// status 'pending' removes any existing row; affirmed/exception_noted upsert one.
export async function setIndependenceAffirmations(
  engagementId: string,
  affirmations: Array<{ user_id: string; status: UiAffirmStatus }>,
  actorId: string
): Promise<{ independence_affirmations: IndependenceAffirmation[] }> {
  for (const a of affirmations) {
    if (a.status === 'pending') {
      await db('independence_affirmations')
        .where({ engagement_id: engagementId, user_id: a.user_id })
        .delete();
    } else {
      const dbStatus = a.status === 'affirmed' ? 'affirmed' : 'conflict';
      await db('independence_affirmations')
        .insert({ engagement_id: engagementId, user_id: a.user_id, status: dbStatus })
        .onConflict(['engagement_id', 'user_id'])
        .merge({ status: dbStatus, updated_at: db.fn.now() });
    }
  }

  await db('audit_events').insert({
    engagement_id: engagementId,
    actor_id: actorId,
    action: 'INDEPENDENCE_STATUS_UPDATED',
    object_type: 'engagement',
    object_id: engagementId,
    summary: `Independence status updated for ${affirmations.length} team member(s).`,
  });

  return { independence_affirmations: await listAffirmations(engagementId) };
}

/**
 * Create or update a planning record in Draft status.
 */
export async function upsertPlanningRecord(
  engagementId: string,
  data: {
    design_approach?: string;
    schedule_notes?: string;
    risk_notes?: string;
    data_reliability_notes?: string;
  },
  actorId: string
): Promise<PlanningRecord> {
  const existing = await db('planning_records')
    .where({ engagement_id: engagementId })
    .first();

  if (!existing) {
    // Create new planning record in draft status
    const [inserted] = await db('planning_records')
      .insert({
        engagement_id: engagementId,
        status: 'draft',
        design_approach: data.design_approach ?? null,
        schedule_notes: data.schedule_notes ?? null,
        risk_notes: data.risk_notes ?? null,
        data_reliability_notes: data.data_reliability_notes ?? null,
        created_by: actorId,
      })
      .returning('*');
    return toPlanningRecord(inserted);
  }

  // Update existing record — allow update regardless of status (revision workflow)
  const updateData: Record<string, unknown> = { updated_at: db.fn.now() };
  if (data.design_approach !== undefined) updateData.design_approach = data.design_approach;
  if (data.schedule_notes !== undefined) updateData.schedule_notes = data.schedule_notes;
  if (data.risk_notes !== undefined) updateData.risk_notes = data.risk_notes;
  if (data.data_reliability_notes !== undefined) updateData.data_reliability_notes = data.data_reliability_notes;

  const [updated] = await db('planning_records')
    .where({ engagement_id: engagementId })
    .update(updateData)
    .returning('*');

  return toPlanningRecord(updated);
}

/**
 * Submit planning record: transitions draft → ready_for_review.
 */
export async function submitPlanningRecord(engagementId: string): Promise<PlanningRecord> {
  const pr = await db('planning_records')
    .where({ engagement_id: engagementId })
    .first();

  if (!pr) {
    throw Object.assign(new Error('No planning record found.'), { status: 404 });
  }

  if (pr.status !== 'draft') {
    throw Object.assign(
      new Error('Planning record can only be submitted from Draft status.'),
      { status: 409 }
    );
  }

  const [updated] = await db('planning_records')
    .where({ engagement_id: engagementId })
    .update({ status: 'ready_for_review', updated_at: db.fn.now() })
    .returning('*');

  return toPlanningRecord(updated);
}

/**
 * Add an objective to an engagement.
 */
export async function addObjective(
  engagementId: string,
  actorId: string,
  data: { objective_text: string; information_need?: string }
): Promise<Objective> {
  if (!data.objective_text || data.objective_text.trim().length === 0) {
    throw Object.assign(new Error('objective_text is required.'), { status: 422 });
  }

  // Compute next display_order
  const maxResult = await db('objectives')
    .where({ engagement_id: engagementId })
    .max('display_order as max_order')
    .first();

  const nextOrder = ((maxResult?.max_order as number | null) ?? 0) + 1;

  const [inserted] = await db('objectives')
    .insert({
      engagement_id: engagementId,
      objective_text: data.objective_text.trim(),
      information_need: data.information_need ?? null,
      display_order: nextOrder,
      created_by: actorId,
      status: 'active',
    })
    .returning('*');

  return toObjective(inserted);
}

/**
 * Update an existing objective.
 */
export async function updateObjective(
  engagementId: string,
  objectiveId: string,
  data: { objective_text?: string; information_need?: string; sort_order?: number }
): Promise<Objective> {
  const objective = await db('objectives')
    .where({ id: objectiveId, engagement_id: engagementId })
    .first();

  if (!objective) {
    throw Object.assign(new Error('Objective not found.'), { status: 404 });
  }

  if (data.objective_text !== undefined && data.objective_text.trim().length === 0) {
    throw Object.assign(new Error('objective_text cannot be empty.'), { status: 422 });
  }

  const updateData: Record<string, unknown> = { updated_at: db.fn.now() };
  if (data.objective_text !== undefined) updateData.objective_text = data.objective_text.trim();
  if (data.information_need !== undefined) updateData.information_need = data.information_need;
  if (data.sort_order !== undefined) updateData.display_order = data.sort_order;

  const [updated] = await db('objectives')
    .where({ id: objectiveId, engagement_id: engagementId })
    .update(updateData)
    .returning('*');

  return toObjective(updated);
}

/**
 * Delete an objective (soft-delete via status='closed').
 * Block if objective has linked evidence items.
 */
export async function deleteObjective(
  engagementId: string,
  objectiveId: string
): Promise<void> {
  const objective = await db('objectives')
    .where({ id: objectiveId, engagement_id: engagementId })
    .first();

  if (!objective) {
    throw Object.assign(new Error('Objective not found.'), { status: 404 });
  }

  // Check for linked evidence items
  const linkedEvidence = await db('objective_evidence_links')
    .where({ objective_id: objectiveId })
    .count('id as cnt')
    .first();

  if (linkedEvidence && parseInt(String(linkedEvidence.cnt ?? 0), 10) > 0) {
    throw Object.assign(
      new Error('Cannot delete this objective — it has linked evidence items. Unlink evidence first.'),
      { status: 409 }
    );
  }

  // Soft-delete: mark as closed
  await db('objectives')
    .where({ id: objectiveId, engagement_id: engagementId })
    .update({ status: 'closed', updated_at: db.fn.now() });
}

/**
 * Record Gate P2 decision — approved locks planning record, returned sets back to draft.
 * Validates prerequisites before proceeding.
 */
export async function recordP2Decision(
  engagementId: string,
  data: { decision: 'approved' | 'returned'; comment?: string },
  actorId: string
): Promise<{ gate_decision: Record<string, unknown>; planning_record: PlanningRecord }> {
  // Validate decision value
  if (!data.decision || !['approved', 'returned'].includes(data.decision)) {
    throw Object.assign(
      new Error('Decision must be "approved" or "returned".'),
      { status: 422 }
    );
  }

  // Validate comment — required and ≥10 chars
  if (!data.comment || data.comment.trim().length < 10) {
    throw Object.assign(
      new Error('Decision comment must be at least 10 characters.'),
      { status: 422 }
    );
  }

  // Re-run prerequisites check (server-side re-validation)
  const prereqResult = await checkP2Prerequisites(engagementId);
  if (!prereqResult.all_pass) {
    const failedPrerequisites = prereqResult.prerequisites.filter((p) => !p.pass);
    throw Object.assign(
      new Error('P2 prerequisites not met.'),
      { status: 422, failed_prerequisites: failedPrerequisites }
    );
  }

  // Verify planning record is in ready_for_review
  const pr = await db('planning_records')
    .where({ engagement_id: engagementId })
    .first();

  if (!pr) {
    throw Object.assign(new Error('No planning record found.'), { status: 404 });
  }

  if (pr.status !== 'ready_for_review') {
    throw Object.assign(
      new Error('Planning record is not submitted for review.'),
      { status: 409 }
    );
  }

  // Execute in DB transaction
  return db.transaction(async (trx) => {
    const now = new Date();

    // 1. Insert gate_decision
    const [gateDecisionRow] = await trx('gate_decisions')
      .insert({
        engagement_id: engagementId,
        gate_type: 'P2',
        status: data.decision === 'approved' ? 'passed' : 'returned',
        decided_by: actorId,
        decided_at: now,
        rationale: data.comment!.trim(),
        comment: data.comment!.trim(),
      })
      .returning('*');

    // 2. Write audit event
    const actionCode = data.decision === 'approved' ? 'GATE_P2_APPROVED' : 'GATE_P2_RETURNED';
    await trx('audit_events').insert({
      engagement_id: engagementId,
      actor_id: actorId,
      action: actionCode,
      object_type: 'planning_record',
      object_id: pr.id,
      summary: data.decision === 'approved'
        ? 'Gate P2 approved — planning record locked.'
        : 'Gate P2 returned — planning record sent back to draft.',
      after_state: JSON.stringify({ decision: data.decision, comment: data.comment }),
    });

    let updatedPlanningRecord: PlanningRecord;

    if (data.decision === 'approved') {
      // 3a. On approval: set planning_record.status = 'approved', advance engagement.phase to 'evidence'
      const [updatedPr] = await trx('planning_records')
        .where({ engagement_id: engagementId })
        .update({ status: 'approved', updated_at: now })
        .returning('*');
      updatedPlanningRecord = toPlanningRecord(updatedPr);

      await trx('engagements')
        .where({ id: engagementId })
        .update({ phase: 'evidence', updated_at: now });
    } else {
      // 3b. On returned: set planning_record.status back to 'draft'
      const [updatedPr] = await trx('planning_records')
        .where({ engagement_id: engagementId })
        .update({ status: 'draft', updated_at: now })
        .returning('*');
      updatedPlanningRecord = toPlanningRecord(updatedPr);
    }

    const gate_decision = {
      id: gateDecisionRow.id,
      engagement_id: gateDecisionRow.engagement_id,
      gate_type: gateDecisionRow.gate_type,
      status: gateDecisionRow.status,
      decided_by: gateDecisionRow.decided_by,
      decided_at: gateDecisionRow.decided_at instanceof Date
        ? (gateDecisionRow.decided_at as Date).toISOString()
        : gateDecisionRow.decided_at,
      rationale: gateDecisionRow.rationale,
      comment: gateDecisionRow.comment,
    };

    return { gate_decision, planning_record: updatedPlanningRecord };
  });
}

/**
 * Request a revision to an approved planning record.
 * Writes an audit event and a planning_revision row.
 * The planning record status reverts to 'draft' to allow editing.
 */
export async function requestRevision(
  engagementId: string,
  data: { revision_note: string },
  actorId: string
): Promise<PlanningRecord> {
  if (!data.revision_note || data.revision_note.trim().length < 10) {
    throw Object.assign(
      new Error('Revision note must be at least 10 characters.'),
      { status: 422 }
    );
  }

  const pr = await db('planning_records')
    .where({ engagement_id: engagementId })
    .first();

  if (!pr) {
    throw Object.assign(new Error('No planning record found.'), { status: 404 });
  }

  if (pr.status !== 'approved') {
    throw Object.assign(
      new Error('Only approved planning records can have a revision requested.'),
      { status: 409 }
    );
  }

  // Write audit event
  await db('audit_events').insert({
    engagement_id: engagementId,
    actor_id: actorId,
    action: 'PLANNING_REVISION_REQUESTED',
    object_type: 'planning_record',
    object_id: pr.id,
    summary: 'Revision requested for approved planning record.',
    after_state: JSON.stringify({ revision_note: data.revision_note.trim() }),
  });

  // Write planning_revision row
  await db('planning_revisions').insert({
    planning_record_id: pr.id,
    revision_note: data.revision_note.trim(),
    revised_by: actorId,
  });

  // Revert planning record to draft to allow editing
  const [updated] = await db('planning_records')
    .where({ engagement_id: engagementId })
    .update({ status: 'draft', updated_at: db.fn.now() })
    .returning('*');

  return toPlanningRecord(updated);
}
