import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ApproveP3ConfirmDialog } from './ApproveP3ConfirmDialog';
import { ReturnP3ConfirmDialog } from './ReturnP3ConfirmDialog';

interface P3DecisionPanelProps {
  engagementId: string;
  allPrereqsPass: boolean;
  onDecisionMade: () => void;
}

export const P3DecisionPanel: React.FC<P3DecisionPanelProps> = ({
  engagementId,
  allPrereqsPass,
  onDecisionMade,
}) => {
  const [comment, setComment] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const commentLength = comment.trim().length;
  const commentValid = commentLength >= 10;
  const approveEnabled = allPrereqsPass && commentValid;
  const returnEnabled = commentValid;

  const handleApproveClick = () => {
    if (approveEnabled) {
      setApproveOpen(true);
    }
  };

  const handleReturnClick = () => {
    if (returnEnabled) {
      setReturnOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <div
        role="region"
        aria-label="Gate P3 Decision"
        style={{
          background: 'white',
          border: '1px solid hsl(214 32% 91%)',
          borderRadius: 8,
          padding: 24,
          borderLeft: '4px solid hsl(221 83% 53%)',
          marginTop: 16,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(215 16% 47%)',
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          P3 Decision
        </h3>

        {/* Decision Comment */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="p3-decision-comment"
            style={{
              fontSize: 14,
              fontWeight: 500,
              display: 'block',
              marginBottom: 6,
            }}
          >
            Decision Comment{' '}
            <span style={{ color: 'hsl(0 72% 51%)' }}>*</span>
          </label>

          <Textarea
            id="p3-decision-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., Returning — Objective 2 has no linked evidence."
            aria-required="true"
            aria-describedby="p3-comment-count"
            style={{
              minHeight: 100,
              borderColor:
                comment.length > 0 && !commentValid
                  ? 'hsl(0 72% 51%)'
                  : undefined,
            }}
          />

          {/* Char count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            {comment.length > 0 && !commentValid && (
              <span
                style={{ fontSize: 12, color: 'hsl(0 72% 51%)' }}
              >
                Minimum 10 characters.
              </span>
            )}
            {commentValid && (
              <span
                style={{ fontSize: 12, color: 'hsl(221 83% 53%)' }}
                aria-live="polite"
              >
                ●
              </span>
            )}
            <span
              id="p3-comment-count"
              aria-live="polite"
              style={{
                fontSize: 12,
                color: commentValid
                  ? 'hsl(215 16% 47%)'
                  : comment.length > 0
                  ? 'hsl(0 72% 51%)'
                  : 'hsl(215 16% 47%)',
              }}
            >
              {commentLength} / 10
            </span>
          </div>
        </div>

        {/* Button row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Return for Revision */}
          <Button
            variant="outline"
            onClick={handleReturnClick}
            disabled={!returnEnabled}
            style={{
              borderColor: 'hsl(25 90% 52%)',
              color: 'hsl(25 90% 52%)',
              height: 40,
            }}
          >
            Return for Revision
          </Button>

          {/* Approve P3 — with tooltip when disabled */}
          {approveEnabled ? (
            <Button
              onClick={handleApproveClick}
              style={{ height: 40, minWidth: 160 }}
            >
              ✓ Approve P3
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  aria-disabled="true"
                  style={{ display: 'inline-block', cursor: 'not-allowed' }}
                >
                  <Button
                    disabled
                    aria-disabled="true"
                    style={{
                      height: 40,
                      minWidth: 160,
                      pointerEvents: 'none',
                    }}
                  >
                    ✓ Approve P3
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Resolve all blocking conditions before approving Gate P3.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <ApproveP3ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        engagementId={engagementId}
        comment={comment}
        onDecisionMade={onDecisionMade}
      />

      {/* Return Dialog */}
      <ReturnP3ConfirmDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        engagementId={engagementId}
        comment={comment}
        onDecisionMade={onDecisionMade}
      />
    </TooltipProvider>
  );
};
