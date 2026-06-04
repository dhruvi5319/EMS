# Functional Requirements Document (FRD)
## Lightweight Engagement Management System (EMS)

**Project Acronym:** EMS  
**Version:** 1.0  
**Date:** 2026-06-04  
**Status:** Active  
**Source PRD:** PRD-EMS.md v1.0  

---

## Scope Statement

This FRD specifies the functional behavior of every feature in the EMS MVP (Features F0–F17). It transforms the product requirements defined in PRD-EMS.md into implementation-ready specifications covering inputs, outputs, validation rules, error handling, role-based access control, database schema, and REST API contracts. Developers must be able to implement each feature from the corresponding chunk without ambiguity or additional requirements discovery.

---

## How to Read This Document

- **Feature chunks** (`F00`–`F17`) each cover one PRD feature with description, terminology, sub-features, process, inputs, outputs, validation, error states, per-feature API summary, and per-feature schema surface.
- **Cross-feature chunks** (`Y0`–`Y3`) consolidate the full database DDL, REST API catalog, cross-feature error catalog, and integration points.
- **Feature IDs** use zero-padded two-digit numbers (`F00`, `F01`, …, `F17`) to match PRD feature IDs `F0`–`F17`.
- **Gate IDs** follow PRD naming: `A1`, `P2`, `P3`, `P4`.
- **Role abbreviations** used in permission tables:

| Abbreviation | Role |
|---|---|
| AL | Engagement Acceptance Lead |
| EM | Engagement Manager |
| AN | Analyst |
| QA | QA Reviewer |
| IR | Independent Referencer |
| PC | Publishing Coordinator |
| RO | Read-Only Stakeholder |
| AD | Admin |

- **HTTP method conventions:** `GET` = read, `POST` = create, `PUT` = replace, `PATCH` = partial update, `DELETE` = remove.
- **Validation failure response:** HTTP 422 with an `errors` array unless a different code is specified.
- **Authorization failure response:** HTTP 403 with error code `FORBIDDEN`.
- **Authentication failure response:** HTTP 401 with error code `UNAUTHORIZED`.

---

## Master Table of Contents

| Chunk | File | Coverage |
|---|---|---|
| Header | `00-header.md` | This file — conventions, TOC, shared terminology |
| F00 | `F00-application-shell.md` | Basic Application Shell |
| F01 | `F01-core-data-objects.md` | Core Data Objects |
| F02 | `F02-request-intake.md` | Request Intake |
| F03 | `F03-gate-a1.md` | Acceptance Decision — Gate A1 |
| F04 | `F04-engagement-shell.md` | Engagement Shell |
| F05 | `F05-team-milestones.md` | Team and Milestones |
| F06 | `F06-planning-record.md` | Lightweight Planning Record |
| F07 | `F07-gate-p2.md` | Planning Approval — Gate P2 |
| F08 | `F08-evidence-registry.md` | Evidence Registry |
| F09 | `F09-evidence-objective-link.md` | Evidence-to-Objective Link |
| F10 | `F10-gate-p3.md` | Findings and Sufficiency — Gate P3 |
| F11 | `F11-draft-product.md` | Draft Product Record |
| F12 | `F12-indexing-reference-check.md` | Basic Indexing and Reference Check |
| F13 | `F13-gate-p4.md` | Final Readiness — Gate P4 |
| F14 | `F14-portfolio-dashboard.md` | Portfolio Dashboard |
| F15 | `F15-engagement-detail-dashboard.md` | Engagement Detail Dashboard |
| F16 | `F16-persona-journey.md` | Persona and Journey Artifacts |
| F17 | `F17-acceptance-tests.md` | Basic Acceptance Test Generation |
| Y0 | `Y0-schema.md` | Full Database DDL |
| Y1 | `Y1-api.md` | REST API Catalog |
| Y2 | `Y2-errors.md` | Cross-Feature Error Catalog |
| Y3 | `Y3-integrations.md` | External Integration Points |

---

## Shared Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **Engagement** | A structured body of work performed in response to a request, mandate, or internal decision. |
| **Request** | The intake record that initiates the engagement workflow. |
| **Engagement Shell** | The main record for an accepted engagement, including metadata, phase, status, owner, team, milestones, and artifacts. |
| **Gate A1** | Acceptance approval gate. Passing A1 creates an engagement shell. |
| **Gate P2** | Planning approval gate. Passing P2 locks the lightweight planning baseline. |
| **Gate P3** | Evidence readiness gate. Passing P3 confirms evidence is sufficient to proceed to draft readiness work. |
| **Gate P4** | Final readiness gate. Passing P4 confirms reference checks and final review are complete. |
| **Planning Baseline** | The approved set of objectives, design approach, schedule, risk notes, data reliability notes, and independence affirmations locked by Gate P2. |
| **Objective** | A research question or work objective that evidence and findings must support. |
| **Evidence Item** | A document, dataset, interview note, or other item collected to support engagement objectives. |
| **Finding** | A draft conclusion or observation supported by evidence. |
| **Draft Product** | A working report or product record prepared from findings and reviewed before final readiness. |
| **Indexing** | Linking a draft statement or finding to supporting evidence. |
| **Reference Check** | Independent verification that an indexed statement is supported by the linked evidence. |
| **Audit Event** | A timestamped, immutable record of an important action: approval, status change, upload, or review decision. |
| **Blocker** | Any condition that prevents a gate from passing or a phase from advancing. |
| **Restricted Evidence** | Evidence flagged as sensitive; visible only to authorized roles assigned to the engagement. |
| **RBAC** | Role-Based Access Control — the authorization model governing all create/read/update/delete operations. |
| **Gate Decision** | The formal record of a gate outcome: gate type, status (Approved/Declined/Returned), approver, timestamp, rationale. |

---

## Role Permission Matrix (Summary)

| Action Category | AL | EM | AN | QA | IR | PC | RO | AD |
|---|---|---|---|---|---|---|---|---|
| Login/Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/Edit Request | ✓ | — | — | — | — | — | — | ✓ |
| Approve/Decline Gate A1 | ✓ | — | — | — | — | — | — | — |
| Edit Engagement Metadata | — | ✓ | — | — | — | — | — | ✓ |
| Manage Team/Milestones | — | ✓ | — | — | — | — | — | ✓ |
| Edit Planning Record | — | ✓ | ✓ | — | — | — | — | — |
| Approve/Return Gate P2 | — | — | — | ✓ | — | — | — | — |
| Upload Evidence | — | — | ✓ | — | — | — | — | — |
| Link Evidence to Objectives | — | — | ✓ | — | — | — | — | — |
| Create Findings | — | — | ✓ | — | — | — | — | — |
| Approve Gate P3 | — | — | — | ✓ | — | — | — | — |
| Create/Edit Draft Product | — | ✓ | ✓ | — | — | — | — | — |
| Perform Reference Check | — | — | — | — | ✓ | — | — | — |
| Approve Gate P4 | — | ✓ | — | — | — | ✓ | — | — |
| View Dashboards | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export CSV | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Manage Users/Roles | — | — | — | — | — | — | — | ✓ |
| Export Audit Log | — | — | — | — | — | — | — | ✓ |

---

## Gate Prerequisite Summary

| Gate | Key Prerequisites |
|---|---|
| **A1** | Request status = Submitted; all required request fields present |
| **P2** | A1 = Approved; ≥1 objective exists; owner assigned; team assigned; milestones set; risk notes, data reliability notes, and independence status present |
| **P3** | P2 = Approved; all objectives have ≥1 linked evidence item; no objective marked "Evidence Needed" |
| **P4** | P3 = Approved; all reference checks = Passed or Waived; no open blockers |

---

*End of header chunk. See feature chunks F00–F17 and cross-feature chunks Y0–Y3 for full specifications.*
---

## F00: Basic Application Shell

**Description:** The application shell is the authenticated web container that all other features live within. It provides login/logout, navigation, role assignment, and audit trail viewing. Every feature in the EMS depends on the shell to enforce authentication before rendering any page or accepting any API request.

**Terminology:**
- **Session:** An authenticated user context established after login; stored as a server-side session or JWT.
- **Navigation Rail/Sidebar:** The persistent UI element listing top-level sections: Dashboard, Requests, Engagements, Evidence, Review Queue, Reports.
- **Search Bar:** A global text input that queries across engagement ID, title, requester, phase, and owner.
- **Review Queue:** A filtered list of items awaiting the current user's action (gate approvals, reference checks, returns).

**Sub-features:**
- F00.1 — Login and logout
- F00.2 — User role assignment (Admin only)
- F00.3 — Main navigation
- F00.4 — Global search
- F00.5 — Audit trail view per engagement

---

### F00.1 Login and Logout

**Process:**
1. Unauthenticated user navigates to any protected route.
2. System redirects to the login page.
3. User submits username and password (or org identity provider flow).
4. System validates credentials.
5. On success: system creates a session, records login audit event, redirects to Dashboard.
6. On failure: system increments failed-login counter; after 5 consecutive failures within 15 minutes, locks account for 15 minutes and writes audit event.
7. User clicks Logout; system destroys session and redirects to login page.

**Inputs:**
- `username` (string, required): user's email address
- `password` (string, required): user's password

**Outputs:**
- Authenticated session (cookie or JWT) with `user_id`, `role`, `name`
- Redirect to `/dashboard`

**Validation:**
- `username` must be non-empty and valid email format.
- `password` must be non-empty.
- Credentials must match a known active user account.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Invalid credentials | 401 | `AUTH_INVALID` | "Invalid username or password." |
| Account locked | 403 | `AUTH_LOCKED` | "Account locked due to repeated failures. Try again in 15 minutes." |
| Missing username or password | 422 | `VALIDATION_ERROR` | Field-level errors array |

---

### F00.2 User Role Assignment

**Process:**
1. Admin navigates to User Management.
2. Admin selects a user and assigns one or more roles from the predefined list.
3. System saves the role assignment and writes an audit event.
4. New permissions take effect on the user's next request (or immediately if session is refreshed).

**Inputs:**
- `user_id` (UUID, required)
- `roles` (array of role codes, required): one or more of `AL`, `EM`, `AN`, `QA`, `IR`, `PC`, `RO`, `AD`

**Validation:**
- At least one role must be assigned.
- Role codes must be from the predefined list.
- Only Admin may invoke this action.

---

### F00.3 Main Navigation

The navigation rail exposes these top-level sections to all authenticated users:

| Section | Route | Visible To |
|---|---|---|
| Dashboard | `/dashboard` | All |
| Requests | `/requests` | AL, EM, AD, RO |
| Engagements | `/engagements` | All |
| Evidence | `/evidence` | AN, QA, EM, IR, AD, RO |
| Review Queue | `/review-queue` | AL, QA, IR, PC, EM |
| Reports | `/reports` | All |

Sections not visible to a role are hidden; direct URL access to a hidden section returns HTTP 403.

---

### F00.4 Global Search

**Inputs:**
- `q` (string, required): search query, minimum 2 characters

**Search targets:** engagement ID (exact), engagement title (contains), requester name (contains), phase (exact), owner name (contains)

**Outputs:**
- Ranked list of matching engagements (max 50 results)
- Each result: engagement ID, title, phase, owner, status

**Validation:**
- Query must be ≥2 characters.
- Results filtered to engagements the current user is authorized to view.

---

### F00.5 Audit Trail View

**Process:**
1. User with authorized role navigates to Engagement → Audit Trail tab.
2. System retrieves all audit events for the engagement, ordered by timestamp descending.
3. User can filter by action type and date range.

**Outputs:**
- List of audit events: timestamp, actor name, action, object type, object ID, summary

**Access control:** All roles assigned to an engagement may view its audit trail. Admin may view all audit trails.

---

**API Surface (F00):** see `Y1-api.md` §Auth and §Users for full request/response schemas.

**Schema Surface (F00):** uses tables `users`, `user_roles`, `sessions` — see `Y0-schema.md` §Auth.
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
---

## F02: Request Intake

**Description:** Request Intake allows an Engagement Acceptance Lead to create, edit, and submit a formal request record. The request is the entry point to the entire engagement lifecycle. It must capture sufficient information for an informed acceptance decision at Gate A1. Requests may be saved as drafts and submitted only when all required fields are present.

**Terminology:**
- **Draft status:** The request has been saved but not yet submitted for A1 review.
- **Submitted status:** The request has passed local validation and is queued for A1 decision.
- **Intake document:** A single file attachment (e.g., congressional letter, mandate memo, or internal proposal document) uploaded alongside the request record.

**Sub-features:**
- F02.1 — Create request (Draft)
- F02.2 — Edit request (Draft only)
- F02.3 — Submit request
- F02.4 — Upload intake document
- F02.5 — View request detail

---

### F02.1 Create Request

**Roles permitted:** AL, AD

**Process:**
1. Authorized user navigates to Requests → New Request.
2. User fills in required and optional fields.
3. User clicks "Save as Draft."
4. System validates required fields for draft (only `request_type` required at save-as-draft).
5. System creates the request record with `status = draft`.
6. System writes an audit event: action `REQUEST_CREATED`.
7. System redirects to the request detail page.

**Inputs:**
- `request_type` (enum, required): `congressional_request` | `mandate` | `internal_proposal`
- `requester` (string ≤255, required for submit): requester name or organization
- `topic` (string ≤500, required for submit): brief description of the engagement topic
- `agency_program` (string ≤255, required for submit): agency or program name
- `due_date` (date, required for submit): YYYY-MM-DD format, must be a future date
- `notes` (string, optional): free-text notes, max 5000 characters

**Outputs:**
- Created `Request` record with `status = draft`
- Audit event `REQUEST_CREATED`

---

### F02.2 Edit Request

**Roles permitted:** AL, AD (only while `status = draft`)

**Process:**
1. User navigates to request detail and clicks Edit.
2. System confirms `status = draft`; if not, edit is blocked.
3. User modifies fields and saves.
4. System validates and updates the record.
5. System writes audit event `REQUEST_UPDATED`.

**Validation:**
- Editing is blocked if `status` is `submitted`, `accepted`, or `declined`.
- Any field may be updated while in draft status.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Edit attempted on submitted/accepted/declined request | 409 | `REQUEST_NOT_EDITABLE` | "Request cannot be edited after submission." |
| Unauthorized role | 403 | `FORBIDDEN` | "You do not have permission to edit requests." |

---

### F02.3 Submit Request

**Roles permitted:** AL, AD

**Process:**
1. User clicks "Submit" on a draft request.
2. System runs full validation against all required-for-submit fields.
3. If validation fails: system returns 422 with field-level errors; status remains `draft`.
4. If validation passes: system sets `status = submitted`, records `submitted_at` timestamp.
5. System writes audit event `REQUEST_SUBMITTED`.
6. Request becomes visible in the A1 Review Queue.

**Validation (all required for submit):**
- `request_type` must be a valid enum value.
- `requester` must be non-empty, ≤255 characters.
- `topic` must be non-empty, ≤500 characters.
- `agency_program` must be non-empty, ≤255 characters.
- `due_date` must be present and a valid date (past dates are permitted since mandates may have retrospective dates, but system must warn if due date is in the past).
- If intake document was uploaded, file reference must be stored successfully before submit can proceed.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Required fields missing | 422 | `VALIDATION_ERROR` | Per-field errors array |
| Already submitted | 409 | `REQUEST_ALREADY_SUBMITTED` | "Request has already been submitted." |
| Unauthorized role | 403 | `FORBIDDEN` | "You do not have permission to submit requests." |

---

### F02.4 Upload Intake Document

**Roles permitted:** AL, AD (while `status = draft` or during editing before submission)

**Process:**
1. User selects a file using the file picker on the request form.
2. System validates file type and size.
3. System stores the file in file storage under path `requests/{request_id}/{filename}`.
4. System records `intake_document_ref` and `intake_document_name` on the request record.
5. Only one intake document is allowed; uploading a new file replaces the previous one.
6. System writes audit event `REQUEST_DOCUMENT_UPLOADED`.

**File Constraints:**
- **Allowed types:** PDF, DOCX, DOC, XLSX, XLS, TXT, PNG, JPG, JPEG
- **Maximum file size:** 25 MB
- **One file per request** (replacing an existing upload is allowed while in draft status)

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| File type not allowed | 422 | `FILE_TYPE_NOT_ALLOWED` | "File type not permitted. Allowed: PDF, DOCX, DOC, XLSX, XLS, TXT, PNG, JPG." |
| File exceeds 25 MB | 422 | `FILE_TOO_LARGE` | "File exceeds maximum size of 25 MB." |
| Storage error | 503 | `STORAGE_ERROR` | "File could not be saved. Please try again." |

---

### F02.5 View Request Detail

**Roles permitted:** AL, EM (read), AD, RO

**Outputs (displayed):**
- Request type, requester, topic, agency/program, due date, notes
- Current status badge
- Intake document download link (if present)
- Submission timestamp (if submitted)
- A1 gate decision summary (if decided)
- Audit trail link

---

**API Surface (F02):** see `Y1-api.md` §Requests for full request/response schemas.  
**Schema Surface (F02):** uses table `requests` — see `Y0-schema.md` §Requests.
---

## F03: Acceptance Decision — Gate A1

**Description:** Gate A1 is the first formal governance checkpoint in the engagement lifecycle. An Engagement Acceptance Lead reviews a submitted request, records a risk level assessment, and either approves or declines the engagement. On approval, the system automatically creates an Engagement Shell (F04 record) and transitions the request to Accepted status. On decline, the request is closed with a recorded rationale. All A1 decisions create an immutable audit event and a Gate Decision record.

**Terminology:**
- **A1 Approval:** The gate outcome that creates an engagement shell and sets request status to `accepted`.
- **A1 Decline:** The gate outcome that closes the request with rationale; sets request status to `declined`.
- **Risk Level:** A required assessment (`low`, `medium`, `high`) recorded alongside the A1 decision, copied to the Engagement record on approval.
- **Auto-creation:** The process by which the system creates the Engagement record without any additional user action after A1 approval.

**Sub-features:**
- F03.1 — Review submitted request for A1
- F03.2 — Approve request (Gate A1 pass)
- F03.3 — Decline request (Gate A1 fail)
- F03.4 — Auto-create engagement shell on approval
- F03.5 — A1 gate decision visibility

---

### F03.1 Review Submitted Request for A1

**Roles permitted:** AL only

**Process:**
1. AL navigates to Review Queue or Requests list; filters by `status = submitted`.
2. AL opens the request detail page.
3. System displays all request fields, intake document download link, and submission timestamp.
4. System confirms `status = submitted` before rendering A1 decision controls.

**Validation:**
- A1 decision controls must not be rendered if `status ≠ submitted`.
- Only users with role `AL` may see and use A1 decision controls.

---

### F03.2 Approve Request — Gate A1 Pass

**Roles permitted:** AL only

**Process:**
1. AL selects risk level (`low`, `medium`, or `high`) from the A1 form.
2. AL enters approval rationale (required).
3. AL clicks "Approve."
4. System validates prerequisites (see Prerequisite Rules below).
5. System creates a `GateDecision` record:  
   - `gate_type = A1`, `status = approved`, `approver_id`, `decided_at = now()`, `rationale`
6. System creates an `Engagement` record (auto-creation — see F03.4).
7. System updates request: `status = accepted`.
8. System writes audit event `GATE_A1_APPROVED`.
9. System redirects AL to the new Engagement Shell page.

**Prerequisite Validation Rules (all must pass before A1 approval):**
- `request.status` must be `submitted`.
- `request.request_type` must be non-null.
- `request.requester` must be non-null and non-empty.
- `request.topic` must be non-null and non-empty.
- `request.agency_program` must be non-null and non-empty.
- `request.due_date` must be non-null.
- `risk_level` must be provided in the A1 decision form (`low`, `medium`, or `high`).
- `rationale` must be non-null and non-empty (minimum 10 characters).

**Inputs:**
- `request_id` (UUID, required)
- `risk_level` (enum, required): `low` | `medium` | `high`
- `rationale` (string, required, min 10 chars)

**Outputs:**
- `GateDecision` record (`status = approved`)
- `Engagement` record (new, `phase = planning`, `status = active`)
- `Request` record updated to `status = accepted`
- Audit event `GATE_A1_APPROVED`

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Request not in `submitted` status | 409 | `GATE_PREREQUISITE_FAILED` | "Request must be in Submitted status to pass A1." |
| Required request fields missing | 422 | `GATE_FIELDS_INCOMPLETE` | "Request is missing required fields: [field list]." |
| Risk level not provided | 422 | `VALIDATION_ERROR` | "Risk level is required for A1 approval." |
| Rationale too short | 422 | `VALIDATION_ERROR` | "Rationale must be at least 10 characters." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only an Engagement Acceptance Lead may approve A1." |
| Request already decided | 409 | `GATE_ALREADY_DECIDED` | "This request has already been accepted or declined." |

---

### F03.3 Decline Request — Gate A1 Fail

**Roles permitted:** AL only

**Process:**
1. AL enters decline rationale (required).
2. AL clicks "Decline."
3. System validates prerequisites.
4. System creates a `GateDecision` record:  
   - `gate_type = A1`, `status = declined`, `approver_id`, `decided_at = now()`, `rationale`
5. System updates request: `status = declined`.
6. System writes audit event `GATE_A1_DECLINED`.
7. System displays confirmation and returns AL to the requests list.

**No engagement shell is created on decline.**

**Inputs:**
- `request_id` (UUID, required)
- `rationale` (string, required, min 10 chars)

**Validation:**
- `request.status` must be `submitted`.
- `rationale` must be non-empty, minimum 10 characters.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Request not in `submitted` status | 409 | `GATE_PREREQUISITE_FAILED` | "Request must be in Submitted status to decline." |
| Rationale missing or too short | 422 | `VALIDATION_ERROR` | "Rationale must be at least 10 characters." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only an Engagement Acceptance Lead may decline A1." |

---

### F03.4 Auto-Create Engagement Shell on Approval

**Triggered by:** Successful A1 approval (F03.2)

**Engagement record created with these initial values:**

| Field | Value |
|---|---|
| `id` | System-generated UUID |
| `request_id` | FK to the approved request |
| `job_code` | Auto-generated from pattern `ENG-{YYYY}-{5-digit-sequence}` |
| `title` | Copied from `request.topic` (editable after creation) |
| `phase` | `planning` |
| `status` | `active` |
| `risk_level` | Value from A1 decision form |
| `owner_id` | Set to the current AL user; must be reassigned to EM by Engagement Manager setup |
| `portfolio` | null (set later in F04) |
| `created_at` | `now()` |

**Job code generation:** Sequence is per-year, zero-padded to 5 digits (e.g., `ENG-2026-00001`). If sequence generation fails, the transaction is rolled back and an error returned.

---

### F03.5 A1 Gate Decision Visibility

- The A1 gate decision is visible on:
  - The request detail page (decision summary card)
  - The Engagement Shell gate status section (once the engagement exists)
  - The Portfolio Dashboard gate status column
  - The Audit Trail for the engagement
- Gate decision history is preserved even if the engagement is later closed or archived.

---

**API Surface (F03):** see `Y1-api.md` §Gates for full request/response schemas.  
**Schema Surface (F03):** uses tables `gate_decisions`, `engagements`, `requests` — see `Y0-schema.md` §Gates and §Engagements.
---

## F04: Engagement Shell

**Description:** The Engagement Shell is the primary system-of-record page for an accepted engagement. It is created automatically at Gate A1 approval and serves as the hub that all downstream features (planning, evidence, findings, draft product, gate decisions) reference. Authorized roles can edit core metadata, view current gate status, see open blockers, and navigate to linked artifacts.

**Terminology:**
- **Metadata:** Core engagement fields: job code, title, phase, status, risk level, owner, portfolio.
- **Open Blocker:** Any condition that prevents the next gate from passing, displayed as a visible warning on the shell.
- **Gate Status Card:** A UI component showing the current outcome (Not Started / Approved / Declined / Returned) for each of A1, P2, P3, and P4.

**Sub-features:**
- F04.1 — View Engagement Shell
- F04.2 — Edit Engagement Metadata
- F04.3 — Display Gate Status Summary
- F04.4 — Display Open Blockers
- F04.5 — Navigate to Linked Artifacts

---

### F04.1 View Engagement Shell

**Roles permitted:** All roles assigned to the engagement; AD; RO (read only)

**Displayed fields:**
- Job code, title, phase, status badge, risk level badge
- Owner name and role
- Portfolio (if set)
- Created date
- Due date (from originating request, if applicable)
- Gate status cards: A1, P2, P3, P4 (each showing status, approver, date if decided)
- Open blockers list (see F04.4)
- Linked artifact counts: team members, objectives, evidence items, findings, draft product status

**Process:**
1. User navigates to `/engagements/{id}`.
2. System checks that the user is authorized to view this engagement (team assignment or Admin).
3. System loads all engagement fields, gate decisions, and artifact counts.
4. System renders the shell page.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Engagement not found | 404 | `NOT_FOUND` | "Engagement not found." |
| User not authorized for this engagement | 403 | `FORBIDDEN` | "You are not authorized to view this engagement." |

---

### F04.2 Edit Engagement Metadata

**Roles permitted:** EM, AD

**Editable fields:**
- `title` (string ≤500, required)
- `phase` (enum): system advances phase automatically at gates; manual override permitted by EM with a revision note
- `status` (enum): `active`, `on_hold`; `ready_for_issuance` and `closed` are set by gate outcomes only
- `risk_level` (enum): `low`, `medium`, `high`
- `owner_id` (UUID): reassign to another user with EM role
- `portfolio` (string ≤255, nullable)

**Process:**
1. EM navigates to Engagement Shell and clicks Edit.
2. EM modifies allowed fields.
3. EM clicks Save.
4. System validates inputs.
5. System saves changes and writes audit event `ENGAGEMENT_UPDATED`.

**Validation:**
- `title` must be non-empty.
- `phase` manual override requires a non-empty `revision_note` (minimum 10 characters).
- `owner_id` must reference an active user with `EM` role.
- `status` cannot be set to `ready_for_issuance` or `closed` through the edit form; those are gate-controlled.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Title empty | 422 | `VALIDATION_ERROR` | "Title is required." |
| Invalid owner (not an EM) | 422 | `VALIDATION_ERROR` | "Owner must be a user with the Engagement Manager role." |
| Attempting to set gate-controlled status | 422 | `STATUS_LOCKED` | "Status can only be set to Ready for Issuance or Closed through gate approval." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only Engagement Managers may edit engagement metadata." |

---

### F04.3 Display Gate Status Summary

The shell must display a gate status card for each gate: A1, P2, P3, P4.

**Gate status card contents:**

| Field | Value when decided | Value when not yet decided |
|---|---|---|
| Gate label | `A1` / `P2` / `P3` / `P4` | same |
| Outcome | `Approved` / `Declined` / `Returned` | `Not Started` |
| Approver name | Recorded approver | — |
| Decision date | ISO date | — |
| Rationale preview | First 100 chars | — |

Gate status cards must remain visible even after the engagement transitions to a later phase. All gate history must be accessible via "View History" link showing all gate decisions for that gate type in reverse chronological order.

---

### F04.4 Display Open Blockers

Blockers are computed dynamically and displayed as a list on the shell. A blocker is any one of:

| Blocker Condition | Blocker Text |
|---|---|
| Planning record not in `approved` status | "Planning record is not approved (P2 required)." |
| Any objective with status `evidence_needed` | "Objective '{text}' has no linked evidence." |
| Any objective with status `in_review` (at P3) | "Objective '{text}' is still In Review." |
| Any finding with no linked evidence | "Finding '{text prefix}' has no linked evidence." |
| Any reference check in `in_review` or `failed` status | "Reference check for statement '{text prefix}' is {status}." |
| P3 not approved and draft product exists | "Gate P3 must be approved before P4 can proceed." |

The blockers list is empty when all prerequisites are met. A visible "No open blockers" message must appear when the list is empty.

---

### F04.5 Navigate to Linked Artifacts

The shell provides navigation links to:

| Section | Target |
|---|---|
| Team | `/engagements/{id}/team` (F05) |
| Planning Record | `/engagements/{id}/planning` (F06) |
| Evidence | `/engagements/{id}/evidence` (F08, F09) |
| Findings | `/engagements/{id}/findings` (F10) |
| Draft Product | `/engagements/{id}/draft` (F11, F12) |
| Gate History | `/engagements/{id}/gates` |
| Audit Trail | `/engagements/{id}/audit` |

---

**API Surface (F04):** see `Y1-api.md` §Engagements.  
**Schema Surface (F04):** uses table `engagements` — see `Y0-schema.md` §Engagements.
---

## F05: Team and Milestones

**Description:** Team and Milestones allows the Engagement Manager to assign specific users to predefined engagement roles and to set target dates for key milestones. Role clarity is a prerequisite for Gate P2 approval (which requires the team to be assigned) and is the basis for routing actions and notifications throughout the engagement. Milestone dates provide the progress tracking visible in dashboards.

**Terminology:**
- **Team Assignment:** A record binding a user, a role, and an engagement.
- **Milestone:** A named target date for a key phase transition in the engagement lifecycle.
- **Milestone Status:** A computed or manually set state indicating whether the milestone is on track.

**Sub-features:**
- F05.1 — Assign team members
- F05.2 — Remove team members
- F05.3 — Set milestone dates
- F05.4 — View milestone status

---

### F05.1 Assign Team Members

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to `/engagements/{id}/team`.
2. EM clicks "Add Team Member."
3. EM selects a user from the user list and assigns a role.
4. System validates the assignment (no duplicate role for same user on same engagement).
5. System creates a `TeamAssignment` record.
6. System writes audit event `TEAM_MEMBER_ASSIGNED`.

**Inputs:**
- `engagement_id` (UUID, required): derived from route
- `user_id` (UUID, required): must be an active user
- `role` (enum, required): `AL`, `EM`, `AN`, `QA`, `IR`, `PC`, `RO`

**Predefined role slots per engagement:**

| Role | Min | Max | Notes |
|---|---|---|---|
| EM (Engagement Manager) | 1 | 2 | Required; at least one must be assigned |
| AN (Analyst) | 0 | — | One or more expected before evidence work |
| QA (QA Reviewer) | 1 | — | Required before P2 |
| IR (Independent Referencer) | 0 | — | Required before reference check |
| PC (Publishing Coordinator) | 0 | 2 | Optional; needed before P4 |
| AL (Acceptance Lead) | 0 | — | May be assigned for visibility |
| RO (Read-Only Stakeholder) | 0 | — | View access only |

**Validation:**
- A user may hold more than one role on the same engagement.
- The same user-role combination may not be duplicated on the same engagement.
- The selected user must be an active account.
- Only an EM or AD may add team members.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Duplicate user-role assignment | 409 | `ASSIGNMENT_DUPLICATE` | "This user already holds this role on the engagement." |
| User not active | 422 | `VALIDATION_ERROR` | "Selected user is not an active account." |
| Invalid role code | 422 | `VALIDATION_ERROR` | "Role must be one of: AL, EM, AN, QA, IR, PC, RO." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Engagement Managers may manage team assignments." |

---

### F05.2 Remove Team Members

**Roles permitted:** EM, AD

**Process:**
1. EM clicks Remove next to a team member.
2. System checks that removing the member does not violate minimum role requirements (e.g., cannot remove last EM).
3. System soft-deletes the `TeamAssignment` record (sets `removed_at`).
4. System writes audit event `TEAM_MEMBER_REMOVED`.

**Validation:**
- Cannot remove the last EM on an engagement.
- Cannot remove a QA Reviewer if P2 has not yet been approved (they are needed for the decision).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Removing last EM | 409 | `TEAM_MIN_VIOLATED` | "Cannot remove the last Engagement Manager from the team." |

---

### F05.3 Set Milestone Dates

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to `/engagements/{id}/team` (milestone section).
2. EM enters or updates target dates for each milestone.
3. System validates dates.
4. System saves the milestone dates.
5. System writes audit event `MILESTONES_UPDATED`.

**Milestone definitions:**

| Milestone Key | Label | Notes |
|---|---|---|
| `planning_approval_target` | Planning Approval (P2) Target | Target date for Gate P2 approval |
| `evidence_readiness_target` | Evidence Readiness (P3) Target | Target date for Gate P3 approval |
| `draft_readiness_target` | Draft Readiness Target | Target date for draft product ready for review |
| `final_readiness_target` | Final Readiness (P4) Target | Target date for Gate P4 approval |

**Inputs:**
- Each milestone date: `date` field in `YYYY-MM-DD` format; nullable (not yet set = Not Started)

**Validation:**
- Milestone dates must be valid dates.
- `evidence_readiness_target` must be on or after `planning_approval_target` if both are set.
- `draft_readiness_target` must be on or after `evidence_readiness_target` if both are set.
- `final_readiness_target` must be on or after `draft_readiness_target` if both are set.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Invalid date format | 422 | `VALIDATION_ERROR` | "Date must be in YYYY-MM-DD format." |
| Date ordering violation | 422 | `VALIDATION_ERROR` | "Milestone dates must be in chronological order." |

---

### F05.4 View Milestone Status

**Milestone status is computed as follows:**

| Status | Condition |
|---|---|
| `not_started` | Target date is null |
| `on_track` | Target date is in the future and the associated gate has not passed |
| `at_risk` | Target date is within 7 days and the associated gate has not passed |
| `complete` | Associated gate has been approved |
| `overdue` | Target date is in the past and the associated gate has not passed |

The milestone status is displayed on the Engagement Shell (F04) and the Engagement Detail Dashboard (F15). Status is read-only (computed); the status field cannot be manually set by users except for milestones with no associated gate (computed by EM judgment, stored separately as `milestone_manual_status`).

---

**API Surface (F05):** see `Y1-api.md` §Team and §Milestones.  
**Schema Surface (F05):** uses tables `team_assignments`, `milestones` — see `Y0-schema.md` §Team.
---

## F06: Lightweight Planning Record

**Description:** The Lightweight Planning Record captures the planning baseline for an engagement: objectives, design approach, schedule notes, risk notes, data reliability notes, and independence affirmations. The record may be saved as a Draft at any time and submitted as Ready for Review when all required sections are complete. It becomes the baseline that Gate P2 locks. After P2 approval, edits require a revision note.

**Terminology:**
- **Draft:** Planning record saved but not yet submitted for P2 review.
- **Ready for Review:** Planning record submitted to the QA Reviewer's queue for P2 decision.
- **Approved:** Planning record locked after P2 approval; edits require a revision note.
- **Returned:** Planning record sent back by QA Reviewer with comments for revision.
- **Independence Affirmation:** A statement confirming that assigned team members have no conflict of interest for this engagement.
- **Revision Note:** A required comment explaining why an approved planning record is being modified.

**Sub-features:**
- F06.1 — Create planning record
- F06.2 — Add and manage objectives
- F06.3 — Complete planning sections
- F06.4 — Submit planning record for review
- F06.5 — Edit approved planning record (post-P2)

---

### F06.1 Create Planning Record

**Roles permitted:** EM, AN, AD

**Process:**
1. EM navigates to `/engagements/{id}/planning`.
2. If no planning record exists, system shows "Start Planning Record" button.
3. EM clicks button; system creates a planning record with `status = draft`.
4. System writes audit event `PLANNING_RECORD_CREATED`.

**Validation:**
- Only one planning record may exist per engagement.
- The engagement must have `status = active` and `phase` not `closed`.

---

### F06.2 Add and Manage Objectives

**Roles permitted:** EM, AN, AD (while planning record `status ≠ approved`; see F06.5 for post-approval)

**Process:**
1. User navigates to the planning record's Objectives section.
2. User clicks "Add Objective."
3. User enters objective text (required) and information need (optional).
4. System saves the objective linked to the planning record.
5. User may reorder objectives using sort order controls.
6. User may edit or delete objectives (deletion blocked if evidence is linked to the objective).

**Inputs (per objective):**
- `objective_text` (text, required): full text of the objective
- `information_need` (text, optional): what information is needed to address this objective
- `sort_order` (integer, optional): display ordering

**Validation:**
- `objective_text` must be non-empty.
- At least one objective must exist before the planning record can be submitted for P2 review.
- Deletion of an objective is blocked if any evidence item is linked to it.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Delete objective with linked evidence | 409 | `OBJECTIVE_HAS_EVIDENCE` | "Cannot delete this objective — it has linked evidence items. Unlink evidence first." |
| Objective text empty | 422 | `VALIDATION_ERROR` | "Objective text is required." |

---

### F06.3 Complete Planning Sections

**Roles permitted:** EM, AN, AD (while `status ≠ approved`; see F06.5 for post-approval)

**Planning record fields and requirements:**

| Section | Field | Required for Submit | Notes |
|---|---|---|---|
| Design Approach | `design_approach` | No | Text field; recommended |
| Schedule Notes | `schedule_notes` | No | Key dates and schedule summary |
| Risk Notes | `risk_notes` | **Yes** | Must be non-empty before P2 |
| Data Reliability Notes | `data_reliability_notes` | **Yes** | Must be non-empty before P2 |
| Independence Status | `independence_status` | **Yes** | Must be one of `affirmed`, `pending`, `exception_noted` |

The planning record can be saved as Draft with any fields populated; only the fields marked "Required for Submit" must be present before the record can transition to `ready_for_review`.

**Process:**
1. EM/AN fills in one or more planning sections.
2. User clicks "Save" (auto-save on blur is acceptable).
3. System saves the record with `status = draft`.
4. System writes audit event `PLANNING_RECORD_UPDATED` on each save.

---

### F06.4 Submit Planning Record for Review

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to the planning record and clicks "Submit for P2 Review."
2. System validates that all P2 prerequisites are met:
   - At least one objective exists.
   - `risk_notes` is non-empty.
   - `data_reliability_notes` is non-empty.
   - `independence_status` is set.
   - Engagement has an owner assigned.
   - At least one QA Reviewer is assigned to the team.
   - At least one milestone date is set.
3. If validation passes: `status → ready_for_review`; audit event `PLANNING_SUBMITTED_FOR_REVIEW`.
4. The planning record appears in the QA Reviewer's Review Queue.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| No objectives | 422 | `P2_PREREQUISITE_FAILED` | "At least one objective is required before submitting for P2." |
| Risk notes empty | 422 | `P2_PREREQUISITE_FAILED` | "Risk notes are required before submitting for P2." |
| Data reliability notes empty | 422 | `P2_PREREQUISITE_FAILED` | "Data reliability notes are required before submitting for P2." |
| Independence status not set | 422 | `P2_PREREQUISITE_FAILED` | "Independence status must be set before submitting for P2." |
| No QA Reviewer assigned | 422 | `P2_PREREQUISITE_FAILED` | "A QA Reviewer must be assigned to the team before submitting for P2." |
| No milestones set | 422 | `P2_PREREQUISITE_FAILED` | "At least one milestone date must be set before submitting for P2." |

---

### F06.5 Edit Approved Planning Record (Post-P2)

**Roles permitted:** EM, AD

**Process:**
1. After P2 approval, all planning record fields are locked in the UI.
2. EM clicks "Request Revision."
3. System prompts for a `revision_note` (required, minimum 10 characters).
4. After confirming, EM may edit the planning record fields.
5. Changes are saved; `status` remains `approved` but a `PlanningRevision` record is created with the revision note and before/after snapshot.
6. System writes audit event `PLANNING_RECORD_REVISED`.

**Inputs:**
- `revision_note` (string, required, min 10 chars): explains why the approved baseline is being changed

**Validation:**
- `revision_note` must be non-empty and at least 10 characters.
- Revisions to an approved planning record do not reset the gate to P2 unless the EM explicitly requests re-review.

---

**API Surface (F06):** see `Y1-api.md` §Planning.  
**Schema Surface (F06):** uses tables `planning_records`, `objectives`, `planning_revisions` — see `Y0-schema.md` §Planning.
---

## F07: Planning Approval — Gate P2

**Description:** Gate P2 is the planning governance checkpoint. A QA Reviewer reviews the planning record for completeness and either approves the baseline or returns it with comments for revision. Approval locks the planning baseline and advances the engagement to the evidence phase. Return keeps the record in a returned state with comments visible to the Engagement Manager for revision.

**Terminology:**
- **P2 Approval:** Gate outcome that locks the planning baseline; sets `planning_record.status = approved` and advances engagement phase to `evidence`.
- **P2 Return:** Gate outcome that sends the planning record back for revision; sets `planning_record.status = returned`.
- **Locked Baseline:** A planning record that has been P2-approved; subsequent edits require a revision note (see F06.5).

**Sub-features:**
- F07.1 — Review planning record for P2
- F07.2 — Approve planning baseline (Gate P2 pass)
- F07.3 — Return planning record for revision (Gate P2 return)
- F07.4 — P2 gate decision visibility

---

### F07.1 Review Planning Record for P2

**Roles permitted:** QA only

**Process:**
1. QA Reviewer navigates to Review Queue and selects a planning record with `status = ready_for_review`.
2. System displays the full planning record: design approach, schedule notes, risk notes, data reliability notes, independence status, objectives list, team assignment summary, milestone dates.
3. System displays the P2 prerequisite checklist (all items must be checked to approve).
4. QA Reviewer reads the record and decides to approve or return.

**P2 prerequisite checklist (all must be satisfied for approval):**
- [ ] At least one objective exists with `objective_text` non-empty.
- [ ] `risk_notes` is non-null and non-empty.
- [ ] `data_reliability_notes` is non-null and non-empty.
- [ ] `independence_status` is set to `affirmed`, `pending`, or `exception_noted`.
- [ ] Engagement has an owner assigned (`engagement.owner_id` is non-null).
- [ ] At least one team member with role `EM` is assigned.
- [ ] At least one milestone date is set.

---

### F07.2 Approve Planning Baseline — Gate P2 Pass

**Roles permitted:** QA only

**Process:**
1. QA Reviewer confirms all prerequisite items are satisfied.
2. QA Reviewer enters an approval comment (required).
3. QA Reviewer clicks "Approve."
4. System validates all P2 prerequisites programmatically (server-side validation, not just UI).
5. System creates a `GateDecision` record:  
   - `gate_type = P2`, `status = approved`, `approver_id`, `decided_at = now()`, `rationale`
6. System sets `planning_record.status = approved`, `approved_at = now()`, `approved_by = approver_id`.
7. System advances `engagement.phase = evidence`.
8. System writes audit event `GATE_P2_APPROVED`.

**Prerequisite Validation Rules (server-side, all must pass):**
- Planning record `status` must be `ready_for_review`.
- `planning_record.risk_notes` must be non-null and non-empty.
- `planning_record.data_reliability_notes` must be non-null and non-empty.
- `planning_record.independence_status` must be non-null.
- `engagement.owner_id` must be non-null.
- Count of `team_assignments` for this engagement with `role = EM` must be ≥ 1.
- Count of `objectives` for this planning record must be ≥ 1.
- Count of `milestones` for this engagement with a non-null target date must be ≥ 1.
- `rationale` must be non-null and non-empty (minimum 10 characters).

**Inputs:**
- `planning_record_id` (UUID, required): derived from engagement context
- `rationale` (string, required, min 10 chars): approval comment

**Outputs:**
- `GateDecision` record (`gate_type = P2`, `status = approved`)
- `planning_record.status = approved`
- `engagement.phase = evidence`
- Audit event `GATE_P2_APPROVED`

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Planning record not in `ready_for_review` | 409 | `GATE_PREREQUISITE_FAILED` | "Planning record must be in Ready for Review status." |
| Missing risk notes | 422 | `GATE_FIELDS_INCOMPLETE` | "Risk notes are required." |
| Missing data reliability notes | 422 | `GATE_FIELDS_INCOMPLETE` | "Data reliability notes are required." |
| Independence status not set | 422 | `GATE_FIELDS_INCOMPLETE` | "Independence status must be set." |
| No owner assigned | 422 | `GATE_FIELDS_INCOMPLETE` | "Engagement must have an owner assigned." |
| No EM on team | 422 | `GATE_FIELDS_INCOMPLETE` | "At least one Engagement Manager must be assigned." |
| No objectives | 422 | `GATE_FIELDS_INCOMPLETE` | "At least one objective is required." |
| No milestone dates | 422 | `GATE_FIELDS_INCOMPLETE` | "At least one milestone date must be set." |
| Rationale missing | 422 | `VALIDATION_ERROR` | "Approval comment is required." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only a QA Reviewer may approve Gate P2." |

---

### F07.3 Return Planning Record for Revision — Gate P2 Return

**Roles permitted:** QA only

**Process:**
1. QA Reviewer identifies issues with the planning record.
2. QA Reviewer enters return comments (required).
3. QA Reviewer clicks "Return for Revision."
4. System creates a `GateDecision` record:  
   - `gate_type = P2`, `status = returned`, `approver_id`, `decided_at = now()`, `rationale`
5. System sets `planning_record.status = returned`.
6. Return comments are visible to the EM on the planning record page.
7. System writes audit event `GATE_P2_RETURNED`.

**Process after return:**
- EM edits the planning record to address the QA comments.
- EM re-submits: `planning_record.status → ready_for_review`.
- QA Reviewer reviews again and can approve or return again.
- Multiple return/re-submit cycles are allowed; each creates a new `GateDecision` record.

**Inputs:**
- `planning_record_id` (UUID, required)
- `rationale` (string, required, min 10 chars): return comments

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Planning record not in `ready_for_review` | 409 | `GATE_PREREQUISITE_FAILED` | "Planning record must be in Ready for Review status to return." |
| Return comment missing | 422 | `VALIDATION_ERROR` | "Return comment is required." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only a QA Reviewer may return Gate P2." |

---

### F07.4 P2 Gate Decision Visibility

- The current P2 status is shown on the Engagement Shell gate status card (see F04.3).
- Full gate decision history (all decisions for P2) is accessible from the Engagement Shell gate history view.
- The locked planning baseline is viewable in read-only mode by all engagement team members after P2 approval.
- The P2 approval timestamp and approver are shown on the planning record page.

---

**API Surface (F07):** see `Y1-api.md` §Gates (P2 endpoints).  
**Schema Surface (F07):** uses tables `gate_decisions`, `planning_records`, `engagements` — see `Y0-schema.md` §Gates and §Planning.
---

## F08: Evidence Registry

**Description:** The Evidence Registry allows Analysts to create evidence records and upload supporting files for an engagement. Each evidence item captures provenance metadata (type, source, date received, custodian, description) and a sensitivity flag. Evidence items form the traceable foundation that findings, indexing, and reference checks rely on. One or more files may be attached to a single evidence item.

**Terminology:**
- **Evidence Item:** The metadata record for a single piece of evidence (document, dataset, interview note, etc.).
- **Evidence File:** One or more uploaded files attached to an evidence item; stored in file storage.
- **Custodian:** The person, office, or system that provided or holds the original evidence.
- **Restricted Evidence:** Evidence with `sensitivity = restricted`; viewable only by authorized roles on the engagement.
- **Standard Evidence:** Evidence with `sensitivity = standard`; viewable by all roles assigned to the engagement.

**Sub-features:**
- F08.1 — Create evidence record
- F08.2 — Upload evidence files
- F08.3 — Edit evidence record
- F08.4 — View evidence list
- F08.5 — Download evidence files
- F08.6 — Delete evidence record

---

### F08.1 Create Evidence Record

**Roles permitted:** AN, AD

**Process:**
1. AN navigates to `/engagements/{id}/evidence` and clicks "Add Evidence."
2. AN fills in required and optional metadata fields.
3. AN clicks "Save."
4. System validates required fields.
5. System creates the evidence item record.
6. System writes audit event `EVIDENCE_ITEM_CREATED`.
7. System returns the created evidence item ID.

**Inputs:**
- `engagement_id` (UUID, required): from route
- `evidence_type` (enum, required): `document` | `dataset` | `interview_note` | `meeting_note` | `other`
- `source` (string ≤500, required): origin of the evidence
- `date_received` (date, required): YYYY-MM-DD
- `custodian` (string ≤255, optional): custodian or provider name
- `description` (text, optional): brief description, max 2000 characters
- `sensitivity` (enum, required, default `standard`): `standard` | `restricted`

**Validation:**
- `evidence_type` must be a valid enum value.
- `source` must be non-empty.
- `date_received` must be a valid date; future dates are accepted (evidence received in advance is permitted).
- `sensitivity` must be `standard` or `restricted`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Source empty | 422 | `VALIDATION_ERROR` | "Source is required." |
| Invalid date | 422 | `VALIDATION_ERROR` | "Date received must be a valid date (YYYY-MM-DD)." |
| Invalid evidence type | 422 | `VALIDATION_ERROR` | "Evidence type must be one of: document, dataset, interview_note, meeting_note, other." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Analysts may add evidence." |

---

### F08.2 Upload Evidence Files

**Roles permitted:** AN, AD (while evidence item exists)

**Process:**
1. AN uses the file picker on the evidence item detail page.
2. AN selects one or more files.
3. For each file, system validates file type and size.
4. System stores each file in file storage under path `evidence/{engagement_id}/{evidence_id}/{filename}`.
5. System creates an `EvidenceFile` record per file with storage reference and original filename.
6. System writes audit event `EVIDENCE_FILE_UPLOADED` for each file.

**File Constraints:**
- **Allowed types:** PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG, JPEG, ZIP
- **Maximum file size per file:** 50 MB
- **Maximum files per evidence item:** 20

**Validation:**
- Each file must pass type and size checks before storage.
- File must be associated with an existing, non-deleted evidence item.
- Restricted evidence files follow the same upload rules but are access-controlled (see F08.5).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| File type not allowed | 422 | `FILE_TYPE_NOT_ALLOWED` | "File type not permitted. Allowed: PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, PNG, JPG, JPEG, ZIP." |
| File exceeds 50 MB | 422 | `FILE_TOO_LARGE` | "File exceeds maximum size of 50 MB." |
| Max files exceeded | 422 | `FILE_LIMIT_EXCEEDED` | "Maximum of 20 files per evidence item." |
| Storage error | 503 | `STORAGE_ERROR` | "File could not be saved. Please try again." |

---

### F08.3 Edit Evidence Record

**Roles permitted:** AN, AD

**Process:**
1. AN opens the evidence item and clicks Edit.
2. AN modifies metadata fields (files can be added or replaced; existing files cannot be renamed).
3. AN saves changes.
4. System validates and updates the record.
5. System writes audit event `EVIDENCE_ITEM_UPDATED`.

**Validation:**
- All fields follow the same validation rules as creation (F08.1).
- `sensitivity` may be changed from `standard` to `restricted` or vice versa; a change to `restricted` writes audit event `EVIDENCE_RESTRICTED`.

---

### F08.4 View Evidence List

**Roles permitted:** All roles assigned to engagement; AD

**Access control:**
- Evidence items with `sensitivity = standard`: visible to all engagement team members.
- Evidence items with `sensitivity = restricted`: visible only to AN, EM, QA, IR, PC, AD assigned to this engagement. AL and RO cannot see restricted evidence items or their files.

**Displayed columns:** Evidence ID (short), evidence type, source, date received, sensitivity badge, linked objectives (count), uploaded files (count), uploaded by, created date.

**Filters:** evidence type, sensitivity, date range, linked/unlinked status.

---

### F08.5 Download Evidence Files

**Roles permitted:**
- Standard evidence files: all roles assigned to engagement; AD
- Restricted evidence files: AN, EM, QA, IR, PC, AD assigned to this engagement only

**Process:**
1. User clicks a file link on the evidence item detail page.
2. System checks the user's role and engagement assignment.
3. System checks `sensitivity` of the parent evidence item.
4. If authorized: system generates a signed or session-authenticated download URL and returns the file.
5. System writes audit event `EVIDENCE_FILE_DOWNLOADED`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Unauthorized access to restricted file | 403 | `RESTRICTED_ACCESS_DENIED` | "You are not authorized to download restricted evidence files." |
| File not found in storage | 404 | `FILE_NOT_FOUND` | "File not found." |

---

### F08.6 Delete Evidence Record

**Roles permitted:** AN, AD

**Process:**
1. AN clicks Delete on an evidence item.
2. System checks that the evidence item has no objective links, finding links, or reference check links.
3. If linked: block deletion and display blocker message.
4. If not linked: soft-delete the evidence item and associated file records (set `deleted_at`).
5. System writes audit event `EVIDENCE_ITEM_DELETED`.
6. Physical files are not immediately deleted; scheduled cleanup handles orphan removal.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence linked to objectives or findings | 409 | `EVIDENCE_LINKED` | "Cannot delete evidence item — it is linked to objectives or findings. Unlink first." |

---

**API Surface (F08):** see `Y1-api.md` §Evidence.  
**Schema Surface (F08):** uses tables `evidence_items`, `evidence_files` — see `Y0-schema.md` §Evidence.
---

## F09: Evidence-to-Objective Link

**Description:** Evidence-to-Objective Link allows users to associate evidence items with one or more planning objectives, establishing the traceability chain from objectives through evidence. Users can view which objectives have linked evidence and identify gaps (objectives with no evidence). A gap view highlights objectives still marked `evidence_needed`. The evidence registry can be exported to CSV.

**Terminology:**
- **Objective-Evidence Link:** The many-to-many association between an evidence item and an objective.
- **Gap View:** A filtered display showing objectives that have no linked evidence items; these are blockers for Gate P3.
- **Evidence Gap:** An objective with zero linked evidence items, or an objective whose status is still `evidence_needed`.

**Sub-features:**
- F09.1 — Link evidence to objectives
- F09.2 — Unlink evidence from objectives
- F09.3 — View linked evidence per objective
- F09.4 — Gap view (objectives without evidence)
- F09.5 — Export evidence registry to CSV

---

### F09.1 Link Evidence to Objectives

**Roles permitted:** AN, EM, AD

**Process:**
1. AN navigates to the evidence item detail page or the objectives page.
2. AN selects one or more objectives to link to the evidence item.
3. System validates that each selected objective belongs to the same engagement.
4. System creates an `ObjectiveEvidenceLink` record for each pairing.
5. System writes audit event `EVIDENCE_OBJECTIVE_LINKED` for each new link.

**Inputs:**
- `evidence_item_id` (UUID, required)
- `objective_ids` (array of UUIDs, required, min 1)

**Validation:**
- Evidence item must belong to the same engagement as the selected objectives.
- A link between a specific evidence item and objective may not be duplicated.
- Evidence item must not be deleted.
- Objective must not be deleted.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence item not in same engagement | 422 | `CROSS_ENGAGEMENT_LINK` | "Evidence item does not belong to this engagement." |
| Duplicate link | 409 | `LINK_DUPLICATE` | "This evidence item is already linked to this objective." |
| Objective not found | 404 | `NOT_FOUND` | "Objective not found." |
| Unauthorized | 403 | `FORBIDDEN` | "You do not have permission to link evidence." |

---

### F09.2 Unlink Evidence from Objectives

**Roles permitted:** AN, EM, AD

**Process:**
1. User navigates to the objective or evidence item detail and clicks "Remove Link."
2. System checks that removing the link will not leave a finding with zero evidence links (see F10 Finding rules).
3. System deletes the `ObjectiveEvidenceLink` record.
4. System writes audit event `EVIDENCE_OBJECTIVE_UNLINKED`.

**Validation:**
- Cannot unlink if the evidence item is the only linked evidence for a finding that has `status ≠ draft` (protecting findings already under review).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Would leave finding with no evidence | 409 | `FINDING_EVIDENCE_REQUIRED` | "Cannot unlink — this evidence is the only link for a finding that is under review or accepted." |

---

### F09.3 View Linked Evidence Per Objective

**Roles permitted:** All roles assigned to engagement; AD

**Display:**
- For each objective in the planning record, show the list of linked evidence items.
- For each linked evidence item, display: evidence ID (short), type, source, date received, sensitivity badge.
- Access control: Restricted evidence items follow the same access rules as F08.4.

**Evidence item columns in objective view:**
- Evidence ID
- Evidence type
- Source
- Date received
- Sensitivity (`Standard` or `Restricted`)
- Linked findings count

---

### F09.4 Gap View (Objectives Without Evidence)

**Roles permitted:** All roles assigned to engagement; AD

**Process:**
1. User navigates to `/engagements/{id}/evidence/gaps` or uses the "Show Gaps" toggle on the objectives page.
2. System queries objectives where no `ObjectiveEvidenceLink` exists.
3. System displays objectives with zero linked evidence items and their current status.

**Displayed columns:**
- Objective text (truncated at 100 chars)
- Objective status (Evidence Needed / In Review / Sufficient)
- Number of linked evidence items (0 shown as badge "No Evidence")
- Days until evidence readiness milestone (if set)

**Business rule:** Any objective shown in the gap view with `status = evidence_needed` is a P3 blocker (see F10).

---

### F09.5 Export Evidence Registry to CSV

**Roles permitted:** AL, EM, AN, QA, PC, RO, AD

**Process:**
1. User navigates to the evidence page and clicks "Export to CSV."
2. System collects all non-deleted evidence items for the engagement.
3. System applies access control: Restricted items are excluded for AL and RO users.
4. System generates a CSV file.
5. System writes audit event `EVIDENCE_CSV_EXPORTED`.

**CSV columns:**
`Evidence ID, Evidence Type, Source, Date Received, Custodian, Description, Sensitivity, Linked Objectives, Files Attached, Uploaded By, Created Date`

**Validation:**
- Export is scoped to the current engagement only.
- IR users are not included in the export permission (they perform reference checks, not evidence management).

---

**API Surface (F09):** see `Y1-api.md` §Evidence (link endpoints and export).  
**Schema Surface (F09):** uses tables `objective_evidence_links`, `evidence_items`, `objectives` — see `Y0-schema.md` §Evidence.
---

## F10: Findings and Sufficiency — Gate P3

**Description:** Gate P3 is the evidence readiness checkpoint. Analysts create finding records and link them to evidence items. QA Reviewers assess each objective's evidence status and mark them as Evidence Needed, In Review, or Sufficient. Gate P3 can only be approved when no objective has an evidence gap and no objective remains marked Evidence Needed. P3 approval records the QA Reviewer as approver and advances the engagement phase to `draft`.

**Terminology:**
- **Finding:** A draft conclusion or observation record linked to one or more evidence items.
- **Objective Status:** The current evidence readiness state for an objective: `evidence_needed`, `in_review`, or `sufficient`.
- **Evidence Gap:** An objective with zero linked evidence items.
- **P3 Approval:** The gate outcome confirming evidence is sufficient for all objectives; advances engagement to draft phase.

**Sub-features:**
- F10.1 — Create finding record
- F10.2 — Link finding to evidence items
- F10.3 — Update objective evidence status
- F10.4 — Approve evidence sufficiency (Gate P3 pass)
- F10.5 — P3 gate decision visibility

---

### F10.1 Create Finding Record

**Roles permitted:** AN, AD

**Process:**
1. AN navigates to `/engagements/{id}/findings` and clicks "Add Finding."
2. AN enters finding text (required).
3. AN saves the finding.
4. System creates the finding record with `status = draft`.
5. System writes audit event `FINDING_CREATED`.

**Inputs:**
- `engagement_id` (UUID, required): from route
- `finding_text` (text, required): full draft finding text

**Validation:**
- `finding_text` must be non-empty.
- The engagement must be in `phase = evidence` or later.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Finding text empty | 422 | `VALIDATION_ERROR` | "Finding text is required." |
| Wrong phase | 409 | `PHASE_PREREQUISITE_FAILED` | "Findings can only be created after planning has been approved (P2)." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Analysts may create findings." |

---

### F10.2 Link Finding to Evidence Items

**Roles permitted:** AN, AD

**Process:**
1. AN opens the finding detail page.
2. AN selects one or more evidence items to link to the finding.
3. System validates that evidence items belong to the same engagement.
4. System creates `FindingEvidenceLink` records.
5. System writes audit event `FINDING_EVIDENCE_LINKED`.

**Inputs:**
- `finding_id` (UUID, required)
- `evidence_item_ids` (array of UUIDs, required, min 1)

**Validation:**
- Each evidence item must belong to the same engagement as the finding.
- A finding may not duplicate the same evidence link.
- A finding must have at least one linked evidence item before Gate P3 can pass.

**Business Rule:** Each finding must link to at least one evidence item before final readiness (P3 prerequisite).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence item from different engagement | 422 | `CROSS_ENGAGEMENT_LINK` | "Evidence item does not belong to this engagement." |
| Duplicate link | 409 | `LINK_DUPLICATE` | "This evidence item is already linked to this finding." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Analysts may link findings to evidence." |

---

### F10.3 Update Objective Evidence Status

**Roles permitted:** QA, EM, AD

**Process:**
1. QA Reviewer navigates to the objectives page for the engagement.
2. QA Reviewer reviews the linked evidence for each objective.
3. QA Reviewer updates the `status` field for each objective.
4. System validates the status transition.
5. System saves the update and writes audit event `OBJECTIVE_STATUS_UPDATED`.

**Allowed status values:**
- `evidence_needed` — No sufficient evidence yet; this is a P3 blocker.
- `in_review` — Evidence has been submitted and is under review.
- `sufficient` — QA confirms evidence is sufficient for this objective.

**Status transition rules:**
- `evidence_needed` → `in_review`: allowed when at least one evidence item is linked.
- `in_review` → `sufficient`: allowed when QA is satisfied with the linked evidence.
- `sufficient` → `in_review` or `evidence_needed`: allowed (regression permitted if new concerns arise).

**Validation:**
- Cannot mark an objective `in_review` if it has zero linked evidence items.
- Cannot mark an objective `sufficient` if it has zero linked evidence items.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Mark `in_review` with no evidence | 422 | `EVIDENCE_REQUIRED` | "Cannot set status to In Review — no evidence is linked to this objective." |
| Mark `sufficient` with no evidence | 422 | `EVIDENCE_REQUIRED` | "Cannot set status to Sufficient — no evidence is linked to this objective." |
| Invalid status value | 422 | `VALIDATION_ERROR` | "Status must be one of: evidence_needed, in_review, sufficient." |

---

### F10.4 Approve Evidence Sufficiency — Gate P3 Pass

**Roles permitted:** QA only

**Process:**
1. QA Reviewer navigates to the P3 gate review or the Review Queue.
2. System displays the P3 prerequisite checklist.
3. QA Reviewer enters approval comment (required).
4. QA Reviewer clicks "Approve P3."
5. System validates all P3 prerequisites server-side.
6. System creates a `GateDecision` record:  
   - `gate_type = P3`, `status = approved`, `approver_id`, `decided_at = now()`, `rationale`
7. System advances `engagement.phase = draft`.
8. System writes audit event `GATE_P3_APPROVED`.

**Prerequisite Validation Rules (all must pass server-side):**
- Gate P2 must have status `approved` (i.e., a `GateDecision` with `gate_type = P2`, `status = approved` must exist for this engagement).
- Count of objectives with `status = evidence_needed` must be **zero**.
- Count of objectives with zero linked evidence items must be **zero** (no objective may have no evidence).
- Count of findings with zero linked evidence items must be **zero** (every finding must have at least one evidence link).
- `rationale` must be non-null and non-empty (minimum 10 characters).

**Inputs:**
- `engagement_id` (UUID, required): from route
- `rationale` (string, required, min 10 chars)

**Outputs:**
- `GateDecision` record (`gate_type = P3`, `status = approved`)
- `engagement.phase = draft`
- Audit event `GATE_P3_APPROVED`

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| P2 not approved | 409 | `GATE_PREREQUISITE_FAILED` | "Gate P2 must be approved before P3 can pass." |
| Objective(s) with `evidence_needed` status | 409 | `GATE_PREREQUISITE_FAILED` | "One or more objectives are still marked Evidence Needed." |
| Objective(s) with no linked evidence | 409 | `GATE_PREREQUISITE_FAILED` | "One or more objectives have no linked evidence items." |
| Finding(s) with no evidence link | 409 | `GATE_PREREQUISITE_FAILED` | "One or more findings have no linked evidence items." |
| Rationale missing | 422 | `VALIDATION_ERROR` | "Approval comment is required." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only a QA Reviewer may approve Gate P3." |

---

### F10.5 P3 Gate Decision Visibility

- The P3 gate decision is visible on the Engagement Shell gate status card.
- The P3 approval timestamp and approver are shown on the findings/objectives page.
- All P3 gate decisions (including any past returns or re-approvals) are in the full gate history.
- After P3 approval, objective statuses are frozen (no further changes without a revision note).

---

**API Surface (F10):** see `Y1-api.md` §Findings and §Gates (P3 endpoints).  
**Schema Surface (F10):** uses tables `findings`, `finding_evidence_links`, `objectives`, `gate_decisions` — see `Y0-schema.md` §Findings and §Gates.
---

## F11: Draft Product Record

**Description:** The Draft Product Record is a simple record tied to an engagement that tracks the working draft product through review stages before reference check and final readiness. It captures draft title, version, owner, status, attached file or notes, and reviewer comments. The draft product bridges findings work (P3) and the reference check + final readiness (P4) workflow.

**Terminology:**
- **Draft Product:** The primary work product of the engagement in working form, not yet through reference check or final review.
- **Draft Status:** Current stage of the draft: `drafting`, `under_review`, `ready_for_reference_check`, or `ready_for_final_review`.
- **Draft File:** An attached file (e.g., a report draft document) uploaded to the draft product record.
- **Review Comments:** Inline or block comments recorded by the reviewer during the Under Review stage.

**Sub-features:**
- F11.1 — Create draft product record
- F11.2 — Edit draft product record
- F11.3 — Attach draft file
- F11.4 — Record review comments
- F11.5 — Advance draft status

---

### F11.1 Create Draft Product Record

**Roles permitted:** EM, AN, AD

**Process:**
1. EM navigates to `/engagements/{id}/draft` and clicks "Create Draft Product."
2. EM fills in required fields.
3. EM saves the record.
4. System creates the draft product with `status = drafting`.
5. System writes audit event `DRAFT_PRODUCT_CREATED`.

**Inputs:**
- `engagement_id` (UUID, required): from route
- `title` (string ≤500, required): draft product title
- `version` (string ≤50, required): version label, e.g. `v1.0`
- `owner_id` (UUID, required): user responsible for the draft

**Validation:**
- Only one draft product record per engagement.
- `title` must be non-empty.
- `version` must be non-empty.
- `owner_id` must reference an active user assigned to the engagement.
- The engagement must be in `phase = draft` or later for the draft product to be created (i.e., P3 must have been approved or the engagement has been manually advanced to draft phase by EM).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Draft product already exists | 409 | `DRAFT_EXISTS` | "A draft product record already exists for this engagement." |
| Title empty | 422 | `VALIDATION_ERROR` | "Title is required." |
| Version empty | 422 | `VALIDATION_ERROR` | "Version is required." |
| Invalid owner | 422 | `VALIDATION_ERROR` | "Owner must be an active user assigned to this engagement." |
| Wrong phase | 409 | `PHASE_PREREQUISITE_FAILED` | "Draft product can only be created after Gate P3 has been approved." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Engagement Managers or Analysts may create a draft product." |

---

### F11.2 Edit Draft Product Record

**Roles permitted:** EM, AN, AD

**Process:**
1. User opens the draft product page and clicks Edit.
2. User modifies allowed fields.
3. User saves changes.
4. System validates and updates the record.
5. System writes audit event `DRAFT_PRODUCT_UPDATED`.

**Editable fields:**
- `title` (required)
- `version` (required)
- `owner_id` (required)
- `review_comments` (optional): updated by EM or AN

**Non-editable after status transition to `ready_for_final_review`:**
- No fields are locked, but a revision note is recommended (UX advisory only; not a hard block in this feature).

---

### F11.3 Attach Draft File

**Roles permitted:** EM, AN, AD

**Process:**
1. User clicks "Attach File" on the draft product page.
2. User selects a file.
3. System validates file type and size.
4. System stores the file in file storage under path `draft/{engagement_id}/{draft_id}/{filename}`.
5. System updates `draft_product.file_ref` and `draft_product.file_name`.
6. Only one file is attached per draft product record at a time; uploading a new file replaces the previous one.
7. System writes audit event `DRAFT_FILE_ATTACHED`.

**File Constraints:**
- **Allowed types:** PDF, DOCX, DOC, XLSX, XLS, TXT, ZIP
- **Maximum file size:** 50 MB
- **One file per draft product record** (replacement is allowed)

**Downloading the draft file:**
- Permitted for all roles assigned to the engagement and AD.
- System writes audit event `DRAFT_FILE_DOWNLOADED`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| File type not allowed | 422 | `FILE_TYPE_NOT_ALLOWED` | "File type not permitted. Allowed: PDF, DOCX, DOC, XLSX, XLS, TXT, ZIP." |
| File exceeds 50 MB | 422 | `FILE_TOO_LARGE` | "File exceeds maximum size of 50 MB." |
| Storage error | 503 | `STORAGE_ERROR` | "File could not be saved. Please try again." |

---

### F11.4 Record Review Comments

**Roles permitted:** EM, QA, AN, AD

**Process:**
1. Reviewer opens the draft product page.
2. Reviewer enters comments in the `review_comments` field.
3. Reviewer saves.
4. System appends timestamp and reviewer name to the comment block (comment history is maintained as append-only text or structured comment list).
5. System writes audit event `DRAFT_COMMENT_ADDED`.

**Validation:**
- Review comments must be non-empty when saved.
- Comments are not editable after save (append-only to preserve review history).

---

### F11.5 Advance Draft Status

**Roles permitted:** EM, AD (for status transitions); QA (for returning to `drafting`)

**Allowed status transitions:**

| From | To | Triggered by |
|---|---|---|
| `drafting` | `under_review` | EM manually advances |
| `under_review` | `ready_for_reference_check` | EM after review complete |
| `under_review` | `drafting` | QA returns with comments |
| `ready_for_reference_check` | `ready_for_final_review` | EM after reference checks complete |
| `ready_for_final_review` | `under_review` | EM if final review identifies issues |

**Process:**
1. EM selects the target status from the status dropdown or advancement button.
2. System validates the status transition is allowed.
3. System updates `draft_product.status`.
4. System writes audit event `DRAFT_STATUS_CHANGED`.

**Validation:**
- Only the transitions listed above are permitted; all others return a 409.
- Advancing to `ready_for_reference_check` requires that at least one draft statement record exists (see F12).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Invalid status transition | 409 | `INVALID_STATUS_TRANSITION` | "Status cannot transition from {from} to {to}." |
| Advancing to reference check with no statements | 409 | `PHASE_PREREQUISITE_FAILED` | "At least one draft statement must be indexed before advancing to reference check." |

---

**API Surface (F11):** see `Y1-api.md` §Draft.  
**Schema Surface (F11):** uses table `draft_products` — see `Y0-schema.md` §Draft.
---

## F12: Basic Indexing and Reference Check

**Description:** Basic Indexing and Reference Check allows Analysts to create draft statement records for the draft product and link each statement to supporting evidence items (indexing). Independent Referencers then verify each indexed statement against the linked evidence and mark reference status. Failed reference checks are assigned back to Analysts for correction. All reference checks must be Passed or explicitly Waived before Gate P4 can proceed.

**Terminology:**
- **Draft Statement:** A single claim, finding, or assertion in the draft product that requires evidence support; the unit of indexing.
- **Indexing:** The act of linking a draft statement to one or more evidence items.
- **Reference Check:** The Independent Referencer's review confirming whether the statement is supported by the linked evidence.
- **Reference Status:** Current state of the reference check for a statement: `not_started`, `in_review`, `passed`, `failed`, `waived`.
- **Discrepancy:** A noted inconsistency between the statement and the linked evidence, recorded when status is `failed`.
- **Waived:** A reference check explicitly skipped with a recorded justification (only permitted by EM or AD).

**Sub-features:**
- F12.1 — Create draft statement (index)
- F12.2 — Link statement to evidence items
- F12.3 — Assign reference check to Independent Referencer
- F12.4 — Perform reference check
- F12.5 — Record discrepancy and assign back to Analyst
- F12.6 — Waive reference check
- F12.7 — View reference check progress

---

### F12.1 Create Draft Statement (Index)

**Roles permitted:** AN, EM, AD

**Process:**
1. AN navigates to `/engagements/{id}/draft/statements` and clicks "Add Statement."
2. AN enters statement text (required).
3. AN saves the statement.
4. System creates the statement record with `reference_status = not_started`.
5. System writes audit event `STATEMENT_CREATED`.

**Inputs:**
- `draft_product_id` (UUID, required): from route
- `statement_text` (text, required): the full text of the draft statement
- `sort_order` (integer, optional): display order within the draft product

**Validation:**
- `statement_text` must be non-empty.
- The draft product must exist for this engagement.
- Statements may be created while draft product status is `drafting`, `under_review`, or `ready_for_reference_check`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Statement text empty | 422 | `VALIDATION_ERROR` | "Statement text is required." |
| Draft product not found | 404 | `NOT_FOUND` | "Draft product not found for this engagement." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Analysts or Engagement Managers may create draft statements." |

---

### F12.2 Link Statement to Evidence Items

**Roles permitted:** AN, EM, AD

**Process:**
1. AN selects one or more evidence items to link to the statement.
2. System validates evidence items belong to the same engagement.
3. System creates `StatementEvidenceLink` records.
4. System writes audit event `STATEMENT_EVIDENCE_LINKED`.

**Inputs:**
- `statement_id` (UUID, required)
- `evidence_item_ids` (array of UUIDs, required, min 1)

**Validation:**
- Each evidence item must belong to the same engagement.
- A statement may not duplicate the same evidence link.
- A statement must have at least one evidence link before its reference check can begin.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence from different engagement | 422 | `CROSS_ENGAGEMENT_LINK` | "Evidence item does not belong to this engagement." |
| Duplicate link | 409 | `LINK_DUPLICATE` | "This evidence item is already linked to this statement." |

---

### F12.3 Assign Reference Check to Independent Referencer

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to the statement list and selects statements to assign.
2. EM selects an IR user from the engagement team.
3. System updates `statement.assigned_to_ir = user_id`, sets `reference_status = not_started` (if not already).
4. System writes audit event `REFERENCE_CHECK_ASSIGNED`.

**Validation:**
- The assigned user must have role `IR` and be assigned to this engagement.
- Statements without evidence links cannot be assigned for reference check.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Assigned user not IR | 422 | `VALIDATION_ERROR` | "Assigned user must have the Independent Referencer role." |
| Statement has no evidence links | 422 | `REFERENCE_CHECK_PREREQ` | "Statement must be linked to at least one evidence item before reference check can begin." |

---

### F12.4 Perform Reference Check

**Roles permitted:** IR only

**Process:**
1. IR navigates to the Review Queue and selects assigned statements.
2. IR opens a statement, reviews the linked evidence, and assesses whether the statement is supported.
3. IR sets the `reference_status`:
   - `passed`: statement is supported by the linked evidence.
   - `failed`: statement is not adequately supported; IR records discrepancy notes.
   - `in_review`: IR has started review but has not yet completed the assessment.
4. System saves the status change.
5. System writes audit event `REFERENCE_STATUS_CHANGED`.

**Inputs:**
- `statement_id` (UUID, required)
- `reference_status` (enum, required): `in_review` | `passed` | `failed`
- `discrepancy_notes` (text, required if `reference_status = failed`): description of the issue

**Validation:**
- Only IR may set reference status.
- `discrepancy_notes` is required when `reference_status = failed`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Discrepancy notes missing when failed | 422 | `VALIDATION_ERROR` | "Discrepancy notes are required when reference status is Failed." |
| Unauthorized | 403 | `FORBIDDEN` | "Only an Independent Referencer may perform reference checks." |

---

### F12.5 Record Discrepancy and Assign Back to Analyst

**Roles permitted:** IR (record discrepancy), EM or AN (address discrepancy)

**Process (IR side):**
1. IR marks statement as `failed` with discrepancy notes (see F12.4).
2. System updates `reference_status = failed`.
3. System optionally sets `assigned_to_analyst = analyst_user_id` for correction routing.
4. System writes audit event `REFERENCE_FAILED_DISCREPANCY`.

**Process (Analyst side):**
1. AN sees failed reference checks in their queue.
2. AN updates the draft statement text or its evidence links to address the discrepancy.
3. AN changes the statement status to indicate revision is ready (sets `revision_ready = true`).
4. IR is notified (via Review Queue) that the statement is ready for re-check.
5. IR re-performs the reference check (F12.4).

---

### F12.6 Waive Reference Check

**Roles permitted:** EM, AD only

**Process:**
1. EM identifies a statement where reference check will not be performed (e.g., well-established fact requiring no citation).
2. EM clicks "Waive Reference Check" and enters a waiver justification (required).
3. System sets `reference_status = waived`, records `waived_by`, `waived_at`, `waiver_justification`.
4. System writes audit event `REFERENCE_CHECK_WAIVED`.

**Inputs:**
- `statement_id` (UUID, required)
- `waiver_justification` (string, required, min 10 chars)

**Validation:**
- Only EM or AD may waive.
- Waiver justification must be non-empty (minimum 10 characters).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Waiver justification missing | 422 | `VALIDATION_ERROR` | "Waiver justification is required." |
| Unauthorized | 403 | `FORBIDDEN` | "Only an Engagement Manager may waive a reference check." |

---

### F12.7 View Reference Check Progress

**Roles permitted:** All roles assigned to engagement; AD

**Displayed information:**
- Total statement count
- Counts by status: Not Started, In Review, Passed, Failed, Waived
- Percentage of statements Passed or Waived (completion percentage)
- List of statements with current status, assigned IR (if any), and last updated timestamp

**Business Rule:** Gate P4 (F13) uses this view's data to enforce its prerequisite check.

---

**API Surface (F12):** see `Y1-api.md` §Statements.  
**Schema Surface (F12):** uses tables `draft_statements`, `statement_evidence_links` — see `Y0-schema.md` §Statements.
---

## F13: Final Readiness — Gate P4

**Description:** Gate P4 is the terminal governance checkpoint. It confirms that all reference checks are complete (Passed or Waived), no open blockers remain, and the final review has been completed. On approval, the engagement status transitions to `ready_for_issuance`. An optional close path sets the engagement to `closed`. All P4 decisions create an immutable audit event.

**Terminology:**
- **Final Readiness Checklist:** The computed list of P4 prerequisites displayed to the approver before they can submit the gate decision.
- **Ready for Issuance:** The engagement status after P4 approval, indicating the draft product is approved for issuance.
- **Closed:** An engagement status indicating the engagement was terminated or concluded without issuance.
- **Open Blocker:** Any unresolved prerequisite condition that prevents P4 from passing.

**Sub-features:**
- F13.1 — Display final readiness checklist
- F13.2 — Approve final readiness (Gate P4 pass)
- F13.3 — Close engagement without issuance
- F13.4 — P4 gate decision visibility

---

### F13.1 Display Final Readiness Checklist

**Roles permitted:** EM, PC, QA, AD (view); EM, PC, AD (initiate approval)

**Process:**
1. EM or PC navigates to `/engagements/{id}/gates/p4`.
2. System computes and displays the P4 prerequisite checklist with pass/fail indicators for each item.

**P4 Prerequisite Checklist (all must be ✓ before approval is enabled):**

| # | Check | Pass Condition |
|---|---|---|
| 1 | Gate P3 approved | A `GateDecision` with `gate_type = P3`, `status = approved` exists for this engagement |
| 2 | No reference checks `failed` | Count of `draft_statements` with `reference_status = failed` = 0 |
| 3 | No reference checks `in_review` | Count of `draft_statements` with `reference_status = in_review` = 0 |
| 4 | No reference checks `not_started` (unwaived) | Count of `draft_statements` with `reference_status = not_started` = 0 |
| 5 | No open blockers | All blocker conditions in F04.4 are cleared |

**Display behavior:**
- Each checklist item shows a green ✓ (pass) or red ✗ (fail) indicator.
- For each failing item, a brief explanation and a link to the affected records is shown.
- The "Approve P4" button is disabled until all items are ✓.

---

### F13.2 Approve Final Readiness — Gate P4 Pass

**Roles permitted:** EM, PC, AD

**Process:**
1. Approver confirms the P4 checklist is fully satisfied (all items ✓).
2. Approver enters final approval comment (required).
3. Approver selects outcome: "Ready for Issuance" or "Closed" (EM/AD only; PC always approves as Ready for Issuance).
4. Approver clicks "Approve P4."
5. System validates all P4 prerequisites server-side.
6. System creates a `GateDecision` record:  
   - `gate_type = P4`, `status = approved`, `approver_id`, `decided_at = now()`, `rationale`
7. System updates `engagement.status`:
   - If outcome = "Ready for Issuance": `status = ready_for_issuance`
   - If outcome = "Closed": `status = closed`
8. System updates `engagement.phase = readiness` (terminal phase for issuance path) or `phase = closed` (for closed path).
9. System writes audit event `GATE_P4_APPROVED`.

**Prerequisite Validation Rules (server-side, all must pass):**
- A `GateDecision` with `gate_type = P3`, `status = approved` must exist for this engagement.
- Count of `draft_statements` with `reference_status = failed` must be **zero**.
- Count of `draft_statements` with `reference_status = in_review` must be **zero**.
- Count of `draft_statements` with `reference_status = not_started` must be **zero**.
- No open blocker conditions exist (see F04.4 blocker computation).
- `rationale` must be non-null and non-empty (minimum 10 characters).

**Inputs:**
- `engagement_id` (UUID, required): from route
- `rationale` (string, required, min 10 chars): final approval comment
- `outcome` (enum, required): `ready_for_issuance` | `closed`

**Outputs:**
- `GateDecision` record (`gate_type = P4`, `status = approved`)
- `engagement.status` updated to `ready_for_issuance` or `closed`
- `engagement.phase` updated
- Audit event `GATE_P4_APPROVED`

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| P3 not approved | 409 | `GATE_PREREQUISITE_FAILED` | "Gate P3 must be approved before P4 can pass." |
| Reference checks still `failed` | 409 | `GATE_PREREQUISITE_FAILED` | "All reference checks must be Passed or Waived. {n} check(s) have Failed status." |
| Reference checks still `in_review` | 409 | `GATE_PREREQUISITE_FAILED` | "All reference checks must be Passed or Waived. {n} check(s) are still In Review." |
| Reference checks still `not_started` | 409 | `GATE_PREREQUISITE_FAILED` | "All reference checks must be Passed or Waived. {n} check(s) have not been started." |
| Open blockers exist | 409 | `GATE_PREREQUISITE_FAILED` | "Open blockers must be resolved before P4 can pass." |
| Rationale missing | 422 | `VALIDATION_ERROR` | "Final approval comment is required." |
| Invalid outcome value | 422 | `VALIDATION_ERROR` | "Outcome must be one of: ready_for_issuance, closed." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only an Engagement Manager or Publishing Coordinator may approve Gate P4." |

---

### F13.3 Close Engagement Without Issuance

**Roles permitted:** EM, AD

**Process:**
1. EM selects "Closed" as the outcome during P4 approval (F13.2).
2. OR EM uses the "Close Engagement" action on the engagement shell (available when engagement has not reached `ready_for_issuance`).
3. System creates a `GateDecision` with `status = approved`, `outcome = closed`, records rationale.
4. System sets `engagement.status = closed` and `engagement.phase = closed`.
5. System writes audit event `ENGAGEMENT_CLOSED`.

**Note:** A closed engagement is read-only. No further edits, uploads, or gate approvals are permitted. All records and audit history remain visible.

---

### F13.4 P4 Gate Decision Visibility

- P4 gate decision is shown on the Engagement Shell gate status card.
- The final outcome (`ready_for_issuance` or `closed`) is displayed as the engagement status badge.
- The engagement register and portfolio dashboard reflect the updated status immediately.
- Gate P4 approval records are immutable and permanently visible in the audit trail.
- After P4 approval, the engagement enters a read-only state; no workflow changes can be initiated.

---

**API Surface (F13):** see `Y1-api.md` §Gates (P4 endpoints).  
**Schema Surface (F13):** uses tables `gate_decisions`, `engagements` — see `Y0-schema.md` §Gates and §Engagements.
---

## F14: Portfolio Dashboard

**Description:** The Portfolio Dashboard provides a high-level view of all requests and engagements across the organization. It shows counts by phase and status, supports filtering, and presents a sortable list view with key engagement attributes. The dashboard is the primary entry point for leads and stakeholders to assess portfolio health. The engagement register can be exported to CSV.

**Terminology:**
- **Portfolio Health:** A quick visual scan of engagements grouped by phase, risk level, and gate status.
- **Engagement Register:** The full list of engagements visible to the current user, exportable to CSV.
- **Count Cards:** Summary tiles at the top of the dashboard showing totals by phase, risk, and gate status.

**Sub-features:**
- F14.1 — Display summary count cards
- F14.2 — Filter engagement list
- F14.3 — Display engagement list view
- F14.4 — Export engagement register to CSV

---

### F14.1 Display Summary Count Cards

**Roles permitted:** All authenticated users

**Count cards displayed:**

| Card Label | Metric |
|---|---|
| Active Engagements | `engagement.status = active` |
| In Planning | `engagement.phase = planning` |
| In Evidence | `engagement.phase = evidence` |
| In Draft | `engagement.phase = draft` |
| Ready for Issuance | `engagement.status = ready_for_issuance` |
| Closed | `engagement.status = closed` |
| High Risk | `engagement.risk_level = high` |
| Pending Requests | `request.status = submitted` |

**Access control:** Each user sees only engagements they are authorized to view. AL and AD see all; other roles see only engagements they are assigned to (or all, if configured by Admin).

---

### F14.2 Filter Engagement List

**Roles permitted:** All authenticated users

**Available filters:**

| Filter | Field | Type |
|---|---|---|
| Owner | `engagement.owner_id` | Multi-select |
| Risk Level | `engagement.risk_level` | Multi-select: Low, Medium, High |
| Phase | `engagement.phase` | Multi-select |
| Status | `engagement.status` | Multi-select |
| Due Date | `request.due_date` | Date range picker |
| Gate Status | `gate_decisions.gate_type` + `status` | Composite filter |

**Filter behavior:**
- Filters are combinable (AND logic across filter types).
- Filters persist in URL query parameters for bookmarking.
- Clearing filters returns the unfiltered list.

---

### F14.3 Display Engagement List View

**Roles permitted:** All authenticated users

**Columns:**

| Column | Source |
|---|---|
| Engagement ID | `engagement.job_code` |
| Title | `engagement.title` |
| Phase | `engagement.phase` (display name) |
| Status | `engagement.status` (badge) |
| Owner | `engagement.owner.name` |
| Risk Level | `engagement.risk_level` (badge) |
| Next Milestone | Earliest incomplete milestone with target date |
| Gate Status | Latest outcome for each of A1, P2, P3, P4 |
| Due Date | `request.due_date` (from linked request, if any) |

**Sorting:** All columns are sortable (ascending/descending).  
**Pagination:** 25 rows per page by default; configurable to 50 or 100. Total count shown.  
**Row click:** Navigates to the Engagement Shell (`/engagements/{id}`).

**Validation:**
- The list must load within 3 seconds for ≤100 engagements.
- Only engagements the current user is authorized to see are included.

---

### F14.4 Export Engagement Register to CSV

**Roles permitted:** AL, EM, AN, QA, PC, RO, AD

**Process:**
1. User clicks "Export to CSV" on the portfolio dashboard.
2. System applies the current active filters.
3. System generates a CSV containing only engagements the user is authorized to see.
4. System writes audit event `ENGAGEMENT_REGISTER_EXPORTED`.

**CSV columns:**
`Engagement ID, Title, Phase, Status, Owner, Risk Level, Portfolio, Due Date, A1 Status, P2 Status, P3 Status, P4 Status, Planning Approval Date, Evidence Readiness Date, Final Readiness Date, Created Date`

**Validation:**
- Export is limited to the filtered view; if no filters are active, all visible engagements are exported.
- IR users do not have export permission for the engagement register (they are evidence/reference-focused).

---

**API Surface (F14):** see `Y1-api.md` §Dashboard.  
**Schema Surface (F14):** queries across `engagements`, `requests`, `gate_decisions`, `milestones` — see `Y0-schema.md`.
---

## F15: Engagement Detail Dashboard

**Description:** The Engagement Detail Dashboard is a consolidated single-page view of an engagement's current progress, gate status, milestone timeline, evidence and reference check metrics, and open blockers. It gives the Engagement Manager and team a real-time status picture without navigating through multiple pages.

**Terminology:**
- **Gate Status Card:** A compact UI element showing the current outcome for a specific gate (A1, P2, P3, P4).
- **Progress Metric:** A calculated number or percentage shown as a count or bar (e.g., evidence coverage, reference check completion).
- **Open Blockers Panel:** A highlighted section listing all current blockers that prevent the next gate from passing.

**Sub-features:**
- F15.1 — Phase and status summary
- F15.2 — Gate status cards
- F15.3 — Milestone timeline
- F15.4 — Evidence and objective progress
- F15.5 — Reference check completion
- F15.6 — Open blockers panel

---

### F15.1 Phase and Status Summary

**Roles permitted:** All roles assigned to engagement; AD

**Displayed:**
- Current phase (display name)
- Current status badge (Active / On Hold / Ready for Issuance / Closed)
- Owner name and role
- Risk level badge (Low / Medium / High)
- Job code
- Engagement title
- Due date (from linked request)
- Days until due (countdown, or "Overdue" if past)

---

### F15.2 Gate Status Cards

**Four cards, one per gate (A1, P2, P3, P4):**

| Field | Decided | Not Yet Decided |
|---|---|---|
| Gate label | A1 / P2 / P3 / P4 | Same |
| Status | Approved / Declined / Returned | Not Started |
| Approver name | Recorded approver | — |
| Decision date | ISO date | — |
| Prerequisite status | All ✓ / Issues present | — |

Each card links to the full gate history for that gate type.

---

### F15.3 Milestone Timeline

**Displayed as a list with four rows:**

| Milestone | Target Date | Status |
|---|---|---|
| Planning Approval (P2) | From `milestones.planning_approval_target` | Not Started / On Track / At Risk / Complete / Overdue |
| Evidence Readiness (P3) | From `milestones.evidence_readiness_target` | Same |
| Draft Readiness | From `milestones.draft_readiness_target` | Same |
| Final Readiness (P4) | From `milestones.final_readiness_target` | Same |

Status computation follows the rules defined in F05.4.

---

### F15.4 Evidence and Objective Progress

**Metrics displayed:**

| Metric | Calculation |
|---|---|
| Total evidence items | `COUNT(evidence_items)` for this engagement |
| Objectives with evidence | `COUNT(objectives WHERE linked_evidence_count > 0)` |
| Objectives without evidence | `COUNT(objectives WHERE linked_evidence_count = 0)` |
| Evidence sufficiency progress | `COUNT(objectives WHERE status = 'sufficient') / COUNT(objectives) * 100`% |

**Gap indicator:** If any objective has zero linked evidence, a warning badge is shown: "X objective(s) have no evidence."

---

### F15.5 Reference Check Completion

**Metrics displayed:**

| Metric | Calculation |
|---|---|
| Total statements | `COUNT(draft_statements)` |
| Passed | `COUNT(draft_statements WHERE reference_status = 'passed')` |
| Waived | `COUNT(draft_statements WHERE reference_status = 'waived')` |
| Failed | `COUNT(draft_statements WHERE reference_status = 'failed')` |
| In Review | `COUNT(draft_statements WHERE reference_status = 'in_review')` |
| Not Started | `COUNT(draft_statements WHERE reference_status = 'not_started')` |
| Completion % | `(Passed + Waived) / Total * 100`% |

A progress bar displays the completion percentage visually.

**If no draft product exists:** Section shows "Draft product not created yet."

---

### F15.6 Open Blockers Panel

**Computed list of all current blockers** (same logic as F04.4):

- Planning record not approved
- Any objective marked `evidence_needed`
- Any objective with zero linked evidence
- Any finding with zero evidence links
- Any reference check `failed` or `in_review`
- P3 not approved (when draft product exists)

**Display behavior:**
- If no blockers: show "✓ No open blockers" in green.
- If blockers exist: show each blocker as a labeled item with a link to the relevant record.
- Blockers panel is always visible (not collapsible) when blockers exist.

---

**Performance requirement:** The engagement detail dashboard must load all metrics within 3 seconds for a typical engagement with ≤500 evidence items and ≤100 statements.

**API Surface (F15):** see `Y1-api.md` §Dashboard (engagement detail endpoint).  
**Schema Surface (F15):** queries across multiple tables — see `Y0-schema.md`.
---

## F16: Persona and Journey Artifacts

**Description:** Persona and Journey Artifacts provides a maintained set of user persona definitions and primary journey maps within the system. These artifacts are used to validate requirement clarity, guide UX design, and generate acceptance test scenarios for the four governance gates. Each feature in the EMS is linked to at least one persona and one journey.

**Terminology:**
- **Persona:** A representative user archetype that captures the role, responsibilities, and goals of a target user type.
- **User Journey:** A named end-to-end workflow path from a starting condition to a defined outcome, mapped to one or more features.
- **Feature-Persona Mapping:** A record linking each feature (F0–F17) to the primary persona(s) who use it.
- **Acceptance Scenario:** A test case derived from a journey step and gate rule, used to validate correct system behavior.

**Sub-features:**
- F16.1 — Persona definitions
- F16.2 — Primary journey definitions
- F16.3 — Feature-to-persona mapping
- F16.4 — Journey-to-gate scenario mapping

---

### F16.1 Persona Definitions

The following personas are defined and maintained:

| Persona | Abbreviation | Primary Responsibilities |
|---|---|---|
| Engagement Acceptance Lead | AL | Reviews intake requests; decides A1 approval or decline |
| Engagement Manager | EM | Manages engagement after A1; sets up team, planning, milestones; submits for P2 and P4 |
| Analyst | AN | Uploads evidence; links evidence to objectives; creates findings; indexes draft statements |
| QA Reviewer | QA | Reviews planning completeness (P2); reviews evidence sufficiency (P3) |
| Independent Referencer | IR | Reviews indexed statements against evidence; records reference status |
| Publishing Coordinator | PC | Reviews final readiness; approves P4 for issuance |
| Read-Only Stakeholder | RO | Views engagement status, milestones, gate status; no editing |
| Admin | AD | Manages users, roles, system configuration; can perform any authorized action |

---

### F16.2 Primary Journey Definitions

| Journey ID | Journey Name | Primary Persona | Start Condition | End Condition |
|---|---|---|---|---|
| J1 | Intake and Acceptance | AL | No request exists | Request accepted; Engagement Shell created (A1 approved) OR request declined |
| J2 | Planning Setup | EM | Engagement Shell exists (A1 approved) | Planning baseline approved (P2 approved) |
| J3 | Evidence Readiness | AN, QA | P2 approved | All objectives marked Sufficient; P3 approved |
| J4 | Draft Readiness | AN, IR | P3 approved; Draft Product created | All statements referenced; reference checks complete |
| J5 | Final Readiness | EM, PC | Reference checks complete | P4 approved; engagement status = Ready for Issuance or Closed |

---

### F16.3 Feature-to-Persona Mapping

| Feature | Primary Personas | Primary Journey |
|---|---|---|
| F00 Application Shell | All | All |
| F01 Core Data Objects | All | All |
| F02 Request Intake | AL | J1 |
| F03 Gate A1 | AL | J1 |
| F04 Engagement Shell | EM, RO | J2, J3, J4, J5 |
| F05 Team and Milestones | EM | J2 |
| F06 Planning Record | EM, AN | J2 |
| F07 Gate P2 | QA | J2 |
| F08 Evidence Registry | AN | J3 |
| F09 Evidence-Objective Link | AN, QA | J3 |
| F10 Gate P3 | QA | J3 |
| F11 Draft Product | EM, AN | J4 |
| F12 Indexing and Reference Check | AN, IR | J4 |
| F13 Gate P4 | EM, PC | J5 |
| F14 Portfolio Dashboard | AL, EM, RO | All |
| F15 Engagement Detail Dashboard | EM, QA, AN | J2–J5 |
| F16 Persona and Journey Artifacts | AD | — |
| F17 Acceptance Test Generation | AD, QA | All |

---

### F16.4 Journey-to-Gate Scenario Mapping

Key gate scenarios derived from journeys, used as the basis for F17 acceptance tests:

| Scenario ID | Journey | Gate | Positive Path | Negative Path |
|---|---|---|---|---|
| S-A1-APPROVE | J1 | A1 | All request fields present + risk level + rationale → Engagement Shell created | Missing required field → 422 blocked |
| S-A1-DECLINE | J1 | A1 | Rationale provided → Request closed | Missing rationale → 422 blocked |
| S-P2-APPROVE | J2 | P2 | ≥1 objective + risk notes + data reliability + independence + owner + team + milestones → Planning approved | Missing any prerequisite → blocked |
| S-P2-RETURN | J2 | P2 | QA enters return comment → Planning returned | Missing comment → 422 blocked |
| S-P3-APPROVE | J3 | P3 | All objectives sufficient + no gaps + all findings linked → P3 approved | Any objective `evidence_needed` → blocked |
| S-P4-APPROVE | J5 | P4 | P3 approved + all checks Passed/Waived + no blockers → P4 approved | Any `failed` or `in_review` → blocked |

---

**Note:** Persona and journey artifacts are specification/design artifacts. They are maintained in this document and referenced by F17 for acceptance test generation. No database storage is required for persona definitions in v1.

**API Surface (F16):** None required. Personas and journeys are static specification artifacts.  
**Schema Surface (F16):** No dedicated tables. Journey scenarios feed into F17 test cases.
---

## F17: Basic Acceptance Test Generation

**Description:** Basic Acceptance Test Generation produces a compact set of acceptance tests derived from the primary journeys (J1–J5) and gate prerequisite rules. These tests validate the core workflow behaviors — request submission, gate approval/rejection, evidence upload, reference check completion, dashboard visibility, and CSV export — to confirm the system is correctly implemented.

**Terminology:**
- **Acceptance Test:** A named test with a precondition, action, and expected outcome that validates a specific behavior.
- **Gate Rule Test:** A test that specifically validates a gate's prerequisite enforcement (must block when conditions are not met; must pass when they are).
- **Positive Path Test:** Validates that the happy path works correctly.
- **Negative Path Test:** Validates that the system correctly blocks or rejects an action that does not meet prerequisites.

**Sub-features:**
- F17.1 — Request submission and A1 gate tests
- F17.2 — Engagement setup and P2 gate tests
- F17.3 — Evidence upload and P3 gate tests
- F17.4 — Reference check and P4 gate tests
- F17.5 — Dashboard visibility and CSV export tests

---

### F17.1 Request Submission and A1 Gate Tests

| Test ID | Name | Precondition | Action | Expected Outcome |
|---|---|---|---|---|
| AT-A1-01 | Create Draft Request | User is logged in as AL | Fill required fields, click Save as Draft | Request saved with `status = draft`; no audit event for submission |
| AT-A1-02 | Submit Complete Request | Draft request with all required fields | Click Submit | Request `status = submitted`; audit event `REQUEST_SUBMITTED` created |
| AT-A1-03 | Block Submit - Missing Fields | Draft request with missing `requester` | Click Submit | HTTP 422; field error for `requester`; status remains `draft` |
| AT-A1-04 | Approve A1 | Submitted request with all fields | AL selects risk level + enters rationale + clicks Approve | Engagement Shell created; request `status = accepted`; gate decision `A1/approved`; audit event written |
| AT-A1-05 | Block A1 - Missing Risk Level | Submitted request | AL skips risk level, clicks Approve | HTTP 422; error "Risk level is required"; no engagement created |
| AT-A1-06 | Block A1 - Missing Rationale | Submitted request | AL leaves rationale blank, clicks Approve | HTTP 422; error "Rationale must be at least 10 characters" |
| AT-A1-07 | Decline A1 | Submitted request | AL enters rationale + clicks Decline | Request `status = declined`; gate decision `A1/declined`; audit event written; no engagement created |
| AT-A1-08 | A1 Visible in Dashboard | A1 decided engagement | View Portfolio Dashboard | Engagement appears with correct A1 status in gate column |

---

### F17.2 Engagement Setup and P2 Gate Tests

| Test ID | Name | Precondition | Action | Expected Outcome |
|---|---|---|---|---|
| AT-P2-01 | Add Objective | Engagement in planning phase | EM adds objective text | Objective saved; visible in planning record |
| AT-P2-02 | Submit for P2 Review | Planning record with ≥1 objective, risk notes, data reliability notes, independence status, owner, QA assigned, milestone set | EM clicks Submit for P2 | `planning_record.status = ready_for_review`; appears in QA Review Queue |
| AT-P2-03 | Block Submit - No Objectives | Planning record with no objectives | EM clicks Submit | HTTP 422; error "At least one objective is required before submitting for P2" |
| AT-P2-04 | Block Submit - Missing Risk Notes | Planning record missing risk notes | EM clicks Submit | HTTP 422; "Risk notes are required before submitting for P2" |
| AT-P2-05 | Approve P2 | Planning record `ready_for_review` with all prereqs | QA enters comment + clicks Approve | `planning_record.status = approved`; `engagement.phase = evidence`; gate decision written |
| AT-P2-06 | Block P2 - No Team | Planning record submitted but no EM on team | QA clicks Approve | HTTP 422; "At least one Engagement Manager must be assigned" |
| AT-P2-07 | Return P2 | Planning record `ready_for_review` | QA enters comments + clicks Return | `planning_record.status = returned`; gate decision `P2/returned` written |
| AT-P2-08 | Edit Post-P2 with Revision Note | Approved planning record | EM clicks Request Revision, enters note, edits field | Changes saved; revision note recorded; audit event `PLANNING_RECORD_REVISED` |

---

### F17.3 Evidence Upload and P3 Gate Tests

| Test ID | Name | Precondition | Action | Expected Outcome |
|---|---|---|---|---|
| AT-P3-01 | Upload Evidence File | Engagement in evidence phase; AN logged in | AN creates evidence record + uploads PDF ≤50MB | Evidence item created; file stored; audit event `EVIDENCE_FILE_UPLOADED` |
| AT-P3-02 | Block Upload - File Too Large | Evidence item exists | AN uploads a 60MB file | HTTP 422; "File exceeds maximum size of 50 MB"; file not stored |
| AT-P3-03 | Link Evidence to Objective | Evidence item and objective exist | AN links evidence to objective | Link created; objective shows evidence count ≥1; audit event written |
| AT-P3-04 | Mark Objective Sufficient | Objective with ≥1 linked evidence | QA changes status to `sufficient` | Objective status updated; gap view removes this objective |
| AT-P3-05 | Approve P3 | All objectives `sufficient` + no gaps + all findings linked | QA enters comment + clicks Approve P3 | `engagement.phase = draft`; gate decision `P3/approved`; audit event written |
| AT-P3-06 | Block P3 - Evidence Needed | Objective with `evidence_needed` status | QA clicks Approve P3 | HTTP 409; "One or more objectives are still marked Evidence Needed" |
| AT-P3-07 | Block P3 - No Evidence on Objective | Objective with zero linked evidence | QA clicks Approve P3 | HTTP 409; "One or more objectives have no linked evidence items" |
| AT-P3-08 | Restricted Evidence Access | Evidence item with `sensitivity = restricted`; RO user | RO views evidence list | Restricted item not visible; no download link shown to RO |

---

### F17.4 Reference Check and P4 Gate Tests

| Test ID | Name | Precondition | Action | Expected Outcome |
|---|---|---|---|---|
| AT-P4-01 | Create Draft Statement | Draft product exists; AN logged in | AN adds statement text + links evidence | Statement created with `reference_status = not_started`; audit event written |
| AT-P4-02 | Assign Statement to IR | Statement with ≥1 evidence link; IR on team | EM assigns statement to IR | `assigned_to_ir` set; statement appears in IR Review Queue |
| AT-P4-03 | Pass Reference Check | IR has assigned statement | IR sets `reference_status = passed` | Status updated; audit event `REFERENCE_STATUS_CHANGED` |
| AT-P4-04 | Fail Reference Check | IR has assigned statement | IR sets `reference_status = failed` with discrepancy notes | Status updated; discrepancy notes saved; statement appears in Analyst queue |
| AT-P4-05 | Block Fail - No Discrepancy Notes | IR sets `failed` without notes | Click Save | HTTP 422; "Discrepancy notes are required when reference status is Failed" |
| AT-P4-06 | Waive Reference Check | Statement exists; EM logged in | EM enters waiver justification + clicks Waive | `reference_status = waived`; audit event written |
| AT-P4-07 | Approve P4 | P3 approved; all checks Passed/Waived; no blockers | EM enters comment + selects Ready for Issuance + clicks Approve P4 | `engagement.status = ready_for_issuance`; gate decision `P4/approved`; audit event written |
| AT-P4-08 | Block P4 - Failed Check | One statement with `reference_status = failed` | EM clicks Approve P4 | HTTP 409; "All reference checks must be Passed or Waived. 1 check(s) have Failed status." |
| AT-P4-09 | Block P4 - P3 Not Approved | P3 not yet approved | EM clicks Approve P4 | HTTP 409; "Gate P3 must be approved before P4 can pass." |

---

### F17.5 Dashboard Visibility and CSV Export Tests

| Test ID | Name | Precondition | Action | Expected Outcome |
|---|---|---|---|---|
| AT-DASH-01 | Portfolio Dashboard Loads | Multiple engagements exist | User navigates to `/dashboard` | Count cards show correct totals; list shows engagement ID, title, phase, owner, risk, gate status |
| AT-DASH-02 | Filter by Risk Level | Portfolio dashboard loaded | User selects "High" in risk filter | Only high-risk engagements shown; count updates |
| AT-DASH-03 | Export Engagement Register | Portfolio dashboard loaded; user has export permission | User clicks Export to CSV | CSV downloaded with correct columns; audit event `ENGAGEMENT_REGISTER_EXPORTED` |
| AT-DASH-04 | Engagement Detail Dashboard | Engagement with evidence and statements | User navigates to engagement detail | Gate cards, milestones, evidence counts, reference check %, and blockers all display correctly |
| AT-DASH-05 | Export Evidence Registry | Evidence items exist | User clicks Export on evidence page | CSV with correct evidence columns; restricted items excluded for RO/AL |
| AT-DASH-06 | Audit Trail Visible | Engagement with gate decisions | User navigates to audit trail | All logged events show actor, action, timestamp in reverse chronological order |
| AT-DASH-07 | Access Control - RO Cannot Edit | RO user on engagement | RO attempts to click Edit on Engagement Shell | Edit controls not rendered; direct API call returns HTTP 403 |

---

**API Surface (F17):** No dedicated API — tests are executed against existing feature endpoints.  
**Schema Surface (F17):** No dedicated tables — test data uses existing entities.
---

## Y0: Database Schema — Full DDL

All tables use PostgreSQL-compatible syntax. UUIDs are generated by `gen_random_uuid()`. All timestamps are `TIMESTAMPTZ` (UTC). Soft-delete columns (`deleted_at`) are used where specified.

---

### §Auth — Users and Roles

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('AL','EM','AN','QA','IR','PC','RO','AD')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE (user_id, role)
);

CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ
);

CREATE TABLE login_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    succeeded   BOOLEAN NOT NULL,
    ip_address  VARCHAR(45),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### §Requests

```sql
CREATE TABLE requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type            VARCHAR(30) NOT NULL CHECK (request_type IN ('congressional_request','mandate','internal_proposal')),
    requester               VARCHAR(255),
    topic                   VARCHAR(500),
    agency_program          VARCHAR(255),
    due_date                DATE,
    notes                   TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','submitted','accepted','declined')),
    intake_document_ref     VARCHAR(1000),
    intake_document_name    VARCHAR(255),
    submitted_at            TIMESTAMPTZ,
    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_by ON requests(created_by);
```

---

### §Engagements

```sql
CREATE TABLE engagements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID REFERENCES requests(id),
    job_code    VARCHAR(100) NOT NULL UNIQUE,
    title       VARCHAR(500) NOT NULL,
    phase       VARCHAR(20) NOT NULL DEFAULT 'planning'
                    CHECK (phase IN ('intake','planning','evidence','draft','readiness','closed')),
    status      VARCHAR(30) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','on_hold','ready_for_issuance','closed')),
    risk_level  VARCHAR(10) NOT NULL CHECK (risk_level IN ('low','medium','high')),
    owner_id    UUID NOT NULL REFERENCES users(id),
    portfolio   VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engagements_owner ON engagements(owner_id);
CREATE INDEX idx_engagements_phase ON engagements(phase);
CREATE INDEX idx_engagements_status ON engagements(status);

-- Auto-increment job code sequence per year
CREATE SEQUENCE engagement_seq_2026 START 1;
-- (Create a new sequence each year: engagement_seq_YYYY)
```

---

### §Team

```sql
CREATE TABLE team_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    role            VARCHAR(10) NOT NULL CHECK (role IN ('AL','EM','AN','QA','IR','PC','RO')),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID REFERENCES users(id),
    removed_at      TIMESTAMPTZ,
    UNIQUE (engagement_id, user_id, role)
);

CREATE TABLE milestones (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id               UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE UNIQUE,
    planning_approval_target    DATE,
    evidence_readiness_target   DATE,
    draft_readiness_target      DATE,
    final_readiness_target      DATE,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### §Planning

```sql
CREATE TABLE planning_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id           UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE UNIQUE,
    design_approach         TEXT,
    schedule_notes          TEXT,
    risk_notes              TEXT,
    data_reliability_notes  TEXT,
    independence_status     VARCHAR(20) CHECK (independence_status IN ('affirmed','pending','exception_noted')),
    status                  VARCHAR(20) NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','ready_for_review','approved','returned')),
    approved_at             TIMESTAMPTZ,
    approved_by             UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE objectives (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id       UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    planning_record_id  UUID NOT NULL REFERENCES planning_records(id) ON DELETE CASCADE,
    objective_text      TEXT NOT NULL,
    information_need    TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'evidence_needed'
                            CHECK (status IN ('evidence_needed','in_review','sufficient')),
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_objectives_planning_record ON objectives(planning_record_id);
CREATE INDEX idx_objectives_engagement ON objectives(engagement_id);

CREATE TABLE planning_revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planning_record_id  UUID NOT NULL REFERENCES planning_records(id),
    revised_by          UUID NOT NULL REFERENCES users(id),
    revision_note       TEXT NOT NULL,
    before_snapshot     JSONB,
    after_snapshot      JSONB,
    revised_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### §Evidence

```sql
CREATE TABLE evidence_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    evidence_type   VARCHAR(20) NOT NULL
                        CHECK (evidence_type IN ('document','dataset','interview_note','meeting_note','other')),
    source          VARCHAR(500) NOT NULL,
    date_received   DATE NOT NULL,
    custodian       VARCHAR(255),
    description     TEXT,
    sensitivity     VARCHAR(15) NOT NULL DEFAULT 'standard'
                        CHECK (sensitivity IN ('standard','restricted')),
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_evidence_engagement ON evidence_items(engagement_id);
CREATE INDEX idx_evidence_sensitivity ON evidence_items(sensitivity);

CREATE TABLE evidence_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    file_ref        VARCHAR(1000) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE objective_evidence_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id    UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    linked_by       UUID NOT NULL REFERENCES users(id),
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (objective_id, evidence_item_id)
);
```

---

### §Findings

```sql
CREATE TABLE findings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    finding_text    TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','under_review','accepted','rejected')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE finding_evidence_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    linked_by       UUID NOT NULL REFERENCES users(id),
    linked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (finding_id, evidence_item_id)
);
```

---

### §Draft

```sql
CREATE TABLE draft_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE UNIQUE,
    title           VARCHAR(500) NOT NULL,
    version         VARCHAR(50) NOT NULL,
    owner_id        UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'drafting'
                        CHECK (status IN ('drafting','under_review','ready_for_reference_check','ready_for_final_review')),
    review_comments TEXT,
    file_ref        VARCHAR(1000),
    file_name       VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE draft_statements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_product_id    UUID NOT NULL REFERENCES draft_products(id) ON DELETE CASCADE,
    statement_text      TEXT NOT NULL,
    reference_status    VARCHAR(20) NOT NULL DEFAULT 'not_started'
                            CHECK (reference_status IN ('not_started','in_review','passed','failed','waived')),
    assigned_to_ir      UUID REFERENCES users(id),
    assigned_to_analyst UUID REFERENCES users(id),
    discrepancy_notes   TEXT,
    revision_ready      BOOLEAN NOT NULL DEFAULT FALSE,
    waived_by           UUID REFERENCES users(id),
    waived_at           TIMESTAMPTZ,
    waiver_justification TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_statements_draft_product ON draft_statements(draft_product_id);
CREATE INDEX idx_statements_ref_status ON draft_statements(reference_status);

CREATE TABLE statement_evidence_links (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id        UUID NOT NULL REFERENCES draft_statements(id) ON DELETE CASCADE,
    evidence_item_id    UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    linked_by           UUID NOT NULL REFERENCES users(id),
    linked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (statement_id, evidence_item_id)
);
```

---

### §Gates

```sql
CREATE TABLE gate_decisions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    gate_type       VARCHAR(5) NOT NULL CHECK (gate_type IN ('A1','P2','P3','P4')),
    status          VARCHAR(15) NOT NULL CHECK (status IN ('approved','declined','returned')),
    approver_id     UUID NOT NULL REFERENCES users(id),
    decided_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rationale       TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Note: No UPDATE or DELETE permitted on this table (enforced at application layer)
);

CREATE INDEX idx_gate_decisions_engagement ON gate_decisions(engagement_id);
CREATE INDEX idx_gate_decisions_gate_type ON gate_decisions(gate_type);
```

---

### §Audit

```sql
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id   UUID REFERENCES engagements(id),
    actor_id        UUID NOT NULL REFERENCES users(id),
    actor_name      VARCHAR(255) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    object_type     VARCHAR(100) NOT NULL,
    object_id       UUID,
    summary         TEXT NOT NULL,
    before_snapshot JSONB,
    after_snapshot  JSONB,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Note: No UPDATE or DELETE permitted on this table (enforced at application layer)
);

CREATE INDEX idx_audit_engagement ON audit_events(engagement_id);
CREATE INDEX idx_audit_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_action ON audit_events(action);
CREATE INDEX idx_audit_occurred_at ON audit_events(occurred_at DESC);
```

---

### §Draft Comments (append-only)

```sql
CREATE TABLE draft_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_product_id UUID NOT NULL REFERENCES draft_products(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    author_name     VARCHAR(255) NOT NULL,
    comment_text    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Note: No UPDATE or DELETE permitted (append-only)
);
```
---

## Y1: REST API Catalog

All endpoints are prefixed with `/api/v1`. All requests and responses use `Content-Type: application/json` unless noted (multipart for file uploads). Authentication is required for all endpoints (session cookie or `Authorization: Bearer <token>`).

Standard response envelope:
```json
{
  "data": { ... },
  "meta": { "timestamp": "2026-06-04T00:00:00Z" }
}
```
Error response envelope:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "errors": [ { "field": "field_name", "message": "..." } ]
  }
}
```

---

### §Auth — Authentication and Users

| Method | Path | Description | Roles |
|---|---|---|---|
| `POST` | `/auth/login` | Login; returns session token | Public |
| `POST` | `/auth/logout` | Logout; revokes session | Authenticated |
| `GET` | `/users` | List all users | AD |
| `POST` | `/users` | Create user | AD |
| `GET` | `/users/{id}` | Get user by ID | AD |
| `PATCH` | `/users/{id}` | Update user fields | AD |
| `PUT` | `/users/{id}/roles` | Replace user's role list | AD |
| `GET` | `/users/me` | Get current user profile | Authenticated |

**POST /auth/login**
```
Request:  { "email": "string", "password": "string" }
Response: { "data": { "token": "string", "user": { "id", "email", "full_name", "roles": [] } } }
```

---

### §Requests

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/requests` | List requests (filterable by status) | AL, AD, RO |
| `POST` | `/requests` | Create new request (draft) | AL, AD |
| `GET` | `/requests/{id}` | Get request detail | AL, AD, EM, RO |
| `PATCH` | `/requests/{id}` | Update request (draft only) | AL, AD |
| `POST` | `/requests/{id}/submit` | Submit request for A1 | AL, AD |
| `POST` | `/requests/{id}/document` | Upload intake document (multipart) | AL, AD |
| `GET` | `/requests/{id}/document` | Download intake document | AL, AD, EM |

**POST /requests**
```
Request: {
  "request_type": "congressional_request|mandate|internal_proposal",
  "requester": "string?",
  "topic": "string?",
  "agency_program": "string?",
  "due_date": "YYYY-MM-DD?",
  "notes": "string?"
}
Response 201: { "data": { "id": "uuid", "status": "draft", ... } }
```

**POST /requests/{id}/document** — multipart/form-data
```
Field: file (binary, required)
Response 200: { "data": { "intake_document_name": "string", "intake_document_ref": "string" } }
```

---

### §Engagements

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements` | List engagements (filterable) | All (scoped by access) |
| `GET` | `/engagements/{id}` | Get engagement detail | All (scoped) |
| `PATCH` | `/engagements/{id}` | Update engagement metadata | EM, AD |
| `GET` | `/engagements/{id}/blockers` | Get computed blockers list | All (scoped) |
| `GET` | `/engagements` (CSV) | Export engagement register; `Accept: text/csv` | AL, EM, AN, QA, PC, RO, AD |

**PATCH /engagements/{id}**
```
Request: {
  "title": "string?",
  "phase": "string?",
  "status": "string?",
  "risk_level": "string?",
  "owner_id": "uuid?",
  "portfolio": "string?",
  "revision_note": "string? (required if phase changes)"
}
Response 200: { "data": { engagement object } }
```

---

### §Team and Milestones

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/team` | List team assignments | All (scoped) |
| `POST` | `/engagements/{id}/team` | Add team member | EM, AD |
| `DELETE` | `/engagements/{id}/team/{assignment_id}` | Remove team member | EM, AD |
| `GET` | `/engagements/{id}/milestones` | Get milestone dates and status | All (scoped) |
| `PUT` | `/engagements/{id}/milestones` | Set/update all milestone dates | EM, AD |

**POST /engagements/{id}/team**
```
Request: { "user_id": "uuid", "role": "AL|EM|AN|QA|IR|PC|RO" }
Response 201: { "data": { "id": "uuid", "user_id", "role", "assigned_at" } }
```

**PUT /engagements/{id}/milestones**
```
Request: {
  "planning_approval_target": "YYYY-MM-DD?",
  "evidence_readiness_target": "YYYY-MM-DD?",
  "draft_readiness_target": "YYYY-MM-DD?",
  "final_readiness_target": "YYYY-MM-DD?"
}
Response 200: { "data": { milestone object with computed status fields } }
```

---

### §Planning

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/planning` | Get planning record | All (scoped) |
| `POST` | `/engagements/{id}/planning` | Create planning record | EM, AD |
| `PATCH` | `/engagements/{id}/planning` | Update planning record | EM, AN, AD |
| `POST` | `/engagements/{id}/planning/submit` | Submit for P2 review | EM, AD |
| `GET` | `/engagements/{id}/planning/objectives` | List objectives | All (scoped) |
| `POST` | `/engagements/{id}/planning/objectives` | Add objective | EM, AN, AD |
| `PATCH` | `/engagements/{id}/planning/objectives/{obj_id}` | Update objective | EM, AN, AD |
| `DELETE` | `/engagements/{id}/planning/objectives/{obj_id}` | Delete objective (if no linked evidence) | EM, AD |
| `GET` | `/engagements/{id}/planning/revisions` | List planning revisions | EM, QA, AD |

**PATCH /engagements/{id}/planning** (post-P2 revision)
```
Request: {
  "design_approach": "string?",
  "schedule_notes": "string?",
  "risk_notes": "string?",
  "data_reliability_notes": "string?",
  "independence_status": "affirmed|pending|exception_noted?",
  "revision_note": "string (required if planning_record.status = approved)"
}
Response 200: { "data": { planning_record object } }
```

---

### §Gates

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/gates` | List all gate decisions for engagement | All (scoped) |
| `GET` | `/engagements/{id}/gates/{gate_type}` | Get gate decisions for one gate type | All (scoped) |
| `POST` | `/engagements/{id}/gates/a1/approve` | Approve Gate A1 | AL |
| `POST` | `/engagements/{id}/gates/a1/decline` | Decline Gate A1 | AL |
| `POST` | `/engagements/{id}/gates/p2/approve` | Approve Gate P2 | QA |
| `POST` | `/engagements/{id}/gates/p2/return` | Return Gate P2 | QA |
| `POST` | `/engagements/{id}/gates/p3/approve` | Approve Gate P3 | QA |
| `POST` | `/engagements/{id}/gates/p4/approve` | Approve Gate P4 | EM, PC, AD |

**POST /engagements/{id}/gates/a1/approve**
```
Request: { "risk_level": "low|medium|high", "rationale": "string (min 10 chars)" }
Response 201: {
  "data": {
    "gate_decision": { gate decision object },
    "engagement": { new engagement object }
  }
}
```

**POST /engagements/{id}/gates/p2/approve**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "planning_record": { "status": "approved" } } }
```

**POST /engagements/{id}/gates/p2/return**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "planning_record": { "status": "returned" } } }
```

**POST /engagements/{id}/gates/p3/approve**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "engagement": { "phase": "draft" } } }
```

**POST /engagements/{id}/gates/p4/approve**
```
Request: { "outcome": "ready_for_issuance|closed", "rationale": "string (min 10 chars)" }
Response 201: {
  "data": {
    "gate_decision": { ... },
    "engagement": { "status": "ready_for_issuance|closed" }
  }
}
```

---

### §Evidence

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/evidence` | List evidence items | All (scoped; restricted items filtered) |
| `POST` | `/engagements/{id}/evidence` | Create evidence item | AN, AD |
| `GET` | `/engagements/{id}/evidence/{ev_id}` | Get evidence item detail | All (scoped) |
| `PATCH` | `/engagements/{id}/evidence/{ev_id}` | Update evidence item | AN, AD |
| `DELETE` | `/engagements/{id}/evidence/{ev_id}` | Soft-delete evidence item | AN, AD |
| `POST` | `/engagements/{id}/evidence/{ev_id}/files` | Upload evidence file (multipart) | AN, AD |
| `GET` | `/engagements/{id}/evidence/{ev_id}/files/{file_id}` | Download evidence file | All (scoped; restricted enforced) |
| `POST` | `/engagements/{id}/evidence/{ev_id}/objectives` | Link evidence to objectives | AN, EM, AD |
| `DELETE` | `/engagements/{id}/evidence/{ev_id}/objectives/{obj_id}` | Unlink evidence from objective | AN, EM, AD |
| `GET` | `/engagements/{id}/evidence/gaps` | List objectives with no evidence | All (scoped) |
| `GET` | `/engagements/{id}/evidence` (CSV) | Export evidence registry; `Accept: text/csv` | AL, EM, AN, QA, PC, RO, AD |

**POST /engagements/{id}/evidence**
```
Request: {
  "evidence_type": "document|dataset|interview_note|meeting_note|other",
  "source": "string (required)",
  "date_received": "YYYY-MM-DD (required)",
  "custodian": "string?",
  "description": "string?",
  "sensitivity": "standard|restricted (default: standard)"
}
Response 201: { "data": { evidence item object } }
```

---

### §Findings

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/findings` | List findings | All (scoped) |
| `POST` | `/engagements/{id}/findings` | Create finding | AN, AD |
| `GET` | `/engagements/{id}/findings/{f_id}` | Get finding detail | All (scoped) |
| `PATCH` | `/engagements/{id}/findings/{f_id}` | Update finding | AN, AD |
| `DELETE` | `/engagements/{id}/findings/{f_id}` | Soft-delete finding | AN, AD |
| `POST` | `/engagements/{id}/findings/{f_id}/evidence` | Link finding to evidence | AN, AD |
| `DELETE` | `/engagements/{id}/findings/{f_id}/evidence/{ev_id}` | Unlink finding from evidence | AN, AD |

---

### §Draft

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/draft` | Get draft product | All (scoped) |
| `POST` | `/engagements/{id}/draft` | Create draft product | EM, AN, AD |
| `PATCH` | `/engagements/{id}/draft` | Update draft product | EM, AN, AD |
| `POST` | `/engagements/{id}/draft/file` | Attach draft file (multipart) | EM, AN, AD |
| `GET` | `/engagements/{id}/draft/file` | Download draft file | All (scoped) |
| `PATCH` | `/engagements/{id}/draft/status` | Advance/change draft status | EM, QA, AD |
| `GET` | `/engagements/{id}/draft/comments` | List review comments | All (scoped) |
| `POST` | `/engagements/{id}/draft/comments` | Add review comment | EM, AN, QA, AD |

---

### §Statements

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/draft/statements` | List draft statements | All (scoped) |
| `POST` | `/engagements/{id}/draft/statements` | Create draft statement | AN, EM, AD |
| `PATCH` | `/engagements/{id}/draft/statements/{s_id}` | Update statement | AN, EM, AD |
| `DELETE` | `/engagements/{id}/draft/statements/{s_id}` | Delete statement | AN, EM, AD |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/evidence` | Link statement to evidence | AN, EM, AD |
| `DELETE` | `/engagements/{id}/draft/statements/{s_id}/evidence/{ev_id}` | Unlink statement from evidence | AN, EM, AD |
| `PATCH` | `/engagements/{id}/draft/statements/{s_id}/reference-status` | Set reference status (IR) | IR |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/assign` | Assign to IR or Analyst | EM, AD |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/waive` | Waive reference check | EM, AD |

**PATCH /engagements/{id}/draft/statements/{s_id}/reference-status**
```
Request: {
  "reference_status": "in_review|passed|failed",
  "discrepancy_notes": "string (required if failed)"
}
Response 200: { "data": { statement object } }
```

---

### §Dashboard

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/dashboard/portfolio` | Portfolio summary counts and engagement list | All |
| `GET` | `/dashboard/engagements/{id}` | Engagement detail dashboard metrics | All (scoped) |

**GET /dashboard/portfolio**
```
Query params: owner_id, risk_level, phase, status, due_date_from, due_date_to, gate_type, gate_status
Response 200: {
  "data": {
    "counts": { "active": 0, "in_planning": 0, ... },
    "engagements": [ { engagement list rows } ]
  }
}
```

**GET /dashboard/engagements/{id}**
```
Response 200: {
  "data": {
    "phase_summary": { ... },
    "gate_status": { "A1": { ... }, "P2": { ... }, "P3": { ... }, "P4": { ... } },
    "milestones": [ ... ],
    "evidence_metrics": { "total": 0, "objectives_with_evidence": 0, "gaps": 0 },
    "reference_metrics": { "total": 0, "passed": 0, "waived": 0, "failed": 0, "in_review": 0, "not_started": 0, "completion_pct": 0 },
    "blockers": [ { "type": "string", "message": "string", "object_id": "uuid?" } ]
  }
}
```

---

### §Audit

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/audit` | List audit events for engagement | All (scoped); AD sees all |
| `GET` | `/engagements/{id}/audit` (CSV) | Export audit log; `Accept: text/csv` | AD |

**GET /engagements/{id}/audit**
```
Query params: action, from_date, to_date, page, per_page (default 50)
Response 200: {
  "data": { "events": [ { audit event objects } ], "total": 0 },
  "meta": { "page": 1, "per_page": 50 }
}
```
---

## Y2: Cross-Feature Error Catalog

This catalog lists all application error codes, their HTTP status codes, the features that produce them, and guidance for client handling. All error responses follow the standard envelope defined in `Y1-api.md`.

---

### §Authentication and Authorization Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `UNAUTHORIZED` | 401 | F00 | "Authentication required." | Redirect to login |
| `AUTH_INVALID` | 401 | F00 | "Invalid username or password." | Show login error |
| `AUTH_LOCKED` | 403 | F00 | "Account locked. Try again in 15 minutes." | Show lockout message |
| `FORBIDDEN` | 403 | All | "You do not have permission to perform this action." | Show access denied message |
| `RESTRICTED_ACCESS_DENIED` | 403 | F08 | "You are not authorized to download restricted evidence files." | Hide download link for unauthorized roles |

---

### §Validation Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `VALIDATION_ERROR` | 422 | All | Field-level errors in `errors` array | Highlight affected fields |
| `NOT_FOUND` | 404 | All | "{Entity} not found." | Show 404 page or inline message |
| `FILE_TYPE_NOT_ALLOWED` | 422 | F02, F08, F11 | "File type not permitted. Allowed: [list]." | Show file type error near upload field |
| `FILE_TOO_LARGE` | 422 | F02, F08, F11 | "File exceeds maximum size of {n} MB." | Show size error near upload field |
| `FILE_LIMIT_EXCEEDED` | 422 | F08 | "Maximum of 20 files per evidence item." | Disable upload button when limit reached |
| `STORAGE_ERROR` | 503 | F02, F08, F11 | "File could not be saved. Please try again." | Show retry option |

---

### §Request Lifecycle Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `REQUEST_NOT_EDITABLE` | 409 | F02 | "Request cannot be edited after submission." | Hide Edit button for non-draft requests |
| `REQUEST_ALREADY_SUBMITTED` | 409 | F02 | "Request has already been submitted." | Disable Submit button |

---

### §Gate Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `GATE_PREREQUISITE_FAILED` | 409 | F03, F07, F10, F13 | Specific prerequisite message (see feature chunk) | Display blockers list; disable gate button |
| `GATE_FIELDS_INCOMPLETE` | 422 | F03, F07 | "Required fields missing: [field list]." | Highlight missing fields on review form |
| `GATE_ALREADY_DECIDED` | 409 | F03 | "This request has already been accepted or declined." | Hide decision controls |
| `P2_PREREQUISITE_FAILED` | 422 | F06 | Specific P2 blocker message | Highlight the failing section |
| `PHASE_PREREQUISITE_FAILED` | 409 | F10, F11, F13 | "Required gate has not been approved." | Show gate status and link to gate page |

---

### §Team and Assignment Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `ASSIGNMENT_DUPLICATE` | 409 | F05 | "This user already holds this role on the engagement." | Disable duplicate assignment |
| `TEAM_MIN_VIOLATED` | 409 | F05 | "Cannot remove the last Engagement Manager from the team." | Block remove action |
| `REFERENCE_CHECK_PREREQ` | 422 | F12 | "Statement must be linked to at least one evidence item before reference check can begin." | Show link evidence prompt |

---

### §Evidence and Link Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `EVIDENCE_LINKED` | 409 | F08 | "Cannot delete evidence — it is linked to objectives or findings. Unlink first." | Show which links must be removed |
| `CROSS_ENGAGEMENT_LINK` | 422 | F09, F10, F12 | "{Entity} does not belong to this engagement." | Filter selectors to same engagement |
| `LINK_DUPLICATE` | 409 | F09, F10, F12 | "This item is already linked." | Suppress duplicate link UI action |
| `EVIDENCE_REQUIRED` | 422 | F10 | "Cannot set status — no evidence is linked to this objective." | Show "add evidence" prompt |
| `FINDING_EVIDENCE_REQUIRED` | 409 | F09 | "Cannot unlink — this evidence is the only link for a finding under review." | Show affected finding |
| `OBJECTIVE_HAS_EVIDENCE` | 409 | F06 | "Cannot delete objective — it has linked evidence items." | Show unlink prompt |

---

### §Draft Product and Status Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `DRAFT_EXISTS` | 409 | F11 | "A draft product record already exists for this engagement." | Navigate to existing draft |
| `INVALID_STATUS_TRANSITION` | 409 | F11 | "Status cannot transition from {from} to {to}." | Show allowed transitions |
| `STATUS_LOCKED` | 422 | F04 | "Status can only be set through gate approval." | Remove manual status option from UI |

---

### §Audit Action Codes (for `audit_events.action` field)

| Action Code | Triggered By | Feature |
|---|---|---|
| `REQUEST_CREATED` | Create request (draft) | F02 |
| `REQUEST_UPDATED` | Edit request | F02 |
| `REQUEST_SUBMITTED` | Submit request | F02 |
| `REQUEST_DOCUMENT_UPLOADED` | Upload intake document | F02 |
| `GATE_A1_APPROVED` | A1 approval | F03 |
| `GATE_A1_DECLINED` | A1 decline | F03 |
| `ENGAGEMENT_UPDATED` | Edit engagement metadata | F04 |
| `TEAM_MEMBER_ASSIGNED` | Add team member | F05 |
| `TEAM_MEMBER_REMOVED` | Remove team member | F05 |
| `MILESTONES_UPDATED` | Set milestone dates | F05 |
| `PLANNING_RECORD_CREATED` | Create planning record | F06 |
| `PLANNING_RECORD_UPDATED` | Edit planning record | F06 |
| `PLANNING_SUBMITTED_FOR_REVIEW` | Submit planning for P2 | F06 |
| `PLANNING_RECORD_REVISED` | Edit post-P2 approval | F06 |
| `GATE_P2_APPROVED` | P2 approval | F07 |
| `GATE_P2_RETURNED` | P2 return | F07 |
| `EVIDENCE_ITEM_CREATED` | Create evidence item | F08 |
| `EVIDENCE_ITEM_UPDATED` | Update evidence item | F08 |
| `EVIDENCE_ITEM_DELETED` | Delete evidence item | F08 |
| `EVIDENCE_FILE_UPLOADED` | Upload evidence file | F08 |
| `EVIDENCE_FILE_DOWNLOADED` | Download evidence file | F08 |
| `EVIDENCE_RESTRICTED` | Change sensitivity to restricted | F08 |
| `EVIDENCE_OBJECTIVE_LINKED` | Link evidence to objective | F09 |
| `EVIDENCE_OBJECTIVE_UNLINKED` | Unlink evidence from objective | F09 |
| `EVIDENCE_CSV_EXPORTED` | Export evidence registry CSV | F09 |
| `FINDING_CREATED` | Create finding | F10 |
| `FINDING_EVIDENCE_LINKED` | Link finding to evidence | F10 |
| `OBJECTIVE_STATUS_UPDATED` | Update objective status | F10 |
| `GATE_P3_APPROVED` | P3 approval | F10 |
| `DRAFT_PRODUCT_CREATED` | Create draft product | F11 |
| `DRAFT_PRODUCT_UPDATED` | Update draft product | F11 |
| `DRAFT_FILE_ATTACHED` | Attach draft file | F11 |
| `DRAFT_FILE_DOWNLOADED` | Download draft file | F11 |
| `DRAFT_STATUS_CHANGED` | Advance draft status | F11 |
| `DRAFT_COMMENT_ADDED` | Add review comment | F11 |
| `STATEMENT_CREATED` | Create draft statement | F12 |
| `STATEMENT_EVIDENCE_LINKED` | Link statement to evidence | F12 |
| `REFERENCE_CHECK_ASSIGNED` | Assign to IR | F12 |
| `REFERENCE_STATUS_CHANGED` | IR updates reference status | F12 |
| `REFERENCE_FAILED_DISCREPANCY` | Reference check failed | F12 |
| `REFERENCE_CHECK_WAIVED` | Waive reference check | F12 |
| `GATE_P4_APPROVED` | P4 approval | F13 |
| `ENGAGEMENT_CLOSED` | Close engagement | F13 |
| `ENGAGEMENT_REGISTER_EXPORTED` | Export engagement register CSV | F14 |
| `USER_ROLE_ASSIGNED` | Admin assigns user role | F00 |
| `USER_ROLE_REMOVED` | Admin removes user role | F00 |
| `USER_LOGIN` | Successful login | F00 |
| `USER_LOGIN_FAILED` | Failed login attempt | F00 |
| `USER_ACCOUNT_LOCKED` | Account locked after repeated failures | F00 |
| `AUDIT_LOG_EXPORTED` | Admin exports audit log CSV | F00 |
---

## Y3: External Integration Points

This document catalogs all external system dependencies and integration contracts for EMS v1. The scope is intentionally minimal; advanced integrations are explicitly deferred.

---

### §File Storage

**Purpose:** Store intake documents (F02), evidence files (F08), and draft product attachments (F11).

**Integration type:** Object storage (local filesystem for development; managed blob storage for production, e.g., S3-compatible, Azure Blob, or GCS).

**Contract:**

| Operation | Trigger | Behavior |
|---|---|---|
| Upload file | POST to file endpoint | System writes file to storage path; records `file_ref` (path/URL) and `file_name` in database |
| Download file | GET file endpoint | System checks authorization; returns signed/authenticated URL or streams file content |
| Delete file | Engagement soft-delete cleanup | Physical delete is deferred; scheduled cleanup process marks orphan files for removal |

**Storage path conventions:**

| Use case | Path |
|---|---|
| Intake document | `requests/{request_id}/{original_filename}` |
| Evidence file | `evidence/{engagement_id}/{evidence_id}/{original_filename}` |
| Draft attachment | `draft/{engagement_id}/{draft_id}/{original_filename}` |

**Configuration:**
- Storage backend is configurable via environment variables: `STORAGE_BACKEND` (`local` or `s3_compatible`), `STORAGE_BUCKET`, `STORAGE_BASE_PATH`.
- For local development: files are stored on the local filesystem at `./data/files/`.
- For production: S3-compatible bucket with server-side encryption required.

**Security requirements:**
- Files must not be publicly accessible by direct URL.
- Access must be granted only through the application API after RBAC check.
- Restricted evidence files must be additionally filtered by `sensitivity` check before the download URL is issued.

---

### §Authentication Provider

**Purpose:** Authenticate users before granting access to the application.

**Integration type:** Built-in username/password authentication (v1 default). Organization identity provider (OIDC/SAML) is a future option; not in scope for v1.

**Contract (v1 — built-in auth):**
- Passwords are hashed using bcrypt (cost factor ≥ 12).
- Sessions are stored in the `sessions` table with an expiry of 8 hours (configurable).
- Login attempts are tracked in `login_attempts`; account is locked after 5 consecutive failures within 15 minutes.
- Lockout duration: 15 minutes (configurable via environment variable).

**Future provision:** The authentication layer should be designed so that an OIDC/SAML provider can be substituted by updating the auth configuration without changing feature logic.

---

### §CSV Export

**Purpose:** Export engagement register (F14) and evidence registry (F09) to CSV for stakeholder reporting.

**Integration type:** Server-generated CSV download (no external system).

**Contract:**
- Server generates CSV in memory from database query and streams the response with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="{type}_{engagement_id}_{date}.csv"`.
- No third-party CSV library required beyond standard language library.
- Export is triggered by `Accept: text/csv` header or a `?format=csv` query parameter on the relevant GET endpoint.

---

### §Email / Notifications

**Scope in v1:** Out of scope. No email or push notification integration.

**Provision:** The system should write audit events for all actions that would logically trigger notifications (gate returns, reference check failures, assignments). A future notification module can consume the audit event stream to send emails.

---

### §HTTPS / TLS

**Requirement:** All application traffic must use HTTPS/TLS.

**Implementation:** TLS termination is handled at the load balancer or reverse proxy (e.g., nginx, AWS ALB) in front of the application container. The application itself runs on HTTP internally within the container network.

---

### §Database

**Integration type:** PostgreSQL (recommended) or equivalent relational database.

**Version:** PostgreSQL 15+ recommended for `gen_random_uuid()` and `JSONB` support.

**Connection:** Application connects via connection string in environment variable `DATABASE_URL`.

**Backup:** Database backup must be supported using standard pg_dump tooling or cloud snapshot. Backup schedule is configurable by the deployment operator.

---

### §Deployment and Container

**Integration type:** Docker container + docker-compose for local development; container orchestration (Kubernetes or equivalent) for production.

**Required services (docker-compose):**
- `app` — Backend REST API service
- `frontend` — React web application
- `db` — PostgreSQL instance
- `storage` — Local file storage volume (or external storage mount)

**Environment variables (required at startup):**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for session signing |
| `STORAGE_BACKEND` | `local` or `s3_compatible` |
| `STORAGE_BUCKET` | Bucket name (if s3_compatible) |
| `STORAGE_BASE_PATH` | Base path for file storage |
| `MAX_LOGIN_ATTEMPTS` | Failed login threshold (default 5) |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration (default 15) |
| `SESSION_EXPIRY_HOURS` | Session duration (default 8) |

---

### §Out-of-Scope Integrations (Explicitly Deferred for v1)

| Integration | Reason Deferred |
|---|---|
| External records management system | Out of scope — full records management not required |
| Email/push notifications | Deferred; audit events provision for future module |
| Organization identity provider (OIDC/SAML) | Deferred to post-MVP; built-in auth sufficient for v1 |
| Advanced analytics / BI tool | Out of scope — CSV export is sufficient for v1 reporting |
| External publication/workflow system | Out of scope — P4 is the terminal point for this version |
| Recommendation tracking system | Out of scope for v1 |
