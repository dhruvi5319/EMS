---

## F05: Team and Milestones

**Description:** Team and Milestones allows the Engagement Manager to assign specific users to predefined engagement roles and to set target dates for key milestones. Role clarity is a prerequisite for Gate P2 approval (which requires the team to be assigned) and is the basis for routing actions and notifications throughout the engagement. Milestone dates provide the progress tracking visible in dashboards.

**Terminology:**
- **Team Assignment:** A record binding a user, a role, and an engagement.
- **Milestone:** A named target date for a key phase transition in the engagement lifecycle.
- **Milestone Status:** A computed or manually set state indicating whether the milestone is on track.

**Sub-features:**
- F05.1 — Assign team members
- F05.2 — Remove team members
- F05.3 — Set milestone dates
- F05.4 — View milestone status

---

### F05.1 Assign Team Members

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to `/engagements/{id}/team`.
2. EM clicks "Add Team Member."
3. EM selects a user from the user list and assigns a role.
4. System validates the assignment (no duplicate role for same user on same engagement).
5. System creates a `TeamAssignment` record.
6. System writes audit event `TEAM_MEMBER_ASSIGNED`.

**Inputs:**
- `engagement_id` (UUID, required): derived from route
- `user_id` (UUID, required): must be an active user
- `role` (enum, required): `AL`, `EM`, `AN`, `QA`, `IR`, `PC`, `RO`

**Predefined role slots per engagement:**

| Role | Min | Max | Notes |
|---|---|---|---|
| EM (Engagement Manager) | 1 | 2 | Required; at least one must be assigned |
| AN (Analyst) | 0 | — | One or more expected before evidence work |
| QA (QA Reviewer) | 1 | — | Required before P2 |
| IR (Independent Referencer) | 0 | — | Required before reference check |
| PC (Publishing Coordinator) | 0 | 2 | Optional; needed before P4 |
| AL (Acceptance Lead) | 0 | — | May be assigned for visibility |
| RO (Read-Only Stakeholder) | 0 | — | View access only |

**Validation:**
- A user may hold more than one role on the same engagement.
- The same user-role combination may not be duplicated on the same engagement.
- The selected user must be an active account.
- Only an EM or AD may add team members.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Duplicate user-role assignment | 409 | `ASSIGNMENT_DUPLICATE` | "This user already holds this role on the engagement." |
| User not active | 422 | `VALIDATION_ERROR` | "Selected user is not an active account." |
| Invalid role code | 422 | `VALIDATION_ERROR` | "Role must be one of: AL, EM, AN, QA, IR, PC, RO." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Engagement Managers may manage team assignments." |

---

### F05.2 Remove Team Members

**Roles permitted:** EM, AD

**Process:**
1. EM clicks Remove next to a team member.
2. System checks that removing the member does not violate minimum role requirements (e.g., cannot remove last EM).
3. System soft-deletes the `TeamAssignment` record (sets `removed_at`).
4. System writes audit event `TEAM_MEMBER_REMOVED`.

**Validation:**
- Cannot remove the last EM on an engagement.
- Cannot remove a QA Reviewer if P2 has not yet been approved (they are needed for the decision).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Removing last EM | 409 | `TEAM_MIN_VIOLATED` | "Cannot remove the last Engagement Manager from the team." |

---

### F05.3 Set Milestone Dates

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to `/engagements/{id}/team` (milestone section).
2. EM enters or updates target dates for each milestone.
3. System validates dates.
4. System saves the milestone dates.
5. System writes audit event `MILESTONES_UPDATED`.

**Milestone definitions:**

| Milestone Key | Label | Notes |
|---|---|---|
| `planning_approval_target` | Planning Approval (P2) Target | Target date for Gate P2 approval |
| `evidence_readiness_target` | Evidence Readiness (P3) Target | Target date for Gate P3 approval |
| `draft_readiness_target` | Draft Readiness Target | Target date for draft product ready for review |
| `final_readiness_target` | Final Readiness (P4) Target | Target date for Gate P4 approval |

**Inputs:**
- Each milestone date: `date` field in `YYYY-MM-DD` format; nullable (not yet set = Not Started)

**Validation:**
- Milestone dates must be valid dates.
- `evidence_readiness_target` must be on or after `planning_approval_target` if both are set.
- `draft_readiness_target` must be on or after `evidence_readiness_target` if both are set.
- `final_readiness_target` must be on or after `draft_readiness_target` if both are set.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Invalid date format | 422 | `VALIDATION_ERROR` | "Date must be in YYYY-MM-DD format." |
| Date ordering violation | 422 | `VALIDATION_ERROR` | "Milestone dates must be in chronological order." |

---

### F05.4 View Milestone Status

**Milestone status is computed as follows:**

| Status | Condition |
|---|---|
| `not_started` | Target date is null |
| `on_track` | Target date is in the future and the associated gate has not passed |
| `at_risk` | Target date is within 7 days and the associated gate has not passed |
| `complete` | Associated gate has been approved |
| `overdue` | Target date is in the past and the associated gate has not passed |

The milestone status is displayed on the Engagement Shell (F04) and the Engagement Detail Dashboard (F15). Status is read-only (computed); the status field cannot be manually set by users except for milestones with no associated gate (computed by EM judgment, stored separately as `milestone_manual_status`).

---

**API Surface (F05):** see `Y1-api.md` §Team and §Milestones.  
**Schema Surface (F05):** uses tables `team_assignments`, `milestones` — see `Y0-schema.md` §Team.
