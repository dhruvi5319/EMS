import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEngagement } from '@/lib/engagements.api';
import type { Engagement, GateDecision, Blocker } from '@/lib/engagements.api';
import { EngagementHeaderCard } from '@/components/engagements/EngagementHeaderCard';
import { GateStatusCardRow } from '@/components/engagements/GateStatusCardRow';
import { BlockerPanel } from '@/components/engagements/BlockerPanel';
import { TeamPanel } from '@/components/engagements/TeamPanel';
import { PlanningRecordPanel } from '@/components/engagements/PlanningRecordPanel';
import { EvidenceListPage } from '@/pages/engagements/EvidenceListPage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/context/AuthContext';

function PlaceholderPanel({ name }: { name: string }) {
  return <div className="py-8 text-sm text-muted-foreground">{name} — coming in a future phase.</div>;
}

function SkeletonHeaderCard() {
  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

function SkeletonGateCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function EngagementShellPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [gateDecisions, setGateDecisions] = useState<GateDecision[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const canEdit = user?.roles?.some((r) => ['EM', 'AD'].includes(r)) ?? false;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEngagement(id)
      .then(({ engagement: eng, gate_decisions, blockers: b }) => {
        setEngagement(eng);
        setGateDecisions(gate_decisions);
        setBlockers(b);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-4 w-48" />
        {/* Header card skeleton */}
        <SkeletonHeaderCard />
        {/* Gate section label */}
        <div>
          <Skeleton className="h-3 w-24 mb-3" />
          <SkeletonGateCards />
        </div>
      </div>
    );
  }

  if (notFound || !engagement) {
    return (
      <div className="px-6 py-16 max-w-screen-xl mx-auto text-center">
        <p className="text-xl font-semibold mb-4">Engagement not found.</p>
        <Link
          to="/engagements"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Engagements
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
        <Link to="/engagements" className="hover:text-foreground hover:underline">
          Engagements
        </Link>
        <span className="mx-1.5">{'>'}</span>
        <span className="font-mono font-semibold text-foreground">{engagement.job_code}</span>
      </nav>

      {/* Header card + Edit Metadata */}
      <div className="mb-6">
        <EngagementHeaderCard
          engagement={engagement}
          onUpdate={(updated) => setEngagement(updated)}
        />
      </div>

      {/* Gate Status section */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Gate Status
        </p>
        <GateStatusCardRow gate_decisions={gateDecisions} />
      </div>

      {/* Open Blockers section */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Open Blockers
        </p>
        <BlockerPanel blockers={blockers} />
      </div>

      {/* Artifact Counts */}
      <div className="mb-6 text-sm text-muted-foreground">
        <p className="text-xs font-medium uppercase tracking-wide mb-1">Artifact Counts</p>
        <p>Team: — · Objectives: — · Evidence: — · Findings: — · Draft Product: —</p>
      </div>

      {/* Engagement Shell Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 mb-4">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'team', label: 'Team' },
            { value: 'planning', label: 'Planning Record' },
            { value: 'evidence', label: 'Evidence' },
            { value: 'findings', label: 'Findings' },
            { value: 'draft', label: 'Draft Product' },
            { value: 'gate-history', label: 'Gate History' },
            { value: 'audit', label: 'Audit Trail' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          {/* Overview content is visible above the tabs always */}
          <div className="py-4 text-sm text-muted-foreground">
            Overview content shown in sections above.
          </div>
        </TabsContent>

        <TabsContent value="team">
          <TeamPanel
            engagementId={engagement.id}
            canEdit={canEdit}
            p2Approved={gateDecisions.some(
              (d) =>
                d.gate_name === 'P2' &&
                (d.decision?.toLowerCase() === 'approved' ||
                  d.decision?.toLowerCase() === 'approve'),
            )}
          />
        </TabsContent>

        <TabsContent value="planning">
          <PlanningRecordPanel
            engagementId={engagement.id}
            canEdit={canEdit}
            isQA={user?.roles?.includes('QA') ?? false}
            gate_decisions={gateDecisions}
          />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceListPage />
        </TabsContent>

        <TabsContent value="findings">
          <PlaceholderPanel name="Findings" />
        </TabsContent>

        <TabsContent value="draft">
          <PlaceholderPanel name="Draft Product" />
        </TabsContent>

        <TabsContent value="gate-history">
          <PlaceholderPanel name="Gate History" />
        </TabsContent>

        <TabsContent value="audit">
          <PlaceholderPanel name="Audit Trail" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
