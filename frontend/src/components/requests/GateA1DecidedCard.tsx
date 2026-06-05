import { cn } from '@/lib/utils';

interface GateDecisionData {
  id: string;
  decision: 'approved' | 'declined';
  risk_level: string | null;
  rationale: string;
  decided_by_name?: string;
  decided_at: string;
}

const RISK_BADGE_STYLES: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-700',
};

const DECISION_CHIP: Record<string, { label: string; style: string }> = {
  approved: { label: '✓ Approved', style: 'bg-green-100 text-green-800' },
  declined: { label: '✗ Declined', style: 'bg-red-100 text-red-700' },
};

export function GateA1DecidedCard({ decision }: { decision: GateDecisionData }) {
  const chip = DECISION_CHIP[decision.decision];
  const formattedDate = new Date(decision.decided_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="bg-secondary border border-border rounded-md p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn('inline-flex px-2.5 py-0.5 rounded text-xs font-semibold', chip.style)}>
          {chip.label}
        </span>
        {decision.decision === 'approved' && decision.risk_level && (
          <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', RISK_BADGE_STYLES[decision.risk_level] ?? 'bg-gray-100 text-gray-600')}>
            Risk: {decision.risk_level.charAt(0).toUpperCase() + decision.risk_level.slice(1)}
          </span>
        )}
      </div>

      <dl className="space-y-2 text-sm">
        {decision.decided_by_name && (
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Approver</dt>
            <dd>{decision.decided_by_name}</dd>
          </div>
        )}
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">Date</dt>
          <dd>{formattedDate}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">Rationale</dt>
          <dd className="italic">"{decision.rationale}"</dd>
        </div>
      </dl>

      <a href="#audit" className="text-xs text-blue-600 hover:underline">View Gate History →</a>
    </div>
  );
}
