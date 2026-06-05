import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useRequests } from '@/hooks/useRequests';
import { Skeleton } from '@/components/ui/skeleton';

export function ReviewQueuePage() {
  const navigate = useNavigate();
  const { requests, loading } = useRequests({ status: 'submitted' });

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Review Queue</p>
        <h1 className="text-xl font-semibold">Review Queue</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ClipboardCheck size={32} className="text-muted-foreground" aria-hidden="true" />
          <p className="text-xl font-semibold">No items awaiting your review.</p>
          <p className="text-sm text-muted-foreground">Submitted requests will appear here for Gate A1 decision.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm" aria-label="Review queue table">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-secondary cursor-pointer"
                  style={{ height: 48 }}
                  onClick={() => navigate(`/requests/${r.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.request_id_display}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.request_type ?? '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.topic ?? '—'}</td>
                  <td className="px-4 py-3">{r.requester_name ?? '—'}</td>
                  <td className="px-4 py-3">{r.due_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/requests/${r.id}`); }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
