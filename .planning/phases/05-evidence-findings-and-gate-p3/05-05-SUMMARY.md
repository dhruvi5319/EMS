---
phase: 05-evidence-findings-and-gate-p3
plan: "05"
subsystem: evidence
tags: [react, typescript, radix-ui, shadcn, playwright, evidence-detail, gap-view, objective-linking]

# Dependency graph
requires:
  - phase: 05-01
    provides: "GET /api/engagements/:id/evidence/:evidence_id backend endpoint (added here), DELETE evidence, GET file download"
  - phase: 05-02
    provides: "POST /api/engagements/:id/evidence/:evidence_id/objectives link endpoint"
  - phase: 05-04
    provides: "SensitivityBadge, EvidenceTypeBadge, useEvidence, useEvidenceCoverage, SufficiencyChip"
provides:
  - "EvidenceDetailPage: full evidence item detail with metadata, files, linked objectives, linked findings, action buttons"
  - "EvidenceMetadataBlock: 2-column read-only field grid at ≥768px"
  - "EvidenceFileList: file rows with blob-download, file icons, upload additional"
  - "LinkedObjectivesList: CheckCircle list + LinkObjectivePopover trigger"
  - "LinkObjectivePopover: Popover+Command searchable objective selector with POST link"
  - "DeleteEvidenceButton: aria-disabled+tooltip when linked, AlertDialog when unlinked"
  - "GapViewPanel: collapsible gap view showing P3 blocker objectives with red dashed cards"
  - "GapObjectiveCard: red-100 bg + 2px dashed red-600 + role=article + Blocker indicator"
  - "GET /api/engagements/:id/evidence/:evidence_id — new backend endpoint"
  - "GET /api/engagements/:id/evidence/:evidence_id/objectives — new backend endpoint"
  - "Playwright E2E tests for evidence detail + gap view (7 tests)"
affects:
  - "05-06 (FindingsListPage consumes GapViewPanel)"
  - "05-07 (Gate P3 review panel uses GapViewPanel)"
  - "future plans consuming EvidenceDetailPage and gap view patterns"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Blob download: fetch API → createObjectURL → programmatic anchor click → revokeObjectURL"
    - "Forbidden guard: api.get result.status === 403 → render ForbiddenPage in-place"
    - "Gap view pattern: filter objectives where evidence_count=0, render red-100/dashed cards"
    - "aria-disabled for non-disabled-but-blocked buttons (delete guard)"
    - "Popover+Command searchable list for objective linking"

key-files:
  created:
    - "frontend/src/components/evidence/EvidenceDetailPage.tsx"
    - "frontend/src/components/evidence/EvidenceMetadataBlock.tsx"
    - "frontend/src/components/evidence/EvidenceFileList.tsx"
    - "frontend/src/components/evidence/LinkedObjectivesList.tsx"
    - "frontend/src/components/evidence/LinkObjectivePopover.tsx"
    - "frontend/src/components/evidence/DeleteEvidenceButton.tsx"
    - "frontend/src/components/evidence/GapViewPanel.tsx"
    - "frontend/src/components/evidence/GapObjectiveCard.tsx"
    - "frontend/e2e/evidence-detail.spec.ts"
  modified:
    - "backend/src/routes/evidence.ts"
    - "backend/src/routes/objectivecoverage.ts"
    - "backend/src/services/evidence.service.ts"
    - "backend/src/services/objectivecoverage.service.ts"
    - "frontend/src/App.tsx"

key-decisions:
  - "Added GET /evidence/:evidence_id endpoint (was missing from Plan 05-01) — needed for evidence detail page to load single item data"
  - "Added GET /evidence/:evidence_id/objectives endpoint — needed to populate linked objectives in detail page"
  - "GapObjectiveCard uses onLinkClick callback (not embedded LinkObjectivePopover) — parent context determines what evidence to link"
  - "SufficiencyChip already existed from Plan 04 — reused without modification"
  - "E2E tests written as artifacts; execution deferred to verify phase (requires running stack)"

patterns-established:
  - "Evidence detail forbidden guard: api call returns 403 → setForbidden(true) → render ForbiddenPage"
  - "Delete guard pattern: objectiveCount > 0 || findingCount > 0 → aria-disabled button with Tooltip; else AlertDialog"
  - "Gap card: role=article + aria-label with P3 blocker text for accessibility"

# Metrics
duration: 6min
completed: 2026-06-06
---

# Phase 5 Plan 05: Evidence Detail Page Summary

**EvidenceDetailPage with metadata block, file download, objective linking via Popover+Command, delete guard with aria-disabled tooltip, and GapViewPanel with red dashed P3 blocker cards for uncovered objectives**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-06T21:50:49Z
- **Completed:** 2026-06-06T21:57:03Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- EvidenceDetailPage rendering metadata block (2-column ≥768px), file list, linked objectives, linked findings, action buttons
- LinkObjectivePopover with Popover+Command searchable list and immediate POST linking with toast feedback
- DeleteEvidenceButton with aria-disabled + tooltip when linked; AlertDialog confirmation when unlinked
- GapViewPanel filtering objectives where evidence_count=0 and rendering red dashed P3 blocker cards
- Backend GET /evidence/:evidence_id and GET /evidence/:evidence_id/objectives endpoints added
- 7 Playwright E2E tests covering all key user interactions

## Task Commits

Each task was committed atomically:

1. **Task 1: EvidenceDetailPage — metadata, files, linked objectives, delete guard** - `4efdde8` (feat)
2. **Task 2: GapViewPanel + Playwright E2E tests** - `0919623` (feat)

## Files Created/Modified
- `frontend/src/components/evidence/EvidenceDetailPage.tsx` - Full evidence detail page with metadata, files, linked objectives, linked findings, action buttons, 403 forbidden guard
- `frontend/src/components/evidence/EvidenceMetadataBlock.tsx` - Two-column grid at ≥768px; 5 metadata fields (SOURCE, CUSTODIAN, DATE RECEIVED, UPLOADED BY, DESCRIPTION)
- `frontend/src/components/evidence/EvidenceFileList.tsx` - File rows with file type icons, formatted sizes, blob download trigger, upload additional button
- `frontend/src/components/evidence/LinkedObjectivesList.tsx` - CheckCircle icon list + LinkObjectivePopover trigger
- `frontend/src/components/evidence/LinkObjectivePopover.tsx` - Popover+Command searchable objective selector with POST link creation
- `frontend/src/components/evidence/DeleteEvidenceButton.tsx` - aria-disabled + Tooltip when linked; AlertDialog when unlinked
- `frontend/src/components/evidence/GapViewPanel.tsx` - Gap view showing N of M objectives with P3 blocker summary; green all-covered message
- `frontend/src/components/evidence/GapObjectiveCard.tsx` - Red-100 bg + 2px dashed red-600 border + role=article + SufficiencyChip + Blocker indicator
- `frontend/e2e/evidence-detail.spec.ts` - 7 Playwright E2E tests
- `backend/src/services/evidence.service.ts` - Added getEvidence() function
- `backend/src/routes/evidence.ts` - Added GET /:evidence_id route
- `backend/src/services/objectivecoverage.service.ts` - Added getLinkedObjectivesForEvidence() function
- `backend/src/routes/objectivecoverage.ts` - Added GET /evidence/:evidence_id/objectives route
- `frontend/src/App.tsx` - Added EvidenceDetailPage route for /engagements/:engagementId/evidence/:evidenceId

## Decisions Made
- Added GET /evidence/:evidence_id backend endpoint: Plan 05-01 had list+create but no single-item GET; EvidenceDetailPage requires it
- Added GET /evidence/:evidence_id/objectives: needed to populate linked objectives in the detail page from the database
- GapObjectiveCard delegates `[Link →]` to `onLinkClick` prop rather than embedding LinkObjectivePopover directly — parent context (EvidenceList vs. FindingsList) determines how to link
- SufficiencyChip already existed from Plan 04 (with 1px border as specified); reused without modification
- E2E tests written as artifacts; execution deferred to verify phase per test execution boundary protocol

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added GET /evidence/:evidence_id backend endpoint**
- **Found during:** Task 1 (EvidenceDetailPage implementation)
- **Issue:** Plan says "check if GET /api/engagements/:id/evidence/:evidence_id exists; if missing, add it" — it was indeed missing from evidence.ts (Plan 05-01 only implemented list+create)
- **Fix:** Added getEvidence() to evidence.service.ts with sensitivity check; added GET /:evidence_id route to evidenceRouter
- **Files modified:** backend/src/services/evidence.service.ts, backend/src/routes/evidence.ts
- **Committed in:** 4efdde8 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added GET /evidence/:evidence_id/objectives backend endpoint**
- **Found during:** Task 1 (EvidenceDetailPage needs to show which objectives are linked)
- **Issue:** No endpoint existed to fetch objectives linked to a specific evidence item; needed to populate LinkedObjectivesList
- **Fix:** Added getLinkedObjectivesForEvidence() to objectivecoverage.service.ts; added GET /evidence/:evidence_id/objectives route
- **Files modified:** backend/src/services/objectivecoverage.service.ts, backend/src/routes/objectivecoverage.ts
- **Committed in:** 4efdde8 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical/blocking backend endpoints)
**Impact on plan:** Both auto-fixes required for EvidenceDetailPage to function. No scope creep — both endpoints were called out in the plan's task description as potentially missing.

## Issues Encountered
None — plan executed as expected with the two anticipated backend additions.

## Next Phase Readiness
- EvidenceDetailPage, GapViewPanel, and LinkObjectivePopover ready for integration
- GapViewPanel consumed by Plan 05-06 (FindingsListPage shows gap indicator) and Plan 05-07 (Gate P3 review)
- LinkObjectivePopover reusable for finding-to-objective linking patterns

## Self-Check: PASSED

All key files exist on disk. Both task commits (4efdde8, 0919623) confirmed in git log.

---
*Phase: 05-evidence-findings-and-gate-p3*
*Completed: 2026-06-06*
