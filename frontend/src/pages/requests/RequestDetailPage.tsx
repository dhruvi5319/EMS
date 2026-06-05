import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Pencil } from 'lucide-react';
import { useRequest } from '@/hooks/useRequests';
import { useAuthContext } from '@/context/AuthContext';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import { GateA1Panel } from '@/components/requests/GateA1Panel';
import { GateA1DecidedCard } from '@/components/requests/GateA1DecidedCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  congressional: 'Congressional Request',
  mandate: 'Mandate',
  internal: 'Internal Proposal',
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-1 md:gap-4 py-2">
      <dt className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { request, loading, error } = useRequest(id);

  const isAL = user?.roles?.some((r: string) => ['AL', 'AD'].includes(r)) ?? false;
  const canEdit = request?.status === 'draft' && isAL;

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-4">
        {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="px-6 py-6">
        <p className="text-sm text-red-600">{error ?? 'Request not found.'}</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/requests')}>
          ← Back to Requests
        </Button>
      </div>
    );
  }

  const requestTypeLabel = request.request_type ? REQUEST_TYPE_LABELS[request.request_type] : null;

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <p className="text-xs text-muted-foreground mb-1">
        Requests &gt; {request.request_id_display}
      </p>

      {/* Header: type badge + status badge + title */}
      <div className="flex items-start gap-3 mb-2 flex-wrap">
        {requestTypeLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {requestTypeLabel}
          </span>
        )}
        <RequestStatusBadge status={request.status} />
      </div>
      <h1 className="text-xl font-semibold mb-1">
        {request.topic ?? request.request_id_display}
      </h1>
      {request.status !== 'draft' && (
        <p className="text-sm text-muted-foreground mb-4">
          Submitted {formatDateTime(request.updated_at)}
        </p>
      )}

      <Separator className="my-4" />

      {/* Intake Document section */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Intake Document</p>
        {request.file_ref && request.filename ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary border border-border">
            <FileText size={20} className="text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-sm flex-1 truncate">{request.filename}</span>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={`/uploads/${request.file_ref}`}
                download={request.filename}
                aria-label={`Download ${request.filename}`}
              >
                Download ↓
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No intake document attached.</p>
        )}
      </div>

      <Separator className="my-4" />

      {/* Request fields (read-only) */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Request Details</p>
        <dl className="divide-y divide-border">
          <FieldRow label="Request Type" value={requestTypeLabel} />
          <FieldRow label="Requester" value={request.requester_name} />
          <FieldRow label="Agency / Program" value={request.agency_program} />
          <FieldRow label="Topic" value={request.topic} />
          <FieldRow label="Due Date" value={formatDate(request.due_date)} />
          <FieldRow label="Notes" value={request.notes || <span className="text-muted-foreground italic">No notes provided.</span>} />
        </dl>
      </div>

      <Separator className="my-4" />

      {/* Gate A1 Decision section */}
      <div className="mb-4" data-section="gate-a1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Gate A1 Decision</p>
        {request.status === 'submitted' && isAL ? (
          <GateA1Panel
            requestId={request.id}
            topic={request.topic}
            onDecisionRecorded={(_result) => {
              // Trigger refetch of request to reflect status change
              window.location.reload();
            }}
          />
        ) : request.status === 'submitted' && !isAL ? (
          <p className="text-sm text-muted-foreground">Awaiting Gate A1 decision.</p>
        ) : (request.status === 'accepted' || request.status === 'declined') ? (
          // TODO: fetch gate_decision from API in Phase 4 enhancement
          // For now show status-based placeholder that matches the decided card shape
          <GateA1DecidedCard
            decision={{
              id: 'placeholder',
              decision: request.status as 'approved' | 'declined',
              risk_level: null,
              rationale: 'Decision recorded.',
              decided_at: request.updated_at,
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Request is in Draft status — submit to trigger Gate A1 review.</p>
        )}
      </div>

      <Separator className="my-4" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/requests/${request.id}/edit`)}
            className="flex items-center gap-1.5"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit Request
          </Button>
        )}
        <a
          href={`/requests/${request.id}/audit`}
          className="text-sm text-blue-600 hover:underline ml-auto"
        >
          View Audit Trail →
        </a>
      </div>
    </div>
  );
}
