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
