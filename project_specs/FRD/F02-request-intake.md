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
