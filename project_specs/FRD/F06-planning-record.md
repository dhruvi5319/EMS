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
