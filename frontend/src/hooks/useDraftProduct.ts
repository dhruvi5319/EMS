import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type DraftStatus = 'drafting' | 'under_review' | 'ready_for_ref_check' | 'ready_for_final_review';

export interface DraftProduct {
  id: string;
  engagement_id: string;
  title: string;
  version: string;
  owner_id: string;
  owner_name: string;
  status: DraftStatus;
  file_ref: string | null;
  filename: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface DraftComment {
  id: string;
  draft_product_id: string;
  author_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

interface CreateDraftData {
  title: string;
  version: string;
  owner_id: string;
}

interface UpdateDraftData {
  title?: string;
  version?: string;
  owner_id?: string;
  status?: DraftStatus;
}

export function useDraftProduct(engagementId: string) {
  const [draft, setDraft] = useState<DraftProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDraft = useCallback(async () => {
    if (!engagementId) return;
    setLoading(true);
    setError(null);
    const res = await api.get<{ draft: DraftProduct | null }>(`/api/engagements/${engagementId}/draft`);
    if (res.ok) {
      setDraft(res.data.draft);
    } else if (res.status === 404) {
      setDraft(null);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [engagementId]);

  const createDraft = useCallback(async (data: CreateDraftData) => {
    setError(null);
    const res = await api.post<{ draft: DraftProduct }>(`/api/engagements/${engagementId}/draft`, data);
    if (res.ok) {
      setDraft(res.data.draft);
      return res.data.draft;
    } else {
      setError(res.error);
      throw new Error(res.error);
    }
  }, [engagementId]);

  const updateDraft = useCallback(async (data: UpdateDraftData) => {
    setError(null);
    const res = await api.patch<{ draft: DraftProduct }>(`/api/engagements/${engagementId}/draft`, data);
    if (res.ok) {
      setDraft(res.data.draft);
      return res.data.draft;
    } else {
      setError(res.error);
      throw new Error(res.error);
    }
  }, [engagementId]);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/engagements/${engagementId}/draft/file`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      let errMsg = 'Upload failed';
      try {
        const body = await res.json();
        errMsg = body.error || errMsg;
      } catch { /* ignore */ }
      setError(errMsg);
      throw new Error(errMsg);
    }
    const data = await res.json() as { draft: DraftProduct };
    setDraft(data.draft);
    return data.draft;
  }, [engagementId]);

  const removeFile = useCallback(async () => {
    setError(null);
    const res = await api.delete<{ draft: DraftProduct }>(`/api/engagements/${engagementId}/draft/file`);
    if (res.ok) {
      setDraft(res.data.draft);
      return res.data.draft;
    } else {
      setError(res.error);
      throw new Error(res.error);
    }
  }, [engagementId]);

  const fetchComments = useCallback(async (): Promise<DraftComment[]> => {
    setError(null);
    const res = await api.get<{ comments: Array<DraftComment & { comment_text?: string }> }>(`/api/engagements/${engagementId}/draft/comments`);
    if (res.ok) {
      // Backend stores the body in `comment_text`; normalize to `text`.
      return res.data.comments.map((c) => ({ ...c, text: c.text ?? c.comment_text ?? '' }));
    } else {
      setError(res.error);
      throw new Error(res.error);
    }
  }, [engagementId]);

  const addComment = useCallback(async (text: string): Promise<DraftComment> => {
    setError(null);
    // Backend expects `comment_text` in the body and returns it on the object.
    const res = await api.post<{ comment: DraftComment & { comment_text?: string } }>(`/api/engagements/${engagementId}/draft/comments`, { comment_text: text });
    if (res.ok) {
      const c = res.data.comment;
      return { ...c, text: c.text ?? c.comment_text ?? '' };
    } else {
      setError(res.error);
      throw new Error(res.error);
    }
  }, [engagementId]);

  return {
    draft,
    loading,
    error,
    fetchDraft,
    createDraft,
    updateDraft,
    uploadFile,
    removeFile,
    fetchComments,
    addComment,
  };
}
