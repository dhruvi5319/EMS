import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface GateA1PanelProps {
  requestId: string;
  topic: string | null;
  onDecisionRecorded: (result: {
    decision: 'approved' | 'declined';
    engagement?: { id: string; job_code: string };
  }) => void;
}

type RiskLevel = 'low' | 'medium' | 'high';

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-700',
};

export function GateA1Panel({ requestId, topic, onDecisionRecorded }: GateA1PanelProps) {
  const navigate = useNavigate();
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('');
  const [rationale, setRationale] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ risk_level?: string; rationale?: string }>({});
  const [confirmAction, setConfirmAction] = useState<'approve' | 'decline' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ jobCode: string; engagementId: string } | null>(null);

  const rationaleLength = rationale.trim().length;
  const rationaleValid = rationaleLength >= 10;
  const canApprove = !!riskLevel && rationaleValid;
  const canDecline = rationaleValid;

  function handleApproveClick() {
    const errors: typeof fieldErrors = {};
    if (!riskLevel) errors.risk_level = 'Risk level is required for A1 approval.';
    if (!rationaleValid) errors.rationale = 'Minimum 10 characters.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setConfirmAction('approve');
  }

  function handleDeclineClick() {
    const errors: typeof fieldErrors = {};
    if (!rationaleValid) errors.rationale = 'Rationale is required to decline.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setConfirmAction('decline');
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      const body: Record<string, string> = {
        decision: confirmAction === 'approve' ? 'approved' : 'declined',
        rationale: rationale.trim(),
      };
      if (confirmAction === 'approve' && riskLevel) {
        body.risk_level = riskLevel;
      }

      const response = await fetch(`/api/requests/${requestId}/gate/a1`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setFieldErrors({ rationale: data.error ?? 'Decision failed. Please try again.' });
        setConfirmAction(null);
        return;
      }

      setConfirmAction(null);

      if (body.decision === 'approved' && data.engagement) {
        setSuccessBanner({
          jobCode: data.engagement.job_code,
          engagementId: data.engagement.id,
        });
        onDecisionRecorded({ decision: 'approved', engagement: data.engagement });
      } else {
        // Decline: notify parent then redirect
        onDecisionRecorded({ decision: 'declined' });
        setTimeout(() => navigate('/requests'), 300);
      }
    } catch {
      setFieldErrors({ rationale: 'Network error. Please try again.' });
      setConfirmAction(null);
    } finally {
      setProcessing(false);
    }
  }

  const truncatedTopic = topic ? (topic.length > 80 ? topic.slice(0, 80) + '…' : topic) : 'this request';

  return (
    <div>
      <Separator className="mb-4" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Gate A1: Acceptance Decision</p>

      {/* Success banner (post-approval) */}
      {successBanner && (
        <Alert
          className="mb-4 bg-green-50 border-green-200"
          role="status"
          aria-live="polite"
        >
          <AlertDescription className="text-green-800 flex items-center justify-between">
            <span>✅ Engagement <span className="font-mono font-semibold">{successBanner.jobCode}</span> created.</span>
            <a
              href={`/engagements/${successBanner.engagementId}`}
              className="text-green-800 underline ml-4 text-sm"
            >
              View Engagement Shell →
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Decision panel — 4px accent left border */}
      {!successBanner && (
        <div
          className="bg-white border border-border rounded-lg p-6"
          style={{ borderLeft: '4px solid hsl(221 83% 53%)' }}
        >
          <div className="flex items-start gap-2 mb-4 text-sm text-muted-foreground">
            <Scale size={16} className="mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
            <span>Record your acceptance decision for this request. This decision is permanent and creates an audit event.</span>
          </div>

          {/* Risk Level */}
          <div className="mb-4">
            <fieldset>
              <legend className="text-sm font-medium mb-2">
                Risk Level <span className="text-red-500">*</span>
              </legend>
              <RadioGroup
                value={riskLevel}
                onValueChange={(v) => {
                  setRiskLevel(v as RiskLevel);
                  setFieldErrors((e) => ({ ...e, risk_level: undefined }));
                }}
                className="flex flex-row gap-6"
                aria-describedby={fieldErrors.risk_level ? 'risk-error' : undefined}
              >
                {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <RadioGroupItem value={level} id={`risk-${level}`} />
                    <Label htmlFor={`risk-${level}`} className="text-sm cursor-pointer">
                      {RISK_LABELS[level]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {fieldErrors.risk_level && (
                <p id="risk-error" className="text-xs text-red-600 mt-1">{fieldErrors.risk_level}</p>
              )}
            </fieldset>
          </div>

          {/* Decision Rationale */}
          <div className="mb-4">
            <label htmlFor="rationale" className="block text-sm font-medium mb-1">
              Decision Rationale <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="rationale"
              value={rationale}
              onChange={(e) => {
                setRationale(e.target.value);
                setFieldErrors((err) => ({ ...err, rationale: undefined }));
              }}
              placeholder="e.g., Scope aligns with mandate; medium risk based on timeline and agency response capacity."
              className={cn('resize-none', fieldErrors.rationale && 'border-red-500')}
              rows={4}
              aria-describedby="rationale-count"
              aria-invalid={!!fieldErrors.rationale}
              style={{ minHeight: 100 }}
            />
            <div className="flex justify-between mt-1">
              {fieldErrors.rationale ? (
                <p className="text-xs text-red-600">{fieldErrors.rationale}</p>
              ) : <span />}
              <p
                id="rationale-count"
                className={cn(
                  'text-xs',
                  rationaleLength < 10 ? 'text-red-600' : 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {rationaleLength < 10
                  ? `${rationaleLength} / 10 minimum`
                  : `● ${rationaleLength} chars`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 justify-between">
            {/* Decline — destructive outline */}
            <button
              type="button"
              onClick={handleDeclineClick}
              aria-disabled={!canDecline}
              disabled={processing}
              className={cn(
                'px-4 py-2 rounded-md border text-sm font-medium transition-colors h-10 min-w-[160px]',
                canDecline
                  ? 'border-red-500 text-red-600 hover:bg-red-50'
                  : 'border-border text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              ✗ Decline Request
            </button>

            {/* Approve — primary accent */}
            <Button
              type="button"
              onClick={handleApproveClick}
              aria-disabled={!canApprove}
              disabled={processing || !canApprove}
              className="min-w-[180px] h-10"
            >
              ✓ Approve Request →
            </Button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog — max-width 520px */}
      <AlertDialog open={confirmAction === 'approve'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent style={{ maxWidth: 520 }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>You are about to approve this request:</p>
                <p className="font-medium text-foreground">"{truncatedTopic}"</p>
                {riskLevel && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', RISK_BADGE_STYLES[riskLevel as RiskLevel])}>
                      {RISK_LABELS[riskLevel as RiskLevel]}
                    </span>
                  </div>
                )}
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Create a new Engagement Shell (ENG-{new Date().getFullYear()}-NNNNN)</li>
                  <li>Record your decision with a timestamp</li>
                  <li className="text-foreground font-medium">This action cannot be undone.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Keep Request Pending</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={processing}
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? <><Loader2 size={14} className="mr-2 animate-spin" />Processing...</> : 'Confirm Approve ✓'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Confirmation Dialog — max-width 480px */}
      <AlertDialog open={confirmAction === 'decline'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent style={{ maxWidth: 480 }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Request</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>You are about to decline this request:</p>
                <p className="font-medium text-foreground">"{truncatedTopic}"</p>
                <p className="text-muted-foreground">No engagement will be created.</p>
                <p className="text-muted-foreground font-medium">This decision is permanent.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Keep Request Pending</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={processing}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {processing ? <><Loader2 size={14} className="mr-2 animate-spin" />Processing...</> : 'Confirm Decline ✗'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
