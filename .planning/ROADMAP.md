# Roadmap: Lightweight Engagement Management System (EMS)

## Overview

The EMS delivers a complete, governed engagement lifecycle in six phases that mirror the gate progression of the system. Phases 1–2 establish the foundation (auth, data model, project scaffolding). Phases 3–4 deliver the intake-to-planning-approval path (requests, Gate A1, engagement shell, team, planning, Gate P2). Phase 5 completes the evidence and findings path (evidence registry, objective links, Gate P3). Phase 6 closes the loop with draft product, reference check, Gate P4, and the portfolio dashboard. Every v1 requirement (F0–F14) is covered.

## Phases

- [ ] **Phase 1: Foundation** - Project scaffold, Docker environment, database migrations, auth, and all core data models
- [ ] **Phase 2: Application Shell** - Authenticated web app, navigation, RBAC, search, audit trail, and user management
- [ ] **Phase 3: Intake and Gate A1** - Request intake, intake document upload, acceptance decision, and engagement shell auto-creation
- [ ] **Phase 4: Engagement Setup and Gate P2** - Engagement shell, team assignments, milestones, planning record, and planning approval
- [ ] **Phase 5: Evidence, Findings, and Gate P3** - Evidence registry, evidence-to-objective links, findings, and evidence sufficiency approval
- [ ] **Phase 6: Draft Product, Reference Check, Gate P4, and Dashboard** - Draft product, indexing, reference check, final readiness, and portfolio dashboard

## Phase Details

### Phase 1: Foundation
**Status**: passed
**Goal**: The project runs locally, the database schema exists, all core data objects are seeded, and the API boots with authentication working
**Depends on**: Nothing (first phase)
**Requirements**: F0 (partial — auth/session/user infrastructure), F1
**Success Criteria** (what must be TRUE):
  1. `docker-compose up` starts frontend, backend, database, and file storage without errors
  2. All 20 database tables are created by migrations with correct columns, indexes, and constraints
  3. A user can log in with username/password and receive a session token; the system locks accounts after 5 failed attempts
  4. All ten core data objects (Request, Engagement, Team Assignment, Planning Record, Objective, Evidence Item, Finding, Draft Product, Gate Decision, Audit Event) are accessible via the database and their fields match the PRD data model
  5. The backend API boots, health check passes, and RBAC middleware is active on all routes
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Docker + project scaffold (backend Node.js/Express/TypeScript, frontend React/Vite/Tailwind, docker-compose 4-service stack)
- [ ] 01-02-PLAN.md — Database migrations (all 20 tables with exact TechArch DDL, 11 indexes, Knex connection)
- [ ] 01-03-PLAN.md — Auth API + RBAC middleware + seed (login/logout/me endpoints, session-cookie hybrid, account lockout, requireRole middleware, admin seed)
- [ ] 01-04-PLAN.md — Login UI + app shell (React login page, AuthContext, AppShell with sidebar/topbar, Playwright E2E tests)

### Phase 2: Application Shell
**Status**: passed
**Completed**: 2026-06-05
**Goal**: Authenticated users can access the full application shell — navigation, role-filtered views, global search, audit trail, and user/role management — from any device with a browser
**Depends on**: Phase 1
**Requirements**: F0 (full — navigation, search, role assignment, audit trail view)
**Success Criteria** (what must be TRUE):
  1. An unauthenticated user is redirected to the login page; after login they reach the Dashboard
  2. Navigation shows role-filtered sections (e.g., Requests is hidden from AN role; Review Queue is hidden from RO role); direct URL access to a hidden section returns 403
  3. Global search returns matching engagements by ID, title, requester, phase, or owner within the user's access scope
  4. Admin can create a user, assign one or more roles, and the new permissions take effect on the user's next request
  5. Any authorized user can view the audit trail for an engagement, filtered by action type or date range
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — shadcn/ui initialization, CSS variable token config, Phase 1 component token migration
- [ ] 02-02-PLAN.md — Role-filtered navigation sidebar, RoleFilteredNav (6×8 matrix), ReviewQueueBadge, ForbiddenPage, RoleGuard route wrapper
- [ ] 02-03-PLAN.md — Backend APIs: search (GET /api/search), user management (GET/POST/PUT /api/users), audit trail (GET /api/engagements/:id/audit)
- [ ] 02-04-PLAN.md — Global search UI: shadcn Command overlay, debounced hook, ⌘K shortcut, keyboard navigation, Playwright E2E
- [ ] 02-05-PLAN.md — User management page: Admin-only UserTable, CreateUserDialog, EditUserRolesDialog, DeactivateUserConfirm, Playwright E2E
- [ ] 02-06-PLAN.md — Audit trail view: AuditEventCard, ActionCodeBadge, AuditTrailFilters, AuditTimeline, pagination, Playwright E2E

### Phase 3: Intake and Gate A1
**Status**: passed
**Goal**: An Engagement Acceptance Lead can create and submit a request, and either approve it (automatically creating an engagement shell with audit trail) or decline it with recorded rationale
**Depends on**: Phase 2
**Requirements**: F2, F3
**Success Criteria** (what must be TRUE):
  1. An AL can create a request record (request type, requester, topic, agency/program, due date, notes) and save it as Draft without all fields; submitting validates all required fields and blocks on missing data
  2. An AL can upload an intake document (PDF/DOCX/etc., ≤25 MB) to a draft request; uploading again replaces the previous file
  3. A submitted request appears in the Review Queue; the AL can approve it with a risk level and rationale, and the system automatically creates an Engagement record in `phase = planning` with a job code in the pattern `ENG-{YYYY}-{5-digit-seq}`
  4. The AL can decline a submitted request with rationale; no engagement is created; the request status is set to `declined`
  5. All A1 decisions (approve and decline) create an immutable Gate Decision record and an Audit Event visible on the request detail page
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md — Request backend API: CRUD, multer upload middleware, StorageProvider (local filesystem), file replace behavior
- [ ] 03-02-PLAN.md — Gate A1 backend: atomic A1 decision, engagement auto-create (ENG-YYYY-NNNNN), GateDecision + AuditEvent
- [ ] 03-03-PLAN.md — Request List page (status tabs, sortable table) + New/Edit Request Form (react-hook-form, shadcn, validation)
- [ ] 03-04-PLAN.md — Request Detail page + IntakeFileUpload component (drag-drop, progress, replace, error states)
- [ ] 03-05-PLAN.md — Gate A1 Decision Panel (RadioGroup, AlertDialog, post-approval banner) + Review Queue page

### Phase 4: Engagement Setup and Gate P2
**Status**: executing
**Goal**: An Engagement Manager can fully set up an accepted engagement — metadata, team, milestones, and planning record — and a QA Reviewer can approve the planning baseline, locking it at Gate P2
**Depends on**: Phase 3
**Requirements**: F4, F5, F6, F7
**Success Criteria** (what must be TRUE):
  1. An EM can view and edit the Engagement Shell showing job code, title, phase, status, risk level, owner, portfolio, gate status cards (A1/P2/P3/P4), open blockers, and links to all artifacts
  2. An EM can assign users to predefined roles (AL, EM, AN, QA, IR, PC, RO) and set milestone dates for planning approval, evidence readiness, draft readiness, and final readiness; milestone status (Not Started / On Track / At Risk / Complete) is computed and visible
  3. An EM or Analyst can create a planning record with one or more objectives, design approach, risk notes, data reliability notes, and independence affirmation status; the record can be saved as Draft or submitted as Ready for Review
  4. Gate P2 is blocked if any prerequisite is missing (no objectives, no owner, no QA on team, no milestones, missing risk notes, missing data reliability notes, or missing independence status)
  5. When the QA Reviewer approves Gate P2, the planning record is locked; subsequent edits require a revision note; an audit event and Gate Decision record are written
**Plans**: 7 plans

Plans:
- [ ] 04-01-PLAN.md — Engagement backend API (F4): GET list, GET detail with gates+blockers, PATCH metadata
- [ ] 04-02-PLAN.md — Team + Milestones backend API (F5): team CRUD with role guards, milestone upsert + status computation, P2 prerequisites check
- [ ] 04-03-PLAN.md — Planning Record + Gate P2 backend (F6/F7): planning CRUD, objectives, independence affirmations, P2 gate decision with server-side re-validation, revision workflow
- [ ] 04-04-PLAN.md — Engagement List + Engagement Shell UI (F4): EngagementListPage, tabbed EngagementShellPage, reusable GateStatusCard, BlockerPanel, EditMetadataForm, Playwright E2E
- [ ] 04-05-PLAN.md — Team + Milestones UI (F5): TeamPanel, TeamMemberTable, AddMemberForm, MilestoneTable, MilestoneStatusChip, Playwright E2E
- [ ] 04-06-PLAN.md — Planning Record form UI (F6): ObjectiveList (Accordion), P2ReadinessChecklist, PlanningLockedBanner, PlanningRecordPanel (all 4 states), RadioGroup independence affirmation, Playwright E2E
- [ ] 04-07-PLAN.md — Gate P2 Review UI (F7): GateP2ReviewPanel, ApproveP2ConfirmDialog, ReturnP2ConfirmDialog, post-decision redirects, Playwright E2E

### Phase 5: Evidence, Findings, and Gate P3
**Goal**: Analysts can upload and manage evidence, link evidence to objectives, create findings, and a QA Reviewer can mark all objectives sufficient and approve Gate P3
**Depends on**: Phase 4
**Requirements**: F8, F9, F10
**Success Criteria** (what must be TRUE):
  1. An Analyst can add an evidence record (type, source, date received, custodian, description, sensitivity flag) and upload one or more files (≤25 MB each); evidence is listed by engagement
  2. A user can link an evidence item to one or more objectives; the system displays linked evidence under each objective and highlights objectives with no linked evidence (gap view); the evidence registry can be exported to CSV
  3. An Analyst can create a finding record and link it to one or more evidence items
  4. A QA Reviewer can mark each objective as Evidence Needed, In Review, or Sufficient; Gate P3 is blocked if any objective has no linked evidence or is marked Evidence Needed
  5. When the QA Reviewer records P3 approval, an immutable Gate Decision record and audit event are written and the engagement advances to the draft phase
**Plans**: 8 plans

Plans:
- [ ] 05-01-PLAN.md — Evidence API backend (F8): evidence CRUD, multer file upload, StorageProvider, sensitivity access control (AL/RO excluded from restricted)
- [ ] 05-02-PLAN.md — Evidence-to-objective links + coverage + sufficiency API (F9): link/unlink, coverage summary, gap data, sufficiency management
- [ ] 05-03-PLAN.md — Findings + Gate P3 API (F10): findings CRUD, P3 prerequisites check (4 conditions), Gate P3 decision (approve → engagement.phase=draft)
- [ ] 05-04-PLAN.md — Evidence Registry UI (F8): shadcn tooltip+sheet install, EvidenceListPage, EvidenceTable, AddEvidencePanel (Sheet), EvidenceFileUpload, coverage bar, CSV export
- [ ] 05-05-PLAN.md — Evidence Detail + Gap View UI (F8/F9): EvidenceDetailPage, LinkObjectivePopover, GapViewPanel, GapObjectiveCard, SufficiencyChip
- [ ] 05-06-PLAN.md — Findings List UI (F10): FindingsListPage, FindingCard, AddFindingDialog, ObjectiveSufficiencySummary, P3PrerequisitesChecklist
- [ ] 05-07-PLAN.md — Gate P3 Review UI (F10): GateP3ReviewPage, ObjectiveSufficiencyTable, SufficiencyStatusSelect, P3DecisionPanel, ApproveP3ConfirmDialog, ReturnP3ConfirmDialog
- [ ] 05-08-PLAN.md — Human verify: complete F8/F9/F10 workflow (evidence, linking, findings, Gate P3 approval)

### Phase 6: Draft Product, Reference Check, Gate P4, and Dashboard
**Goal**: The team can create and track a draft product, an Independent Referencer can check all statements against evidence, and the Publishing Coordinator can approve Gate P4, completing the engagement; the portfolio dashboard shows all engagements
**Depends on**: Phase 5
**Requirements**: F11, F12, F13, F14
**Success Criteria** (what must be TRUE):
  1. An Analyst or EM can create a draft product record (title, version, owner, status, attached file or notes, review comments) and update its status through Drafting → Under Review → Ready for Reference Check → Ready for Final Review
  2. An Analyst can add draft statement records and link each to one or more evidence items; an Independent Referencer can mark each statement as Not Started / In Review / Passed / Failed and capture discrepancy notes when Failed, assigning the discrepancy back to the Analyst
  3. Gate P4 is blocked if any reference check is In Review or Failed, or if P3 has not passed; when all checks are Passed or waived and no blockers remain, the Publishing Coordinator can record P4 approval, setting the engagement to Ready for Issuance or Closed with an audit event
  4. Any user can view the portfolio dashboard showing counts by phase and status, filters by owner/risk level/due date/phase/status, a sortable list with engagement ID/title/phase/owner/risk/next milestone/gate status, and can export the list to CSV
**Plans**: 7 plans

Plans:
- [ ] 06-01-PLAN.md — Draft product backend API (F11): CRUD, file upload/replace, append-only review comments
- [ ] 06-02-PLAN.md — Statements + reference check backend API (F12): CRUD, evidence multi-link, waiver, discrepancy assignment
- [ ] 06-03-PLAN.md — Gate P4 backend API (F13) + portfolio list/export API (F14): prerequisites, decision, engagement list, CSV export
- [ ] 06-04-PLAN.md — Draft Product UI (F11): DraftProductPage, custom DraftStatusStepper, file section, comment thread, Playwright E2E
- [ ] 06-05-PLAN.md — Statements / Indexing UI (F12 AN/EM view): StatementsPage, 5-segment progress bar, statement table, AddStatementForm, WaiveDialog, Playwright E2E
- [ ] 06-06-PLAN.md — Statement Detail UI (F12 IR + AN views): IR decision panel, discrepancy fields, AN correction view, DiscrepancyPanel, AnalystCorrectionNotice, Playwright E2E
- [ ] 06-07-PLAN.md — Gate P4 UI (F13) + Portfolio Dashboard UI (F14): prerequisites checklist, P4 decision panel, confirm dialog; stat cards, sortable register table, CSV export, Playwright E2E

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | passed | 2026-06-05 |
| 2. Application Shell | 6/6 | passed | 2026-06-05 |
| 3. Intake and Gate A1 | 0/TBD | Not started | - |
| 4. Engagement Setup and Gate P2 | 0/7 | Not started | - |
| 5. Evidence, Findings, and Gate P3 | 0/TBD | Not started | - |
| 6. Draft Product, Reference Check, Gate P4, and Dashboard | 0/7 | Not started | - |