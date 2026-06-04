---

## F01: Core Data Objects

**Description:** Core Data Objects defines the ten persistent entities that form the backbone of the EMS data model. Every feature creates, reads, updates, or relates these objects. This feature specifies the canonical fields, data types, allowed values, and integrity constraints for each entity. The full DDL is in `Y0-schema.md`.

**Terminology:**
- **UUID:** Universally Unique Identifier used as primary key for all entities.
- **Enum field:** A column whose value must be drawn from a fixed allowed-values list defined here.
- **Foreign key (FK):** A field referencing the primary key of another entity; the referenced record must exist.
- **Soft delete:** Records are marked `deleted_at` rather than physically removed; this preserves audit and gate history.

**Sub-features:**
- F01.1 — Request entity
- F01.2 — Engagement entity
- F01.3 — Team Assignment entity
- F01.4 — Planning Record entity
- F01.5 — Objective entity
- F01.6 — Evidence Item entity
- F01.7 — Finding entity
- F01.8 — Draft Product entity
- F01.9 — Gate Decision entity
- F01.10 — Audit Event entity

---

### F01.1 Request Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `request_type` | enum | not null | `congressional_request`, `mandate`, `internal_proposal` |
| `requester` | string(255) | not null | Name or organization |
| `topic` | string(500) | not null | Brief topic description |
| `agency_program` | string(255) | not null | Agency or program name |
| `due_date` | date | not null | Requested completion date |
| `notes` | text | nullable | Free-text notes |
| `status` | enum | not null, default `draft` | `draft`, `submitted`, `accepted`, `declined` |
| `intake_document_ref` | string(1000) | nullable | File storage reference (path/URL) |
| `intake_document_name` | string(255) | nullable | Original file name |
| `created_by` | UUID (FK users) | not null | User who created the request |
| `created_at` | timestamptz | not null | System-generated |
| `updated_at` | timestamptz | not null | System-managed |

---

### F01.2 Engagement Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `request_id` | UUID (FK requests) | nullable | Source request; null for manually created engagements |
| `job_code` | string(100) | not null, unique | Assigned engagement identifier |
| `title` | string(500) | not null | Engagement title |
| `phase` | enum | not null | `intake`, `planning`, `evidence`, `draft`, `readiness`, `closed` |
| `status` | enum | not null | `active`, `on_hold`, `ready_for_issuance`, `closed` |
| `risk_level` | enum | not null | `low`, `medium`, `high` |
| `owner_id` | UUID (FK users) | not null | Engagement Manager owning this engagement |
| `portfolio` | string(255) | nullable | Portfolio or program grouping |
| `created_at` | timestamptz | not null | System-generated at A1 approval |
| `updated_at` | timestamptz | not null | System-managed |

---

### F01.3 Team Assignment Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null | |
| `user_id` | UUID (FK users) | not null | |
| `role` | enum | not null | `AL`, `EM`, `AN`, `QA`, `IR`, `PC`, `RO` |
| `assigned_at` | timestamptz | not null | System-generated |
| `assigned_by` | UUID (FK users) | not null | |

Unique constraint: `(engagement_id, user_id, role)`.

---

### F01.4 Planning Record Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null, unique | One planning record per engagement |
| `design_approach` | text | nullable | Design or methodology summary |
| `schedule_notes` | text | nullable | Key dates and schedule summary |
| `risk_notes` | text | not null (before P2) | Risk notes |
| `data_reliability_notes` | text | not null (before P2) | Data reliability notes |
| `independence_status` | enum | not null (before P2) | `affirmed`, `pending`, `exception_noted` |
| `status` | enum | not null, default `draft` | `draft`, `ready_for_review`, `approved`, `returned` |
| `approved_at` | timestamptz | nullable | Set at P2 approval |
| `approved_by` | UUID (FK users) | nullable | Set at P2 approval |
| `created_at` | timestamptz | not null | |
| `updated_at` | timestamptz | not null | |

---

### F01.5 Objective Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null | |
| `planning_record_id` | UUID (FK planning_records) | not null | |
| `objective_text` | text | not null | Full text of the objective |
| `information_need` | text | nullable | What information is needed to answer this objective |
| `status` | enum | not null, default `evidence_needed` | `evidence_needed`, `in_review`, `sufficient` |
| `sort_order` | integer | not null, default 0 | Display ordering |
| `created_at` | timestamptz | not null | |
| `updated_at` | timestamptz | not null | |

---

### F01.6 Evidence Item Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null | |
| `evidence_type` | enum | not null | `document`, `dataset`, `interview_note`, `meeting_note`, `other` |
| `source` | string(500) | not null | Origin of the evidence |
| `date_received` | date | not null | Date evidence was received |
| `custodian` | string(255) | nullable | Custodian or provider name |
| `description` | text | nullable | Brief description |
| `sensitivity` | enum | not null, default `standard` | `standard`, `restricted` |
| `uploaded_by` | UUID (FK users) | not null | |
| `created_at` | timestamptz | not null | |
| `updated_at` | timestamptz | not null | |

Evidence files are stored separately in `evidence_files` (see Y0-schema.md).

---

### F01.7 Finding Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null | |
| `finding_text` | text | not null | Draft finding or conclusion text |
| `status` | enum | not null, default `draft` | `draft`, `under_review`, `accepted`, `rejected` |
| `created_by` | UUID (FK users) | not null | |
| `created_at` | timestamptz | not null | |
| `updated_at` | timestamptz | not null | |

Finding-to-evidence links are stored in `finding_evidence_links` (see Y0-schema.md).

---

### F01.8 Draft Product Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null, unique | One draft product per engagement |
| `title` | string(500) | not null | Draft product title |
| `version` | string(50) | not null | Version label, e.g. `v1.0` |
| `owner_id` | UUID (FK users) | not null | |
| `status` | enum | not null, default `drafting` | `drafting`, `under_review`, `ready_for_reference_check`, `ready_for_final_review` |
| `review_comments` | text | nullable | Reviewer comments |
| `file_ref` | string(1000) | nullable | Attached draft file storage reference |
| `file_name` | string(255) | nullable | Original draft file name |
| `created_at` | timestamptz | not null | |
| `updated_at` | timestamptz | not null | |

---

### F01.9 Gate Decision Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | not null | |
| `gate_type` | enum | not null | `A1`, `P2`, `P3`, `P4` |
| `status` | enum | not null | `approved`, `declined`, `returned` |
| `approver_id` | UUID (FK users) | not null | |
| `decided_at` | timestamptz | not null | System-generated at decision time |
| `rationale` | text | not null | Required rationale or comment |
| `created_at` | timestamptz | not null | |

Gate decisions are **immutable** after creation. Multiple gate decisions of the same type are permitted (re-decisions after return/revision); the most recent defines the current gate status.

---

### F01.10 Audit Event Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, not null | System-generated |
| `engagement_id` | UUID (FK engagements) | nullable | Null for system-wide events |
| `actor_id` | UUID (FK users) | not null | |
| `actor_name` | string(255) | not null | Snapshot of actor name at event time |
| `action` | string(100) | not null | Machine-readable action code (see Y2-errors.md) |
| `object_type` | string(100) | not null | Entity type affected |
| `object_id` | UUID | nullable | ID of affected entity |
| `summary` | text | not null | Human-readable change summary |
| `before_snapshot` | jsonb | nullable | State before the change |
| `after_snapshot` | jsonb | nullable | State after the change |
| `occurred_at` | timestamptz | not null | System-generated |

Audit events are **immutable** after creation (no UPDATE or DELETE permitted).

---

**API Surface (F01):** Core data objects are accessed through feature-specific endpoints — see `Y1-api.md` for the full catalog.

**Schema Surface (F01):** All ten entities' full DDL is in `Y0-schema.md`.
