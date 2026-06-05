import { CheckCircle, XCircle, Clock, RotateCcw, Circle, Lock } from 'lucide-react';
import type { GateDecision } from '@/lib/engagements.api';

type GateName = 'A1' | 'P2' | 'P3' | 'P4';

export interface GateStatusCardProps {
  gate: GateName;
  decision?: GateDecision;
  locked?: boolean;
}

interface OutcomeStyle {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  label: string;
  icon: React.ReactNode;
}

function getOutcomeStyle(decision?: GateDecision, locked?: boolean): OutcomeStyle {
  if (locked) {
    return {
      border: 'border-l-4 border-l-slate-200',
      bg: 'bg-slate-100',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-600',
      label: 'Locked',
      icon: <Lock size={14} className="text-gray-400" />,
    };
  }
  if (!decision) {
    return {
      border: 'border-l-4 border-l-slate-300',
      bg: 'bg-white',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-600',
      label: 'Not Started',
      icon: <Circle size={14} className="text-gray-400" />,
    };
  }

  const d = decision.decision?.toLowerCase();

  if (d === 'approved' || d === 'approve') {
    return {
      border: 'border-l-4 border-l-emerald-500',
      bg: 'bg-emerald-50',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      label: 'Approved',
      icon: <CheckCircle size={14} className="text-emerald-600" />,
    };
  }
  if (d === 'returned' || d === 'return' || d === 'return_for_revision') {
    return {
      border: 'border-l-4 border-l-amber-500',
      bg: 'bg-amber-50',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      label: 'Returned',
      icon: <RotateCcw size={14} className="text-amber-500" />,
    };
  }
  if (d === 'declined' || d === 'decline') {
    return {
      border: 'border-l-4 border-l-red-600',
      bg: 'bg-red-50',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      label: 'Declined',
      icon: <XCircle size={14} className="text-red-600" />,
    };
  }
  if (d === 'pending' || d === 'ready_for_review') {
    return {
      border: 'border-l-4 border-l-yellow-500',
      bg: 'bg-yellow-50',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      label: 'Pending',
      icon: <Clock size={14} className="text-yellow-500" />,
    };
  }

  // Default fallback
  return {
    border: 'border-l-4 border-l-slate-300',
    bg: 'bg-white',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    label: decision.decision ?? 'Not Started',
    icon: <Circle size={14} className="text-gray-400" />,
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function GateStatusCard({ gate, decision, locked }: GateStatusCardProps) {
  const style = getOutcomeStyle(decision, locked);

  return (
    <div
      role="region"
      aria-label={`Gate ${gate} — ${style.label}`}
      className={`${style.border} ${style.bg} border border-slate-200 rounded-lg p-4 min-w-[160px]`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-foreground">{gate}</span>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${style.badgeBg} ${style.badgeText}`}>
          {style.icon}
          {style.label}
        </span>
      </div>

      {decision && !locked && (
        <>
          {decision.decided_by && (
            <p className="text-xs text-muted-foreground">{decision.decided_by}</p>
          )}
          {decision.decided_at && (
            <p className="text-xs text-muted-foreground">{formatDate(decision.decided_at)}</p>
          )}
          {decision.rationale && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {decision.rationale.length > 100
                ? `${decision.rationale.slice(0, 100)}…`
                : decision.rationale}
            </p>
          )}
          <button
            type="button"
            className="text-xs text-blue-600 mt-2 hover:underline focus:outline-none"
            onClick={(e) => e.preventDefault()}
          >
            History ▾
          </button>
        </>
      )}

      {locked && (
        <p className="text-xs text-muted-foreground mt-1">Gate prerequisites not met</p>
      )}
    </div>
  );
}
