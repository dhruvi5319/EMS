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
