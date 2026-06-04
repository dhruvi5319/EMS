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
