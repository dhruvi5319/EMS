import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, SearchX, CheckCircle, XCircle, Clock, RotateCcw, Circle } from 'lucide-react';
import { listEngagements } from '@/lib/engagements.api';
import type { Engagement, GateDecision } from '@/lib/engagements.api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PHASE_TABS = [
  { value: '', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'draft', label: 'Draft' },
  { value: 'readiness', label: 'Readiness' },
  { value: 'closed', label: 'Closed' },
];

type SortKey = 'job_code' | 'title' | 'phase' | 'owner_id' | 'risk_level' | 'updated_at';
type SortDir = 'asc' | 'desc';

interface EngagementWithGates extends Engagement {
  gate_decisions?: GateDecision[];
  owner_name?: string | null;
}

function PhaseBadge({ phase }: { phase: string }) {
  const phaseColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-800',
    evidence: 'bg-purple-100 text-purple-800',
    draft: 'bg-yellow-100 text-yellow-800',
    readiness: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-600',
  };
  const colorClass = phaseColors[phase?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
      {phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : '—'}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-muted-foreground">—</span>;
  const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-700',
  };
  const colorClass = riskColors[risk.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
      {risk.charAt(0).toUpperCase() + risk.slice(1)}
    </span>
  );
}

function GateMiniIcon({ decision, locked }: { decision?: GateDecision; locked?: boolean }) {
  if (locked) return <Lock16 />;
  if (!decision) return <Circle size={12} className="text-gray-400" aria-hidden="true" />;
  const d = decision.decision?.toLowerCase();
  if (d === 'approved' || d === 'approve') return <CheckCircle size={12} className="text-emerald-600" aria-hidden="true" />;
  if (d === 'declined' || d === 'decline') return <XCircle size={12} className="text-red-600" aria-hidden="true" />;
  if (d === 'returned' || d === 'return') return <RotateCcw size={12} className="text-amber-500" aria-hidden="true" />;
  if (d === 'pending' || d === 'ready_for_review') return <Clock size={12} className="text-yellow-500" aria-hidden="true" />;
  return <Circle size={12} className="text-gray-400" aria-hidden="true" />;
}

function Lock16() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function GateMiniStatusRow({ gate_decisions = [] }: { gate_decisions?: GateDecision[] }) {
  const GATES = ['A1', 'P2', 'P3', 'P4'] as const;
  function isLocked(gate: string): boolean {
    const idx = GATES.indexOf(gate as typeof GATES[number]);
    if (idx === 0) return false;
    const prev = gate_decisions.find(d => d.gate_name === GATES[idx - 1]);
    if (!prev) return true;
    const dec = prev.decision?.toLowerCase();
    return dec !== 'approved' && dec !== 'approve';
  }
  return (
    <div className="flex items-center gap-1.5">
      {GATES.map(gate => {
        const decision = gate_decisions.find(d => d.gate_name === gate);
        const locked = isLocked(gate);
        return (
          <span key={gate} className="flex items-center gap-0.5" title={`${gate}: ${locked ? 'Locked' : (decision?.decision ?? 'Not Started')}`}>
            <span className="text-xs text-muted-foreground font-mono">{gate}</span>
            <GateMiniIcon decision={decision} locked={locked} />
          </span>
        );
      })}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function EngagementListPage() {
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [engagements, setEngagements] = useState<EngagementWithGates[]>([]);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const fetchEngagements = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEngagements({
        phase: activePhase || undefined,
        search: debouncedSearch || undefined,
      });
      setEngagements(result.engagements as EngagementWithGates[]);
    } catch {
      setEngagements([]);
    } finally {
      setLoading(false);
    }
  }, [activePhase, debouncedSearch]);

  useEffect(() => {
    fetchEngagements();
  }, [fetchEngagements]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const sorted = [...engagements].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-muted-foreground opacity-40">↕</span>;
    return <span className="ml-1 text-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const th = (label: string, col: SortKey) => (
    <th
      key={col}
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(col)}
      aria-sort={sortKey === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}<SortIcon col={col} />
    </th>
  );

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Engagements</p>
        <h1 className="text-xl font-semibold text-foreground">Engagements</h1>
      </div>

      {/* Phase filter tabs */}
      <Tabs value={activePhase} onValueChange={setActivePhase} className="mb-4">
        <TabsList>
          {PHASE_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search by ID, title, or owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 max-w-md"
          aria-label="Search engagements"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm" aria-label="Engagements table">
          <thead className="bg-secondary border-b border-border">
            <tr>
              {th('Job Code', 'job_code')}
              {th('Title', 'title')}
              {th('Phase', 'phase')}
              {th('Owner', 'owner_id')}
              {th('Risk', 'risk_level')}
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Next Milestone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Gate Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Blocked
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && [0, 1, 2, 3, 4].map(i => (
              <tr key={i} className="border-b border-border last:border-0" style={{ height: 48 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(j => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  {activePhase || debouncedSearch ? (
                    <div className="flex flex-col items-center gap-2">
                      <SearchX size={32} className="text-muted-foreground" aria-hidden="true" />
                      <p className="text-xl font-semibold">
                        {activePhase ? `No ${activePhase} engagements.` : 'No results found.'}
                      </p>
                      <p className="text-sm text-muted-foreground">Try a different phase filter.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setActivePhase(''); setSearch(''); }}
                      >
                        Clear filter
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase size={32} className="text-muted-foreground" aria-hidden="true" />
                      <p className="text-xl font-semibold">No engagements yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Engagements are created when a request is approved at Gate A1.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {!loading && sorted.map(eng => (
              <tr
                key={eng.id}
                className="border-b border-border last:border-0 hover:bg-secondary cursor-pointer"
                style={{ height: 48 }}
                onClick={() => navigate(`/engagements/${eng.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold">{eng.job_code}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={eng.title ?? undefined}>
                  {eng.title
                    ? (eng.title.length > 60 ? eng.title.slice(0, 60) + '…' : eng.title)
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <PhaseBadge phase={eng.phase} />
                </td>
                <td className="px-4 py-3 text-sm">
                  {eng.owner_name ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge risk={eng.risk_level} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                <td className="px-4 py-3">
                  <GateMiniStatusRow gate_decisions={eng.gate_decisions} />
                </td>
                <td className="px-4 py-3">
                  {/* BlockedBadge — Phase 4: placeholder; blockers computed in shell */}
                  <span className="text-muted-foreground text-xs">—</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
