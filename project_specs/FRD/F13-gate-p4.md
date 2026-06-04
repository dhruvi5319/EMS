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
