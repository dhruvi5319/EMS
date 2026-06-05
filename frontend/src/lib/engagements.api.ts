import { api } from './api';

export interface Engagement {
  id: string;
  engagement_number: number;
  job_code: string;
  title: string | null;
  phase: string;
  status: string;
  risk_level: string | null;
  owner_id: string | null;
  portfolio: string | null;
  request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GateDecision {
  id: string;
  gate_name: string;
  decision: string;
  risk_level: string | null;
  rationale: string | null;
  decided_by: string | null;
  decided_at: string;
}

export interface Blocker {
  type: string;
  message: string;
  link?: string;
}

export interface ListEngagementsParams {
  phase?: string;
  status?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function listEngagements(
  params?: ListEngagementsParams
): Promise<{ engagements: Engagement[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.phase) query.set('phase', params.phase);
  if (params?.status) query.set('status', params.status);
  if (params?.owner_id) query.set('owner_id', params.owner_id);
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.offset !== undefined) query.set('offset', String(params.offset));
  if (params?.search) query.set('search', params.search);

  const qs = query.toString();
  const res = await api.get<{ engagements: Engagement[]; total: number }>(
    `/api/engagements${qs ? `?${qs}` : ''}`
  );
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export async function getEngagement(id: string): Promise<{
  engagement: Engagement;
  gate_decisions: GateDecision[];
  blockers: Blocker[];
}> {
  const res = await api.get<{
    engagement: Engagement;
    gate_decisions: GateDecision[];
    blockers: Blocker[];
  }>(`/api/engagements/${id}`);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export interface EngagementUpdate {
  title?: string;
  risk_level?: string;
  owner_id?: string;
  portfolio?: string;
  status?: string;
}

export async function updateEngagement(
  id: string,
  data: EngagementUpdate
): Promise<{ engagement: Engagement }> {
  const res = await api.patch<{ engagement: Engagement }>(`/api/engagements/${id}`, data);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
