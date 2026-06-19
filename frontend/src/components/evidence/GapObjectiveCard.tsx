import React from 'react';
import { XCircle } from 'lucide-react';
import { SufficiencyChip } from './SufficiencyChip';
import type { CoverageObjective } from '@/hooks/useEvidence';

interface GapObjectiveCardProps {
  objective: CoverageObjective;
  milestoneDate?: string;
  onLinkClick: (objective: CoverageObjective) => void;
}

function getDaysUntil(dateStr: string): number | null {
  try {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export const GapObjectiveCard: React.FC<GapObjectiveCardProps> = ({
  objective,
  milestoneDate,
  onLinkClick,
}) => {
  const truncatedText =
    objective.objective_text.length > 100
      ? objective.objective_text.slice(0, 100) + '…'
      : objective.objective_text;

  const daysUntil = milestoneDate ? getDaysUntil(milestoneDate) : null;
  let countdownText: string | null = null;
  if (daysUntil !== null) {
    if (daysUntil < 0) {
      countdownText = 'Past milestone';
    } else {
      countdownText = `${daysUntil} days until evidence readiness milestone`;
    }
  }

  return (
    <article
      role="article"
      aria-label={`Gap: ${objective.objective_text} — no linked evidence — P3 blocker`}
      style={{
        background: 'hsl(0 72% 93%)',
        border: '2px dashed hsl(0 72% 51%)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      {/* Objective text */}
      <p
        style={{
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        {truncatedText}
      </p>

      {/* Status chips row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <SufficiencyChip status="evidence_needed" />
        {/* "🔴 None" evidence badge */}
        <span
          role="status"
          aria-label="Evidence: None"
          style={{
            background: 'hsl(0 72% 93%)',
            color: 'hsl(0 72% 38%)',
            border: '1px solid hsl(0 72% 51%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 24,
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 400,
          }}
        >
          🔴 None
        </span>
        {/* P3 Blocker indicator */}
        <span
          className="flex items-center gap-1"
          aria-label="P3 Blocker"
          style={{
            color: 'hsl(0 72% 38%)',
            fontSize: 12,
            fontWeight: 400,
          }}
        >
          <XCircle size={16} style={{ color: 'hsl(0 72% 51%)' }} />
          P3 Blocker
        </span>
      </div>

      {/* Days countdown */}
      {countdownText && (
        <p
          className="text-[12px] font-normal mb-2"
          style={{ color: 'hsl(215 16% 47%)' }}
        >
          {countdownText}
        </p>
      )}

      {/* Link button */}
      <button
        type="button"
        onClick={() => onLinkClick(objective)}
        className="text-[14px] font-normal hover:underline transition-colors"
        style={{ color: 'hsl(221 83% 53%)' }}
        aria-label={`Link evidence to: ${objective.objective_text}`}
      >
        Link →
      </button>
    </article>
  );
};
