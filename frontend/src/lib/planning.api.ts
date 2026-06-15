import { api } from './api';

export interface PlanningRecord {
  id: string;
  engagement_id: string;
  status: 'draft' | 'ready_for_review' | 'approved' | 'returned';
  design_approach: string | null;
  schedule_notes: string | null;
  risk_notes: string | null;
  data_reliability_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  engagement_id: string;
  objective_text: string;
  information_need: string | null;
  sort_order: number;
  independence_confirmed: boolean | null;
  created_at: string;
  updated_at?: string;
}

export interface IndependenceAffirmation {
  id: string;
  engagement_id: string;
  user_id: string;
  status: 'affirmed' | 'pending' | 'exception_noted';
  created_at: string;
  updated_at: string;
}

export interface PrerequisiteItem {
  key: string;
  label: string;
  pass: boolean;
  detail?: string;
}

export async function getPlanningRecord(engagementId: string): Promise<{
  planning_record: PlanningRecord | null;
  objectives: Objective[];
  independence_affirmations: IndependenceAffirmation[];
}> {
  const res = await api.get<{
    planning_record: PlanningRecord | null;
    objectives: Objective[];
    independence_affirmations?: IndependenceAffirmation[];
  }>(`/api/engagements/${engagementId}/planning`);
  if (!res.ok) throw new Error(res.error);
  return {
    planning_record: res.data.planning_record,
    objectives: res.data.objectives,
    independence_affirmations: res.data.independence_affirmations ?? [],
  };
}

export async function upsertPlanningRecord(
  engagementId: string,
  data: Partial<Pick<PlanningRecord, 'design_approach' | 'schedule_notes' | 'risk_notes' | 'data_reliability_notes'>>
): Promise<{ planning_record: PlanningRecord }> {
  const res = await api.put<{ planning_record: PlanningRecord }>(
    `/api/engagements/${engagementId}/planning`,
    data
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function submitPlanningRecord(
  engagementId: string
): Promise<{ planning_record: PlanningRecord }> {
  const res = await api.post<{ planning_record: PlanningRecord }>(
    `/api/engagements/${engagementId}/planning/submit`,
    {}
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function addObjective(
  engagementId: string,
  data: { objective_text: string; information_need?: string }
): Promise<{ objective: Objective }> {
  const res = await api.post<{ objective: Objective }>(
    `/api/engagements/${engagementId}/planning/objectives`,
    data
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function updateObjective(
  engagementId: string,
  objectiveId: string,
  data: Partial<Pick<Objective, 'objective_text' | 'information_need' | 'sort_order'>>
): Promise<{ objective: Objective }> {
  const res = await api.patch<{ objective: Objective }>(
    `/api/engagements/${engagementId}/planning/objectives/${objectiveId}`,
    data
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function deleteObjective(
  engagementId: string,
  objectiveId: string
): Promise<void> {
  const res = await api.delete<{ message: string }>(
    `/api/engagements/${engagementId}/planning/objectives/${objectiveId}`
  );
  if (!res.ok) throw Object.assign(new Error(res.error), { status: res.status });
}

export async function setIndependenceStatus(
  engagementId: string,
  affirmations: Array<{ user_id: string; status: 'affirmed' | 'pending' | 'exception_noted' }>
): Promise<{ affirmations: IndependenceAffirmation[] }> {
  // Persists to the independence_affirmations table, which Gate P2's
  // independence_status_complete prerequisite reads.
  const res = await api.put<{ independence_affirmations: IndependenceAffirmation[] }>(
    `/api/engagements/${engagementId}/planning/independence`,
    { affirmations }
  );
  if (!res.ok) throw Object.assign(new Error(res.error), { status: res.status });
  return { affirmations: res.data.independence_affirmations };
}

export async function requestRevision(
  engagementId: string,
  revisionNote: string
): Promise<{ planning_record: PlanningRecord }> {
  const res = await api.post<{ planning_record: PlanningRecord }>(
    `/api/engagements/${engagementId}/planning/revisions`,
    { revision_note: revisionNote }
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function checkP2Prerequisites(
  engagementId: string
): Promise<{ prerequisites: PrerequisiteItem[]; all_pass: boolean }> {
  const res = await api.get<{ prerequisites: PrerequisiteItem[]; all_pass: boolean }>(
    `/api/engagements/${engagementId}/gate/p2/prerequisites`
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
