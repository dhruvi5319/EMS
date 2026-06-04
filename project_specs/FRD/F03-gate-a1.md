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
