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
