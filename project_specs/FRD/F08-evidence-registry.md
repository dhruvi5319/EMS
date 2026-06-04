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
