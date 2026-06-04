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
