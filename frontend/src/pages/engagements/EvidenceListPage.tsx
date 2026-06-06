import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { useEvidence, useEvidenceCoverage } from '@/hooks/useEvidence';
import type { EvidenceFilters } from '@/hooks/useEvidence';
import { ObjectiveCoverageBar } from '@/components/evidence/ObjectiveCoverageBar';
import { EvidenceFilterBar } from '@/components/evidence/EvidenceFilterBar';
import { EvidenceTable } from '@/components/evidence/EvidenceTable';
import { AddEvidencePanel } from '@/components/evidence/AddEvidencePanel';
import { useToast } from '@/components/ui/use-toast';

export function EvidenceListPage() {
  const { id: engagementId } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [filters, setFilters] = useState<EvidenceFilters>({});
  const [showingGaps, setShowingGaps] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { evidence, loading: evidenceLoading, refresh } = useEvidence(engagementId ?? '', filters);
  const { coverage, loading: coverageLoading } = useEvidenceCoverage(engagementId ?? '');

  const roles = user?.roles ?? [];
  const canAddEvidence = roles.some((r) => ['AN', 'AD'].includes(r));
  const canExportCsv = !roles.includes('IR') || roles.some((r) => ['AL', 'EM', 'AN', 'QA', 'PC', 'RO', 'AD'].includes(r));

  const hasFilters = Object.values(filters).some((v) => v != null && v !== '');

  const handleExportCsv = async () => {
    if (!engagementId) return;
    setExportLoading(true);
    try {
      const res = await fetch(`/api/engagements/${engagementId}/evidence/export`, {
        credentials: 'include',
      });
      if (!res.ok) {
        toast({ title: 'Export failed.', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-registry-${engagementId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Evidence registry exported.' });
    } catch {
      toast({ title: 'Export failed.', variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 uppercase tracking-wide font-normal">Evidence Registry</p>
        <div className="flex items-center gap-2">
          {canAddEvidence && (
            <Button
              size="sm"
              className="h-10"
              onClick={() => setAddPanelOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Evidence
            </Button>
          )}
          {canExportCsv && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={exportLoading}
              onClick={handleExportCsv}
            >
              {exportLoading ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Download size={14} className="mr-1" />
              )}
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Objective Coverage Bar */}
      {!coverageLoading && coverage && (
        <ObjectiveCoverageBar
          covered={coverage.covered}
          total={coverage.total}
          showingGaps={showingGaps}
          onToggleGaps={() => setShowingGaps((v) => !v)}
        />
      )}

      {/* Gap view */}
      {showingGaps && coverage && coverage.objectives && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Evidence Gap View — Objectives with No Evidence
          </p>
          <p className="text-xs text-slate-500">
            {coverage.uncovered_count} of {coverage.total} objective{coverage.total !== 1 ? 's' : ''} have no linked evidence (P3 blocker)
          </p>
          <div className="space-y-2">
            {coverage.objectives
              .filter((obj) => obj.evidence_count === 0)
              .map((obj) => (
                <div
                  key={obj.id}
                  className="rounded-lg p-4 border-2 border-dashed"
                  style={{ background: 'hsl(0 72% 93%)', borderColor: 'hsl(0 72% 51%)' }}
                >
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {obj.objective_text.length > 100
                      ? obj.objective_text.slice(0, 100) + '…'
                      : obj.objective_text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-xs font-normal rounded px-1.5 py-0.5"
                      style={{ background: 'hsl(0 72% 93%)', color: 'hsl(0 72% 38%)', border: '1px solid hsl(0 72% 51%)' }}
                    >
                      Evidence Needed
                    </span>
                    <span className="text-xs text-red-700 flex items-center gap-1">
                      🔴 No Evidence
                    </span>
                    <span className="text-xs text-red-700 font-medium">Blocker</span>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600 text-xs"
                      onClick={() => setAddPanelOpen(true)}
                    >
                      Link →
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <EvidenceFilterBar
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Evidence table */}
      <EvidenceTable
        engagementId={engagementId ?? ''}
        evidence={evidence}
        loading={evidenceLoading}
        hasFilters={hasFilters}
        canAddEvidence={canAddEvidence}
        onAddEvidence={() => setAddPanelOpen(true)}
        onClearFilters={() => setFilters({})}
      />

      {/* Add Evidence Panel */}
      <AddEvidencePanel
        open={addPanelOpen}
        onOpenChange={setAddPanelOpen}
        engagementId={engagementId ?? ''}
        onSuccess={refresh}
      />
    </div>
  );
}
