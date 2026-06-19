import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { DiscrepancyPanel } from '@/components/statements/DiscrepancyPanel';
import { AnalystCorrectionNotice } from '@/components/statements/AnalystCorrectionNotice';
import { ReferenceCheckDecisionPanel } from '@/components/statements/ReferenceCheckDecisionPanel';
import type { UpdateStatementInput, TeamMember, Statement as DecisionStatement } from '@/components/statements/ReferenceCheckDecisionPanel';
import { StatementEvidenceList } from '@/components/statements/StatementEvidenceList';
import type { EvidenceItem } from '@/components/statements/StatementEvidenceList';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatementData {
  id: string;
  draft_product_id: string;
  engagement_id: string;
  statement_text: string;
  ref_status: 'not_started' | 'in_review' | 'passed' | 'failed';
  display_order: number;
  assigned_to: string | null;
  assigned_ir_name: string | null;
  assigned_back_to?: string | null;
  discrepancy_type?: string | null;
  discrepancy_notes?: string | null;
  evidence_ids: string[];
  evidence_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TeamAssignment {
  id: string;
  engagement_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  user: { display_name: string; email: string };
}

// ─── Reference Status Badge ────────────────────────────────────────────────────

function ReferenceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-600',
    in_review: 'bg-yellow-100 text-yellow-800',
    passed: 'bg-green-100 text-green-800 border border-emerald-600',
    failed: 'bg-red-100 text-red-700 border border-red-600',
    waived: 'bg-gray-100 text-gray-600 border border-dashed border-gray-300',
  };
  const labels: Record<string, string> = {
    not_started: 'Not Started',
    in_review: 'In Review',
    passed: 'Passed',
    failed: 'Failed',
    waived: 'Waived',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StatementDetailPage() {
  const { id: engagementId, statementId } = useParams<{ id: string; statementId: string }>();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [statement, setStatement] = useState<StatementData | null>(null);
  const [allStatements, setAllStatements] = useState<StatementData[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AN correction state
  const [revisionChecked, setRevisionChecked] = useState(false);
  const [revisionConfirming, setRevisionConfirming] = useState(false);
  const [sendingRevision, setSendingRevision] = useState(false);
  const [revisionSent, setRevisionSent] = useState(false);

  const roles = user?.roles ?? [];
  const isIR = roles.includes('IR');
  const isAN = roles.includes('AN');

  // Role-gated views
  // IR panel: show for any IR user (assigned_to check was too strict — prevents unassigned IR from reviewing)
  const isIRView = isIR;
  const isANView = isAN && statement?.assigned_back_to === user?.id;

  // Load statement, team members, evidence
  const loadData = useCallback(async () => {
    if (!engagementId || !statementId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch all statements for this engagement (list endpoint only)
      const statementsRes = await api.get<{ statements: StatementData[]; total: number }>(
        `/api/engagements/${engagementId}/statements`
      );
      if (!statementsRes.ok) {
        setError('Failed to load statement.');
        return;
      }
      const stmts = statementsRes.data.statements;
      const found = stmts.find((s) => s.id === statementId) ?? null;
      setAllStatements(stmts);
      setStatement(found);

      if (!found) {
        setError('Statement not found.');
        return;
      }

      // Fetch evidence detail for linked evidence
      if (found.evidence_ids.length > 0) {
        const evidenceRes = await api.get<{ evidence: Array<{
          id: string;
          evidence_type: string;
          source: string;
          sensitivity: 'standard' | 'restricted';
          sequence?: number;
        }>; total: number }>(
          `/api/engagements/${engagementId}/evidence`
        );
        if (evidenceRes.ok) {
          const linkedItems = evidenceRes.data.evidence.filter((e) =>
            found.evidence_ids.includes(e.id)
          );
          setEvidenceItems(
            linkedItems.map((e, idx) => ({
              id: e.id,
              sequence: e.sequence ?? idx + 1,
              evidence_type: e.evidence_type,
              source: e.source,
              sensitivity: e.sensitivity,
            }))
          );
        }
      } else {
        setEvidenceItems([]);
      }

      // Fetch team members for AssignBackTo select
      const teamRes = await api.get<{ assignments: TeamAssignment[] }>(
        `/api/engagements/${engagementId}/team`
      );
      if (teamRes.ok) {
        // Group assignments by user_id to collect all roles per user
        const userMap = new Map<string, TeamMember>();
        for (const a of teamRes.data.assignments) {
          if (!userMap.has(a.user_id)) {
            userMap.set(a.user_id, {
              id: a.user_id,
              display_name: a.user.display_name || a.user.email,
              roles: [a.role],
            });
          } else {
            userMap.get(a.user_id)!.roles.push(a.role);
          }
        }
        setTeamMembers(Array.from(userMap.values()));
      }
    } finally {
      setLoading(false);
    }
  }, [engagementId, statementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Navigation helpers ──────────────────────────────────────────────────────

  const currentIndex = allStatements.findIndex((s) => s.id === statementId);

  const handleNavigatePrev = () => {
    if (currentIndex > 0) {
      const prev = allStatements[currentIndex - 1];
      navigate(`/engagements/${engagementId}/draft/statements/${prev.id}`);
    }
  };

  const handleNavigateNext = () => {
    // Find next unreviewed (not_started first, then in_review)
    const notStarted = allStatements.find(
      (s) => s.id !== statementId && s.ref_status === 'not_started' && s.assigned_to === user?.id
    );
    const inReview = allStatements.find(
      (s) => s.id !== statementId && s.ref_status === 'in_review' && s.assigned_to === user?.id
    );
    const next = notStarted ?? inReview;
    if (next) {
      navigate(`/engagements/${engagementId}/draft/statements/${next.id}`);
    } else {
      toast({ title: 'No more statements pending your review.' });
    }
  };

  // ─── Save handlers ────────────────────────────────────────────────────────────

  const handleSave = async (data: UpdateStatementInput) => {
    if (!engagementId || !statementId) return;
    const res = await api.patch<{ statement: StatementData }>(
      `/api/engagements/${engagementId}/statements/${statementId}`,
      {
        ref_status: data.ref_status,
        discrepancy_notes: data.discrepancy_notes,
        assigned_to: data.assigned_back_to ?? undefined,
      }
    );
    if (res.ok) {
      const newStatus = data.ref_status;
      const assignedName = data.assigned_back_to
        ? (teamMembers.find((m) => m.id === data.assigned_back_to)?.display_name ?? 'analyst')
        : null;
      if (newStatus === 'passed') {
        toast({ title: 'Statement passed.' });
      } else if (newStatus === 'failed' && assignedName) {
        toast({ title: `Statement failed and assigned to ${assignedName}.` });
      } else if (newStatus === 'failed') {
        toast({ title: 'Statement marked as failed.' });
      } else {
        toast({ title: 'Status saved.' });
      }
      await loadData();
    } else {
      toast({ title: res.error ?? 'Failed to save status.', variant: 'destructive' });
      throw new Error(res.error ?? 'Save failed');
    }
  };

  // ─── AN Revision Ready handler ────────────────────────────────────────────────

  const handleRevisionConfirm = async () => {
    if (!engagementId || !statementId) return;
    setSendingRevision(true);
    try {
      const res = await api.patch<{ statement: StatementData }>(
        `/api/engagements/${engagementId}/statements/${statementId}`,
        { ref_status: 'in_review', assigned_to: statement?.assigned_to ?? undefined }
      );
      if (res.ok) {
        const irName = statement?.assigned_ir_name ?? 'referencer';
        toast({ title: `Sent back to referencer (${irName}).` });
        setRevisionSent(true);
        setRevisionConfirming(false);
        setRevisionChecked(false);
        await loadData();
      } else {
        toast({ title: res.error ?? 'Failed to send back.', variant: 'destructive' });
      }
    } finally {
      setSendingRevision(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-sm text-muted-foreground">Loading statement...</span>
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        {error ?? 'Statement not found.'}
      </div>
    );
  }

  const decisionStatement: DecisionStatement = {
    id: statement.id,
    ref_status: statement.ref_status,
    discrepancy_type: statement.discrepancy_type ?? null,
    discrepancy_notes: statement.discrepancy_notes ?? null,
    assigned_back_to: statement.assigned_back_to ?? null,
  };

  return (
    <div className="space-y-6 py-4 max-w-3xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link
              to={`/engagements/${engagementId}/draft/statements`}
              className="text-primary hover:underline"
            >
              Statements
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="font-medium text-foreground">
            Statement {statement.display_order}
          </li>
        </ol>
      </nav>

      {/* Assignment line */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {statement.assigned_ir_name && (
          <span>Assigned to: <span className="font-medium text-foreground">{statement.assigned_ir_name} (IR)</span></span>
        )}
        {statement.assigned_ir_name && <span aria-hidden="true">·</span>}
        <span>
          Status: <ReferenceStatusBadge status={statement.ref_status} />
        </span>
      </div>

      {/* AN Correction View — AnalystCorrectionNotice */}
      {isANView && statement.discrepancy_type && (
        <AnalystCorrectionNotice
          type={statement.discrepancy_type}
          notes={statement.discrepancy_notes ?? ''}
          failedBy={statement.assigned_ir_name ?? 'Independent Referencer'}
          failedAt={statement.updated_at}
        />
      )}

      {/* Statement Text */}
      <section aria-label="Statement text">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Statement Text
        </h2>
        <div className="border border-border rounded-md p-4 bg-background text-sm leading-relaxed">
          {statement.statement_text}
        </div>
      </section>

      <Separator />

      {/* Linked Evidence */}
      <section aria-label="Linked evidence">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Linked Evidence
        </h2>
        <div className="border border-border rounded-md p-4 bg-background">
          <StatementEvidenceList evidence={evidenceItems} engagementId={engagementId} />
        </div>
      </section>

      {/* ─── Role-conditional Section 3 ─── */}

      {/* IR Decision Panel */}
      {isIRView && (
        <>
          <Separator />
          {/* If failed, show DiscrepancyPanel above decision panel */}
          {statement.ref_status === 'failed' && statement.discrepancy_notes && (
            <DiscrepancyPanel
              type={statement.discrepancy_type ?? 'Unknown'}
              notes={statement.discrepancy_notes}
            />
          )}
          <ReferenceCheckDecisionPanel
            statement={decisionStatement}
            engagementId={engagementId ?? ''}
            teamMembers={teamMembers}
            onSave={handleSave}
            onNavigateNext={handleNavigateNext}
            onNavigatePrev={handleNavigatePrev}
            isFirst={currentIndex <= 0}
            isLast={currentIndex >= allStatements.length - 1}
          />
        </>
      )}

      {/* AN Correction View — Mark Revision Ready */}
      {isANView && (
        <>
          <Separator />
          <section aria-label="Revision ready">
            {/* Mark as Revision Ready Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mark-revision-ready"
                  checked={revisionChecked}
                  onCheckedChange={(checked) => {
                    setRevisionChecked(!!checked);
                    setRevisionConfirming(!!checked);
                  }}
                  aria-label="Mark as revision ready and send back to referencer for re-check"
                />
                <label htmlFor="mark-revision-ready" className="text-sm cursor-pointer">
                  Mark as Revision Ready — Send Back to Referencer
                </label>
              </div>

              {/* Inline confirmation */}
              {revisionConfirming && !revisionSent && (
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-sm text-muted-foreground">Send back to referencer?</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRevisionChecked(false);
                      setRevisionConfirming(false);
                    }}
                    disabled={sendingRevision}
                  >
                    Keep Editing
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRevisionConfirm}
                    disabled={sendingRevision}
                  >
                    {sendingRevision ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />
                        Sending to reviewer...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </div>
              )}

              {/* Post-send banner */}
              {revisionSent && (
                <div
                  role="status"
                  className="ml-6 text-sm text-green-700 bg-green-50 rounded px-3 py-2"
                >
                  Sent back to referencer ({statement.assigned_ir_name ?? 'referencer'}).
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Read-only view — DiscrepancyPanel if failed */}
      {!isIRView && !isANView && statement.ref_status === 'failed' && statement.discrepancy_notes && (
        <>
          <Separator />
          <DiscrepancyPanel
            type={statement.discrepancy_type ?? 'Unknown'}
            notes={statement.discrepancy_notes}
          />
        </>
      )}
    </div>
  );
}
