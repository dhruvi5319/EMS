import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { ObjectiveList } from './ObjectiveList';
import { P2ReadinessChecklist } from './P2ReadinessChecklist';
import { PlanningLockedBanner } from './PlanningLockedBanner';
import { GateP2ReviewPanel } from './GateP2ReviewPanel';
import {
  getPlanningRecord,
  upsertPlanningRecord,
  submitPlanningRecord,
  setIndependenceStatus,
  type PlanningRecord,
  type Objective,
} from '@/lib/planning.api';
import { listTeam, type TeamAssignment } from '@/lib/team.api';
import type { GateDecision } from '@/lib/engagements.api';

export interface PlanningRecordPanelProps {
  engagementId: string;
  canEdit: boolean;    // EM, AN, AD
  isQA: boolean;       // QA role — shows read-only + passes to Gate P2 Review (Plan 04-07)
  gate_decisions?: GateDecision[];
}

// ---- Sub-components ----

function ReturnCommentCard({ gate_decisions }: { gate_decisions?: GateDecision[] }) {
  const returnDecision = gate_decisions?.find(
    (d) => d.decision === 'returned'
  );
  if (!returnDecision) return null;

  const decidedAt = returnDecision.decided_at
    ? new Date(returnDecision.decided_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 px-4 py-3 rounded-r-md mb-4">
      <p className="text-sm font-medium">
        Returned for Revision —{' '}
        {returnDecision.decided_by ?? 'QA Reviewer'} (QA) · {decidedAt}
      </p>
      {(returnDecision.rationale || (returnDecision as { comment?: string }).comment) && (
        <p className="text-sm italic mt-1">
          "{(returnDecision as { comment?: string }).comment || returnDecision.rationale}"
        </p>
      )}
    </div>
  );
}

function SubmittedForReviewBanner() {
  return (
    <div className="bg-blue-100 text-blue-800 border border-blue-200 rounded-md px-4 py-3 mb-4">
      <p className="text-sm">Submitted for P2 review. Awaiting QA Reviewer.</p>
    </div>
  );
}

function SectionHeader({
  label,
  required = false,
  optional = false,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      {label}{' '}
      {required && <span className="text-red-600">*</span>}
      {optional && <span className="text-xs normal-case tracking-normal font-normal text-muted-foreground">(optional)</span>}
    </p>
  );
}

// ---- Main Component ----

export function PlanningRecordPanel({
  engagementId,
  canEdit,
  isQA,
  gate_decisions,
}: PlanningRecordPanelProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data state
  const [planningRecord, setPlanningRecord] = React.useState<PlanningRecord | null>(null);
  const [objectives, setObjectives] = React.useState<Objective[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<TeamAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form fields
  const [designApproach, setDesignApproach] = React.useState('');
  const [scheduleNotes, setScheduleNotes] = React.useState('');
  const [riskNotes, setRiskNotes] = React.useState('');
  const [dataReliabilityNotes, setDataReliabilityNotes] = React.useState('');
  const [independenceStatuses, setIndependenceStatuses] = React.useState<
    Record<string, 'affirmed' | 'pending' | 'exception_noted'>
  >({});

  // Checklist state
  const [allPrerequisitesPass, setAllPrerequisitesPass] = React.useState(false);
  const [checklistRefresh, setChecklistRefresh] = React.useState(0);

  // Action state
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [creatingRecord, setCreatingRecord] = React.useState(false);

  // Computed state
  const status = planningRecord?.status ?? null;
  const isReadOnly = status === 'ready_for_review' || status === 'approved';
  const isEditable = canEdit && !isReadOnly;
  const isApproved = status === 'approved';
  const isReturned = status === 'returned';
  const isSubmitted = status === 'ready_for_review';

  // Load data on mount
  async function loadData() {
    try {
      const [planResult, teamResult] = await Promise.all([
        getPlanningRecord(engagementId),
        listTeam(engagementId).catch(() => ({ assignments: [] })),
      ]);

      setPlanningRecord(planResult.planning_record);
      setObjectives(planResult.objectives);
      setTeamMembers(teamResult.assignments);

      // Hydrate independence radios from persisted affirmations.
      const statusMap: Record<string, 'affirmed' | 'pending' | 'exception_noted'> = {};
      for (const a of planResult.independence_affirmations ?? []) {
        statusMap[a.user_id] = a.status;
      }
      setIndependenceStatuses(statusMap);

      if (planResult.planning_record) {
        setDesignApproach(planResult.planning_record.design_approach ?? '');
        setScheduleNotes(planResult.planning_record.schedule_notes ?? '');
        setRiskNotes(planResult.planning_record.risk_notes ?? '');
        setDataReliabilityNotes(planResult.planning_record.data_reliability_notes ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load planning record.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId]);

  async function handleCreateRecord() {
    setCreatingRecord(true);
    try {
      const result = await upsertPlanningRecord(engagementId, {});
      setPlanningRecord(result.planning_record);
      toast({ description: 'Planning record created.' });
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Failed to create planning record.',
        variant: 'destructive',
      });
    } finally {
      setCreatingRecord(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      const result = await upsertPlanningRecord(engagementId, {
        design_approach: designApproach || null,
        schedule_notes: scheduleNotes || null,
        risk_notes: riskNotes || null,
        data_reliability_notes: dataReliabilityNotes || null,
      });
      setPlanningRecord(result.planning_record);
      // Persist independence affirmations for all current team members so the
      // P2 prerequisite (independence_status_complete) can be satisfied.
      if (teamMembers.length > 0) {
        await setIndependenceStatus(
          engagementId,
          teamMembers.map((m) => ({
            user_id: m.user_id,
            status: independenceStatuses[m.user_id] ?? 'pending',
          }))
        );
      }
      setChecklistRefresh((n) => n + 1);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      toast({ description: `Planning draft saved ${timeStr}.` });
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Failed to save draft.',
        variant: 'destructive',
      });
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmit() {
    if (!allPrerequisitesPass) return;
    // Save current form data first
    try {
      await upsertPlanningRecord(engagementId, {
        design_approach: designApproach || null,
        schedule_notes: scheduleNotes || null,
        risk_notes: riskNotes || null,
        data_reliability_notes: dataReliabilityNotes || null,
      });
      if (teamMembers.length > 0) {
        await setIndependenceStatus(
          engagementId,
          teamMembers.map((m) => ({
            user_id: m.user_id,
            status: independenceStatuses[m.user_id] ?? 'pending',
          }))
        );
      }
    } catch { /* continue to submit */ }

    setSubmitting(true);
    try {
      const result = await submitPlanningRecord(engagementId);
      setPlanningRecord(result.planning_record);
      toast({ description: 'Submitted for P2 review.' });
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : 'Failed to submit.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRevisionRequested() {
    // Reload after revision
    setLoading(true);
    loadData();
    setChecklistRefresh((n) => n + 1);
  }

  function handleObjectivesChange() {
    // Refresh objectives list
    getPlanningRecord(engagementId)
      .then((result) => {
        setObjectives(result.objectives);
        setChecklistRefresh((n) => n + 1);
      })
      .catch(() => {/* ignore */});
  }

  // ---- Render ----

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => {
          setError(null);
          setLoading(true);
          loadData();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty state — no planning record yet
  if (!planningRecord) {
    return (
      <div className="py-12 flex flex-col items-center text-center">
        <p className="text-base font-medium text-slate-700 mb-1">No planning record yet.</p>
        <p className="text-sm text-muted-foreground mb-6">
          Create a planning record to track objectives, design approach, and independence status.
        </p>
        {canEdit && (
          <Button onClick={handleCreateRecord} disabled={creatingRecord}>
            {creatingRecord ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              '+ Start Planning Record'
            )}
          </Button>
        )}
      </div>
    );
  }

  // QA user reviewing a submitted planning record — show Gate P2 Review Panel
  if (isQA && planningRecord?.status === 'ready_for_review') {
    return (
      <GateP2ReviewPanel
        engagementId={engagementId}
        planningRecord={planningRecord}
        objectives={objectives}
        independence_affirmations={[]}
        onDecisionRecorded={() => {
          navigate(`/engagements/${engagementId}`);
        }}
      />
    );
  }

  return (
    <div className="relative">
      {/* Locked banner (approved state) */}
      {isApproved && (
        <div className="mb-4">
          <PlanningLockedBanner
            engagementId={engagementId}
            onRevisionRequested={handleRevisionRequested}
          />
        </div>
      )}

      {/* Return comment card (returned state) */}
      {isReturned && <ReturnCommentCard gate_decisions={gate_decisions} />}

      {/* Submitted for review banner */}
      {isSubmitted && <SubmittedForReviewBanner />}

      {/* P2 Readiness Checklist — only in draft/returned (editable) states */}
      {(status === 'draft' || status === 'returned') && (
        <P2ReadinessChecklist
          engagementId={engagementId}
          mode="em"
          onAllPass={setAllPrerequisitesPass}
          refreshTrigger={checklistRefresh}
        />
      )}

      <div className="mt-4 space-y-6 pb-24">
        {/* Objectives section */}
        <section>
          <ObjectiveList
            engagementId={engagementId}
            objectives={objectives}
            canEdit={isEditable}
            onObjectivesChange={handleObjectivesChange}
          />
        </section>

        {/* Design Approach */}
        <section>
          <SectionHeader label="Design Approach" optional />
          <Textarea
            placeholder="Describe the methodology and analytical approach..."
            value={designApproach}
            onChange={(e) => setDesignApproach(e.target.value)}
            className="min-h-[100px] text-sm border-slate-200 rounded-md"
            readOnly={isReadOnly}
            aria-readonly={isReadOnly}
            style={isReadOnly ? { backgroundColor: 'hsl(210 20% 97%)' } : undefined}
          />
        </section>

        {/* Schedule Notes */}
        <section>
          <SectionHeader label="Schedule Notes" optional />
          <Textarea
            placeholder="Key dates, phases, and scheduling constraints..."
            value={scheduleNotes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            className="min-h-[100px] text-sm border-slate-200 rounded-md"
            readOnly={isReadOnly}
            aria-readonly={isReadOnly}
            style={isReadOnly ? { backgroundColor: 'hsl(210 20% 97%)' } : undefined}
          />
        </section>

        {/* Risk Notes */}
        <section>
          <SectionHeader label="Risk Notes" required />
          <Textarea
            placeholder="Document risks related to scope, timeline, or data availability..."
            value={riskNotes}
            onChange={(e) => {
              setRiskNotes(e.target.value);
            }}
            className="min-h-[100px] text-sm border-slate-200 rounded-md"
            readOnly={isReadOnly}
            aria-readonly={isReadOnly}
            style={isReadOnly ? { backgroundColor: 'hsl(210 20% 97%)' } : undefined}
          />
        </section>

        {/* Data Reliability Notes */}
        <section>
          <SectionHeader label="Data Reliability Notes" required />
          <Textarea
            placeholder="Assess reliability, completeness, and limitations of primary data sources..."
            value={dataReliabilityNotes}
            onChange={(e) => {
              setDataReliabilityNotes(e.target.value);
            }}
            className="min-h-[100px] text-sm border-slate-200 rounded-md"
            readOnly={isReadOnly}
            aria-readonly={isReadOnly}
            style={isReadOnly ? { backgroundColor: 'hsl(210 20% 97%)' } : undefined}
          />
        </section>

        {/* Independence Status */}
        <section>
          <SectionHeader label="Independence Status" required />
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members assigned. Add team members in the Team tab before setting
              independence status.
            </p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4 h-10">
                  <span className="text-sm w-40 shrink-0">
                    {member.user?.display_name ?? member.user_id}
                  </span>
                  <RadioGroup
                    value={independenceStatuses[member.user_id] ?? 'pending'}
                    onValueChange={(value) => {
                      if (!isReadOnly) {
                        setIndependenceStatuses((prev) => ({
                          ...prev,
                          [member.user_id]: value as 'affirmed' | 'pending' | 'exception_noted',
                        }));
                      }
                    }}
                    className="flex flex-row gap-6"
                    aria-required="true"
                    aria-label={`Independence status for ${member.user?.display_name}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem
                        value="affirmed"
                        id={`affirmed-${member.id}`}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`affirmed-${member.id}`} className="text-sm font-normal cursor-pointer">
                        Affirmed
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem
                        value="pending"
                        id={`pending-${member.id}`}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`pending-${member.id}`} className="text-sm font-normal cursor-pointer">
                        Pending
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem
                        value="exception_noted"
                        id={`exception-${member.id}`}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`exception-${member.id}`} className="text-sm font-normal cursor-pointer">
                        Exception Noted
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky footer — only in draft/returned state */}
      {isEditable && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
          >
            {savingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allPrerequisitesPass || submitting || savingDraft}
            aria-disabled={!allPrerequisitesPass}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for P2 Review →'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
