import { api } from './api';

export interface TeamAssignment {
  id: string;
  engagement_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  user: { display_name: string; email: string };
}

export interface Milestone {
  id: string | null;
  engagement_id: string;
  milestone_type: string;
  target_date: string | null;
  completed_at: string | null;
  status: 'not_started' | 'on_track' | 'at_risk' | 'overdue' | 'complete';
}

export async function listTeam(
  engagementId: string,
): Promise<{ assignments: TeamAssignment[] }> {
  const res = await api.get<{ assignments: TeamAssignment[] }>(
    `/api/engagements/${engagementId}/team`,
  );
  if (!res.ok) throw { status: res.status, message: res.error };
  return res.data;
}

export async function addTeamMember(
  engagementId: string,
  data: { user_id: string; role: string },
): Promise<{ assignment: TeamAssignment }> {
  const res = await api.post<{ assignment: TeamAssignment }>(
    `/api/engagements/${engagementId}/team`,
    data,
  );
  if (!res.ok) throw { status: res.status, message: res.error, code: (res as any).code };
  return res.data;
}

export async function removeTeamMember(
  engagementId: string,
  assignmentId: string,
): Promise<void> {
  const res = await api.delete<void>(
    `/api/engagements/${engagementId}/team/${assignmentId}`,
  );
  if (!res.ok) throw { status: res.status, message: res.error };
}

export async function listMilestones(
  engagementId: string,
): Promise<{ milestones: Milestone[] }> {
  const res = await api.get<{ milestones: Milestone[] }>(
    `/api/engagements/${engagementId}/milestones`,
  );
  if (!res.ok) throw { status: res.status, message: res.error };
  return res.data;
}

export async function upsertMilestones(
  engagementId: string,
  milestones: Array<{ milestone_type: string; target_date: string }>,
): Promise<{ milestones: Milestone[] }> {
  // Backend expects the request body to be a raw array of milestone objects.
  const res = await api.put<{ milestones: Milestone[] }>(
    `/api/engagements/${engagementId}/milestones`,
    milestones,
  );
  if (!res.ok) throw { status: res.status, message: res.error };
  return res.data;
}
