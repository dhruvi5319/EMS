import { db } from '../db';
import { storageProvider } from '../storage/local.storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EvidenceType = 'document' | 'dataset' | 'interview_note' | 'meeting_note' | 'other';
export type Sensitivity = 'standard' | 'restricted';

export interface EvidenceItem {
  id: string;
  engagement_id: string;
  evidence_type: EvidenceType;
  source: string;
  date_received: string;
  custodian: string | null;
  description: string | null;
  sensitivity: Sensitivity;
  created_by: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
  objective_count?: number;
}

export interface EvidenceFile {
  id: string;
  evidence_item_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_key: string;
  uploaded_by: string;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'audio/mpeg',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_ITEM = 20;

const VALID_EVIDENCE_TYPES: EvidenceType[] = [
  'document',
  'dataset',
  'interview_note',
  'meeting_note',
  'other',
];

// ─── Access control helpers ───────────────────────────────────────────────────

const PRIVILEGED_ROLES = new Set(['AN', 'EM', 'QA', 'IR', 'PC', 'AD']);

function canViewRestricted(roles: string[]): boolean {
  return roles.some((r) => PRIVILEGED_ROLES.has(r));
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function toEvidenceItem(row: Record<string, unknown>): EvidenceItem {
  return {
    id: row.id as string,
    engagement_id: row.engagement_id as string,
    evidence_type: row.evidence_type as EvidenceType,
    source: row.source as string,
    date_received:
      row.date_received instanceof Date
        ? row.date_received.toISOString().split('T')[0]
        : (row.date_received as string),
    custodian: row.custodian as string | null,
    description: row.description as string | null,
    sensitivity: row.sensitivity as Sensitivity,
    created_by: row.created_by as string,
    created_at:
      row.created_at instanceof Date
        ? (row.created_at as Date).toISOString()
        : (row.created_at as string),
    updated_at:
      row.updated_at instanceof Date
        ? (row.updated_at as Date).toISOString()
        : (row.updated_at as string),
    file_count: row.file_count !== undefined ? Number(row.file_count) : undefined,
    objective_count: row.objective_count !== undefined ? Number(row.objective_count) : undefined,
  };
}

function toEvidenceFile(row: Record<string, unknown>): EvidenceFile {
  return {
    id: row.id as string,
    // DB column is evidence_id; map to the interface field name evidence_item_id
    evidence_item_id: (row.evidence_item_id ?? row.evidence_id) as string,
    original_filename: (row.original_filename ?? row.filename) as string,
    file_size: row.file_size as number,
    mime_type: row.mime_type as string,
    // DB column is file_ref; map to the interface field name storage_key
    storage_key: (row.storage_key ?? row.file_ref) as string,
    uploaded_by: row.uploaded_by as string,
    created_at:
      (row.uploaded_at ?? row.created_at) instanceof Date
        ? ((row.uploaded_at ?? row.created_at) as Date).toISOString()
        : ((row.uploaded_at ?? row.created_at) as string),
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEvidenceType(value: unknown): void {
  if (!VALID_EVIDENCE_TYPES.includes(value as EvidenceType)) {
    throw Object.assign(new Error('Invalid evidence type.'), { status: 422 });
  }
}

function validateSensitivity(value: unknown): void {
  if (value !== 'standard' && value !== 'restricted') {
    throw Object.assign(new Error('Invalid sensitivity value. Must be standard or restricted.'), {
      status: 422,
    });
  }
}

function validateSource(value: unknown): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw Object.assign(new Error('Source is required.'), { status: 422 });
  }
  if (value.length > 500) {
    throw Object.assign(new Error('Source must be 500 characters or fewer.'), { status: 422 });
  }
}

function validateDateReceived(value: unknown): void {
  if (!value || typeof value !== 'string') {
    throw Object.assign(new Error('date_received is required and must be a valid date.'), {
      status: 422,
    });
  }
  const d = new Date(value as string);
  if (isNaN(d.getTime())) {
    throw Object.assign(
      new Error('date_received must be a valid date (ISO or MM/DD/YYYY).'),
      { status: 422 }
    );
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getEvidence(
  engagementId: string,
  evidenceId: string,
  viewerRoles: string[]
): Promise<EvidenceItem> {
  let q = db('evidence_items as e')
    .where('e.engagement_id', engagementId)
    .where('e.id', evidenceId);

  const row = await q
    .select(
      'e.*',
      db.raw(
        '(SELECT COUNT(*) FROM evidence_files ef WHERE ef.evidence_id = e.id)::int AS file_count'
      ),
      db.raw(
        '(SELECT COUNT(*) FROM objective_evidence_links oel WHERE oel.evidence_id = e.id)::int AS objective_count'
      )
    )
    .first();

  if (!row) {
    throw Object.assign(new Error('Evidence item not found.'), { status: 404 });
  }

  if (row.sensitivity === 'restricted' && !canViewRestricted(viewerRoles)) {
    throw Object.assign(new Error('Access denied — restricted evidence.'), { status: 403 });
  }

  return toEvidenceItem(row);
}

export async function listEvidence(
  engagementId: string,
  filters: {
    type?: EvidenceType;
    sensitivity?: Sensitivity;
    limit?: number;
    offset?: number;
  },
  viewerRoles: string[]
): Promise<{ evidence: EvidenceItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  let q = db('evidence_items as e').where('e.engagement_id', engagementId);

  // Sensitivity access control: AL/RO users without privileged role see only standard items
  if (!canViewRestricted(viewerRoles)) {
    q = q.where('e.sensitivity', 'standard');
  }

  if (filters.type) q = q.where('e.evidence_type', filters.type);
  if (filters.sensitivity) q = q.where('e.sensitivity', filters.sensitivity);

  q = q.orderBy('e.date_received', 'desc').orderBy('e.created_at', 'desc');

  const countResult = (await q.clone().clearOrder().count('e.id as count').first()) as {
    count: string | number;
  };
  const total =
    typeof countResult.count === 'string'
      ? parseInt(countResult.count, 10)
      : (countResult.count as number);

  const rows = await q
    .clone()
    .select(
      'e.*',
      db.raw(
        '(SELECT COUNT(*) FROM evidence_files ef WHERE ef.evidence_id = e.id)::int AS file_count'
      ),
      db.raw(
        '(SELECT COUNT(*) FROM objective_evidence_links oel WHERE oel.evidence_id = e.id)::int AS objective_count'
      )
    )
    .limit(limit)
    .offset(offset);

  return { evidence: rows.map(toEvidenceItem), total };
}

export async function createEvidence(
  engagementId: string,
  data: {
    evidence_type: string;
    source: string;
    date_received: string;
    custodian?: string;
    description?: string;
    sensitivity: string;
  },
  actorId: string
): Promise<EvidenceItem> {
  validateEvidenceType(data.evidence_type);
  validateSource(data.source);
  validateDateReceived(data.date_received);
  validateSensitivity(data.sensitivity);

  const [row] = await db('evidence_items')
    .insert({
      engagement_id: engagementId,
      evidence_type: data.evidence_type,
      source: data.source.trim(),
      date_received: data.date_received,
      custodian: data.custodian ?? null,
      description: data.description ?? null,
      sensitivity: data.sensitivity,
      created_by: actorId,
    })
    .returning('*');

  return toEvidenceItem(row);
}

export async function updateEvidence(
  engagementId: string,
  evidenceId: string,
  data: Partial<{
    evidence_type: string;
    source: string;
    date_received: string;
    custodian: string;
    description: string;
    sensitivity: string;
  }>,
  _actorId: string
): Promise<EvidenceItem> {
  const existing = await db('evidence_items')
    .where({ id: evidenceId, engagement_id: engagementId })
    .first();
  if (!existing) {
    throw Object.assign(new Error('Evidence item not found.'), { status: 404 });
  }

  // Validate any provided fields
  if (data.evidence_type !== undefined) validateEvidenceType(data.evidence_type);
  if (data.source !== undefined) validateSource(data.source);
  if (data.date_received !== undefined) validateDateReceived(data.date_received);
  if (data.sensitivity !== undefined) validateSensitivity(data.sensitivity);

  const updates: Record<string, unknown> = { updated_at: db.fn.now() };
  if (data.evidence_type !== undefined) updates.evidence_type = data.evidence_type;
  if (data.source !== undefined) updates.source = data.source.trim();
  if (data.date_received !== undefined) updates.date_received = data.date_received;
  if (data.custodian !== undefined) updates.custodian = data.custodian;
  if (data.description !== undefined) updates.description = data.description;
  if (data.sensitivity !== undefined) updates.sensitivity = data.sensitivity;

  const [row] = await db('evidence_items')
    .where({ id: evidenceId, engagement_id: engagementId })
    .update(updates)
    .returning('*');

  return toEvidenceItem(row);
}

export async function deleteEvidence(
  engagementId: string,
  evidenceId: string
): Promise<{ message: string }> {
  const existing = await db('evidence_items')
    .where({ id: evidenceId, engagement_id: engagementId })
    .first();
  if (!existing) {
    throw Object.assign(new Error('Evidence item not found.'), { status: 404 });
  }

  // Check objective links (DB table: objective_evidence_links)
  const objectiveLinkCount = await db('objective_evidence_links')
    .where({ evidence_id: evidenceId })
    .count('id as count')
    .first() as { count: string | number };
  const objCount =
    typeof objectiveLinkCount.count === 'string'
      ? parseInt(objectiveLinkCount.count, 10)
      : (objectiveLinkCount.count as number);

  // Check finding links (DB table: finding_evidence_links)
  const findingLinkCount = await db('finding_evidence_links')
    .where({ evidence_id: evidenceId })
    .count('id as count')
    .first() as { count: string | number };
  const findCount =
    typeof findingLinkCount.count === 'string'
      ? parseInt(findingLinkCount.count, 10)
      : (findingLinkCount.count as number);

  if (objCount > 0 || findCount > 0) {
    throw Object.assign(
      new Error(
        'Cannot delete — this evidence item is linked to objectives or findings. Unlink it first.'
      ),
      { status: 409 }
    );
  }

  // Get all files before transaction (so we can delete from storage)
  const files = await db('evidence_files').where({ evidence_id: evidenceId }).select('file_ref');

  await db.transaction(async (trx) => {
    // Delete files from DB first
    await trx('evidence_files').where({ evidence_id: evidenceId }).delete();
    // Delete the evidence item
    await trx('evidence_items').where({ id: evidenceId }).delete();
  });

  // Delete from storage outside transaction (storage failure shouldn't roll back DB delete)
  for (const f of files) {
    try {
      await storageProvider.delete(f.file_ref as string);
    } catch (_err) {
      // Log but don't fail — orphaned storage files are recoverable
      console.warn(`Failed to delete storage file ${f.file_ref}:`, _err);
    }
  }

  return { message: 'Evidence item deleted.' };
}

export async function uploadFile(
  engagementId: string,
  evidenceId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  actorId: string
): Promise<EvidenceFile> {
  const existing = await db('evidence_items')
    .where({ id: evidenceId, engagement_id: engagementId })
    .first();
  if (!existing) {
    throw Object.assign(new Error('Evidence item not found.'), { status: 404 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw Object.assign(new Error('File type not permitted.'), { status: 422 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(new Error('File exceeds maximum size of 50 MB.'), { status: 422 });
  }

  // Check file count
  const countResult = await db('evidence_files')
    .where({ evidence_id: evidenceId })
    .count('id as count')
    .first() as { count: string | number };
  const fileCount =
    typeof countResult.count === 'string'
      ? parseInt(countResult.count, 10)
      : (countResult.count as number);

  if (fileCount >= MAX_FILES_PER_ITEM) {
    throw Object.assign(new Error('Maximum of 20 files per evidence item.'), { status: 422 });
  }

  // Save to storage — returns { file_ref }
  const { file_ref } = await storageProvider.save(
    file.buffer,
    file.originalname,
    file.mimetype
  );

  const [row] = await db('evidence_files')
    .insert({
      evidence_id: evidenceId,
      filename: file.originalname,
      file_ref,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: actorId,
    })
    .returning('*');

  // Audit (PRD §6.3): evidence uploads must be logged.
  await db('audit_events').insert({
    engagement_id: engagementId,
    actor_id: actorId,
    action: 'EVIDENCE_FILE_UPLOADED',
    object_type: 'evidence',
    object_id: evidenceId,
    summary: `Uploaded file "${file.originalname}" to evidence item.`,
  });

  return toEvidenceFile(row);
}

export async function deleteFile(
  engagementId: string,
  evidenceId: string,
  fileId: string,
  _viewerRoles: string[]
): Promise<{ message: string }> {
  // JOIN check: file must belong to this evidence item which belongs to this engagement
  const fileRow = await db('evidence_files as ef')
    .join('evidence_items as ei', 'ei.id', 'ef.evidence_id')
    .where('ef.id', fileId)
    .where('ef.evidence_id', evidenceId)
    .where('ei.engagement_id', engagementId)
    .select('ef.*')
    .first();

  if (!fileRow) {
    throw Object.assign(new Error('File not found.'), { status: 404 });
  }

  // Delete from storage
  try {
    await storageProvider.delete(fileRow.file_ref as string);
  } catch (_err) {
    console.warn(`Failed to delete storage file ${fileRow.file_ref}:`, _err);
  }

  await db('evidence_files').where({ id: fileId }).delete();

  return { message: 'File deleted.' };
}

export async function getEvidenceFile(
  evidenceId: string,
  fileId: string,
  viewerRoles: string[]
): Promise<{ storage_key: string; original_filename: string; mime_type: string }> {
  const fileRow = await db('evidence_files as ef')
    .join('evidence_items as ei', 'ei.id', 'ef.evidence_id')
    .where('ef.id', fileId)
    .where('ef.evidence_id', evidenceId)
    .select('ef.*', 'ei.sensitivity')
    .first();

  if (!fileRow) {
    throw Object.assign(new Error('File not found.'), { status: 404 });
  }

  if (fileRow.sensitivity === 'restricted' && !canViewRestricted(viewerRoles)) {
    throw Object.assign(new Error('Access denied — restricted evidence.'), { status: 403 });
  }

  return {
    storage_key: fileRow.file_ref as string,
    original_filename: fileRow.filename as string,
    mime_type: fileRow.mime_type as string,
  };
}
