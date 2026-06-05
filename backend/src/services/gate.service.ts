import { db } from '../db';

export type A1Decision = 'approved' | 'declined';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface GateDecision {
  id: string;
  request_id: string;
  gate_name: string;
  decision: A1Decision;
  risk_level: RiskLevel | null;
  rationale: string;
  decided_by: string;
  decided_at: string;
}

export interface EngagementShell {
  id: string;
  job_code: string;
  phase: string;
  status: string;
  owner_id: string;
  request_id: string;
  created_at: string;
}

function formatJobCode(seq: number, decisionDate: Date): string {
  const year = decisionDate.getFullYear();
  return `ENG-${year}-${String(seq).padStart(5, '0')}`;
}

export async function recordA1Decision(
  requestId: string,
  data: {
    decision: A1Decision;
    risk_level?: string;
    rationale: string;
  },
  actorId: string,
  actorRoles: string[]
): Promise<{ gate_decision: GateDecision; engagement?: EngagementShell }> {
  // --- Validation ---
  const validDecisions = ['approved', 'declined'];
  if (!data.decision || !validDecisions.includes(data.decision)) {
    throw Object.assign(new Error('decision must be "approved" or "declined"'), {
      status: 422,
      fields: ['decision'],
    });
  }

  const missingFields: string[] = [];

  if (data.decision === 'approved') {
    const validRiskLevels = ['low', 'medium', 'high'];
    if (!data.risk_level || !validRiskLevels.includes(data.risk_level)) {
      missingFields.push('risk_level');
    }
    if (!data.rationale || data.rationale.trim().length < 10) {
      missingFields.push('rationale');
    }
  } else {
    // declined
    if (!data.rationale || data.rationale.trim().length < 10) {
      missingFields.push('rationale');
    }
  }

  if (missingFields.length > 0) {
    throw Object.assign(
      new Error(
        data.decision === 'approved'
          ? 'Risk level and rationale (min 10 chars) required for approval'
          : 'Rationale (min 10 chars) required for decline'
      ),
      { status: 422, fields: missingFields }
    );
  }

  // --- Check request exists and is submitted ---
  const request = await db('requests').where({ id: requestId }).first();
  if (!request) {
    throw Object.assign(new Error('Request not found'), { status: 404 });
  }
  if (request.status !== 'submitted') {
    throw Object.assign(
      new Error('A1 decision can only be recorded on a submitted request'),
      { status: 409 }
    );
  }

  // --- Atomic transaction ---
  return db.transaction(async (trx) => {
    const now = new Date();
    const newStatus = data.decision === 'approved' ? 'accepted' : 'declined';

    // 1. Update request status
    await trx('requests')
      .where({ id: requestId })
      .update({ status: newStatus, updated_at: trx.fn.now() });

    let engagement: EngagementShell | undefined;
    let engagementId: string | undefined;

    if (data.decision === 'approved') {
      // 2. Determine next sequence number for job_code within the transaction
      const countResult = await trx('engagements').count('id as cnt').first();
      const seq = (parseInt(String(countResult?.cnt ?? 0), 10) || 0) + 1;
      const job_code = formatJobCode(seq, now);

      // 3. Auto-create Engagement shell on approval
      const [engRow] = await trx('engagements')
        .insert({
          request_id: requestId,
          title: request.topic ?? `Engagement from request ${requestId}`,
          phase: 'planning',
          status: 'active',
          risk_level: data.risk_level,
          owner_id: request.created_by,
          created_by: actorId,
          job_code,
        })
        .returning('*');

      engagementId = engRow.id;

      engagement = {
        id: engRow.id,
        job_code: engRow.job_code,
        phase: 'planning',
        status: 'active',
        owner_id: request.created_by,
        request_id: requestId,
        created_at: engRow.created_at instanceof Date
          ? engRow.created_at.toISOString()
          : engRow.created_at,
      };

      // 4. Create immutable GateDecision record (only possible on approve — engagement_id NOT NULL in schema)
      const [gateDecisionRow] = await trx('gate_decisions')
        .insert({
          engagement_id: engagementId,
          gate_type: 'A1',
          status: 'passed',
          decided_by: actorId,
          decided_at: now,
          rationale: data.rationale.trim(),
          comment: `risk_level:${data.risk_level}`,
        })
        .returning('*');

      // Build GateDecision response shape matching API contract
      const gate_decision: GateDecision = {
        id: gateDecisionRow.id,
        request_id: requestId,
        gate_name: 'A1',
        decision: 'approved',
        risk_level: data.risk_level as RiskLevel,
        rationale: gateDecisionRow.rationale,
        decided_by: gateDecisionRow.decided_by,
        decided_at: gateDecisionRow.decided_at instanceof Date
          ? gateDecisionRow.decided_at.toISOString()
          : gateDecisionRow.decided_at,
      };

      // 5. Write GATE_A1_APPROVED audit event
      await trx('audit_events').insert({
        engagement_id: engagementId,
        request_id: requestId,
        actor_id: actorId,
        action: 'GATE_A1_APPROVED',
        object_type: 'request',
        object_id: requestId,
        summary: `Gate A1 approved. Risk level: ${data.risk_level}. Engagement ${job_code} created.`,
        after_state: JSON.stringify({
          decision: 'approved',
          risk_level: data.risk_level,
          rationale: data.rationale.trim(),
          engagement_id: engagementId,
          job_code,
          actor_roles: actorRoles,
        }),
      });

      return { gate_decision, engagement };
    } else {
      // Declined path: no engagement, so gate_decisions row cannot be stored (engagement_id NOT NULL)
      // Build synthetic GateDecision from audit event data to satisfy API contract

      // 5. Write GATE_A1_DECLINED audit event
      await trx('audit_events').insert({
        engagement_id: null,
        request_id: requestId,
        actor_id: actorId,
        action: 'GATE_A1_DECLINED',
        object_type: 'request',
        object_id: requestId,
        summary: `Gate A1 declined. Rationale recorded.`,
        after_state: JSON.stringify({
          decision: 'declined',
          rationale: data.rationale.trim(),
          actor_roles: actorRoles,
        }),
      });

      // Return synthetic gate_decision object (not from gate_decisions table — constraint prevents it)
      const gate_decision: GateDecision = {
        id: `declined-${requestId}-${now.getTime()}`,
        request_id: requestId,
        gate_name: 'A1',
        decision: 'declined',
        risk_level: null,
        rationale: data.rationale.trim(),
        decided_by: actorId,
        decided_at: now.toISOString(),
      };

      return { gate_decision };
    }
  });
}
