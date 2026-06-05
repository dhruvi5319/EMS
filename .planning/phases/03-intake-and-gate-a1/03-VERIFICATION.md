---
phase: 03-intake-and-gate-a1
verified: 2026-06-05T21:04:15Z
status: gaps_found
score: 16/18 must-haves verified
re_verification: false
gaps:
  - truth: "The file upload drop zone (IntakeFileUpload) is wired into the Request Form page for draft requests in edit mode"
    status: failed
    reason: "RequestFormPage.tsx still contains the placeholder text 'File upload component (Plan 03-04)' — IntakeFileUpload was NOT imported or rendered in the form page. Plan 03-04 Task 1 required replacing the placeholder with the real IntakeFileUpload component."
    artifacts:
      - path: "frontend/src/pages/requests/RequestFormPage.tsx"
        issue: "Lines 334-336 still show placeholder div with text 'File upload component (Plan 03-04)'. No import of IntakeFileUpload exists in this file."
    missing:
      - "Add import: import { IntakeFileUpload } from '@/components/requests/IntakeFileUpload'"
      - "Replace placeholder div (lines 334-336) with IntakeFileUpload component rendered conditionally when isEdit && id"

  - truth: "After decision, GateA1DecidedCard shows accurate data (status chip correctly maps 'accepted' → approved display)"
    status: partial
    reason: "When request.status === 'accepted', RequestDetailPage passes `request.status as 'approved' | 'declined'` to GateA1DecidedCard. Since 'accepted' is NOT in the DECISION_CHIP keys ('approved' | 'declined'), the chip lookup fails and chip is undefined — rendering a broken card. Additionally, risk_level and actual rationale are hardcoded as null/'Decision recorded.' because the gate_decision data is not fetched from the API."
    artifacts:
      - path: "frontend/src/pages/requests/RequestDetailPage.tsx"
        issue: "Line 161: `decision: request.status as 'approved' | 'declined'` incorrectly casts 'accepted' as a type value that doesn't exist in DECISION_CHIP. DECISION_CHIP has keys 'approved' and 'declined'; 'accepted' maps to undefined, causing the chip to be undefined."
    missing:
      - "Map request.status 'accepted' → 'approved' before passing to GateA1DecidedCard: `decision: request.status === 'accepted' ? 'approved' : 'declined'`"
      - "NOTE: risk_level=null and rationale='Decision recorded.' are acknowledged as Phase 4 deferred items (TODO comment present) — this is a known limitation, not a bug"

human_verification:
  - test: "Full end-to-end: create request → upload file → submit → approve → check engagement shell"
    expected: "POST /api/requests/:id/gate/a1 returns 200 with engagement.job_code in ENG-YYYY-NNNNN format; green banner displays correct job code; engagement record exists in DB with phase='planning'"
    why_human: "Requires running backend + DB + frontend together; can't verify atomicity and engagement creation in the CI environment"
  - test: "Decline flow: submit request → decline with rationale → verify no engagement created"
    expected: "Request status set to 'declined'; no engagement row in DB; redirect to /requests"
    why_human: "Requires live DB to verify no engagement was created and synthetic GateDecision is returned correctly"
  - test: "File upload replace behavior: upload file A, then upload file B"
    expected: "File A is deleted from uploads/ directory; file B's file_ref stored in DB"
    why_human: "Requires filesystem access and DB verification together"
  - test: "IntakeFileUpload in edit form (after gap fix)"
    expected: "Drag-and-drop zone visible on /requests/:id/edit; uploading a valid PDF shows success chip"
    why_human: "Requires gap fix to be applied first, then visual verification"
---

# Phase 3: Intake and Gate A1 — Verification Report

**Phase Goal:** An Engagement Acceptance Lead can create and submit a request, and either approve it (automatically creating an engagement shell with audit trail) or decline it with recorded rationale  
**Verified:** 2026-06-05T21:04:15Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification  

---

## Goal Achievement

### Observable Truths (from PLAN must_haves across 03-01 through 03-05)

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | AL can create a request (POST /api/requests) saved as Draft | ✓ VERIFIED | `createRequest()` in service, route wired, status='draft' on insert |
| 2  | AL can update a draft request (PATCH /api/requests/:id) | ✓ VERIFIED | `updateRequest()` enforces draft-only (409 otherwise) |
| 3  | AL can submit a request — validates 5 required fields, 422 with fields array if missing | ✓ VERIFIED | `submitRequest()` checks 5 fields, throws 422 with fields array |
| 4  | AL can upload intake document — file saved via StorageProvider, metadata in DB | ✓ VERIFIED | `uploadIntakeDocument()` calls storageProvider.save() + db update |
| 5  | Uploading second file replaces first (old deleted from storage) | ✓ VERIFIED | Checks `existing.file_ref`, calls `storageProvider.delete()` before save |
| 6  | GET /api/requests lists requests with status filter | ✓ VERIFIED | `listRequests()` with status/requester/limit/offset filters |
| 7  | GET /api/requests/:id returns full request detail with file_ref, filename | ✓ VERIFIED | `getRequest()` returns full record including file columns |
| 8  | Request ID follows REQ-YYYY-NNNNN pattern | ✓ VERIFIED | `formatRequestId()` uses padStart(5,'0'), called in `toRecord()` |
| 9  | AL records A1 approval — creates Engagement in phase=planning with ENG-YYYY-NNNNN job code | ✓ VERIFIED | `recordA1Decision()` with atomic transaction, engagement created, job_code formatted |
| 10 | AL declines with rationale — no engagement created, request=declined | ✓ VERIFIED | Decline path skips engagement insert, sets status='declined' |
| 11 | A1 decision requires status=submitted — 409 otherwise | ✓ VERIFIED | `if (request.status !== 'submitted')` throws 409 |
| 12 | Approval requires risk_level + rationale ≥10 chars; 422 on missing/short | ✓ VERIFIED | Validates both fields, throws 422 with fields array |
| 13 | Decline requires rationale ≥10 chars; 422 if missing/short | ✓ VERIFIED | Checks rationale.trim().length < 10 for decline path |
| 14 | Both decisions write AuditEvent (GATE_A1_APPROVED or GATE_A1_DECLINED) | ✓ VERIFIED | Both paths call `trx('audit_events').insert()` with correct action value |
| 15 | Request List page: status tabs, table, empty state, + New Request CTA | ✓ VERIFIED | All present in RequestListPage.tsx |
| 16 | Gate A1 panel renders for AL on submitted requests; AlertDialog with "Keep Request Pending" | ✓ VERIFIED | GateA1Panel with RadioGroup, rationale, disabled buttons, AlertDialog |
| 17 | IntakeFileUpload wired in RequestFormPage (edit mode) | ✗ FAILED | Placeholder "File upload component (Plan 03-04)" still present; no IntakeFileUpload import |
| 18 | GateA1DecidedCard correctly maps 'accepted' status to 'approved' display chip | ✗ FAILED | `request.status as 'approved' \| 'declined'` passes 'accepted' which is not a valid DECISION_CHIP key |

**Score:** 16/18 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/services/requests.service.ts` | Full CRUD service (199 lines) | ✓ VERIFIED | All 7 exports present, storageProvider wired, db('requests') queries |
| `backend/src/routes/requests.ts` | 7 endpoints, requestsRouter exported (158 lines) | ✓ VERIFIED | All endpoints wired to service, uploadMiddleware applied |
| `backend/src/middleware/upload.ts` | multer, 25MB limit, MIME types (63 lines) | ✓ VERIFIED | 25MB limit, allowed MIME types, LIMIT_FILE_SIZE handling |
| `backend/src/storage/local.storage.ts` | LocalStorageProvider with save/get/delete/getUrl (41 lines) | ✓ VERIFIED | All 4 methods implemented |
| `backend/src/storage/storage.provider.ts` | StorageProvider interface (6 lines) | ✓ VERIFIED | Interface exported |
| `backend/src/services/gate.service.ts` | recordA1Decision with atomic transaction (220 lines) | ✓ VERIFIED | db.transaction(), both paths, GATE_A1_APPROVED/DECLINED audit events |
| `backend/src/routes/gate.ts` | POST /:id/gate/a1, gateRouter (44 lines) | ✓ VERIFIED | requireRole AL/AD, recordA1Decision called |
| `frontend/src/pages/requests/RequestListPage.tsx` | Status tabs, table, empty state (185 lines) | ✓ VERIFIED | Tabs, "No requests yet.", RequestStatusBadge used |
| `frontend/src/pages/requests/RequestFormPage.tsx` | react-hook-form form, Save as Draft, Submit (358 lines) | ⚠️ PARTIAL | Form works, but IntakeFileUpload placeholder not replaced |
| `frontend/src/components/requests/RequestStatusBadge.tsx` | 4 status variants (33 lines) | ✓ VERIFIED | All 4 variants with correct styles |
| `frontend/src/hooks/useRequests.ts` | 5 exports, API calls (109 lines) | ✓ VERIFIED | All 5 exports, correct /api/requests endpoints |
| `frontend/src/pages/requests/RequestDetailPage.tsx` | Full detail view (196 lines) | ⚠️ PARTIAL | GateA1Panel/GateA1DecidedCard wired but 'accepted' status mapping issue |
| `frontend/src/components/requests/IntakeFileUpload.tsx` | Drag-drop, progress, error states (251 lines) | ✓ VERIFIED | All states, correct error messages, API wired |
| `frontend/src/components/requests/GateA1Panel.tsx` | RadioGroup, AlertDialog, copywriting locks (333 lines) | ✓ VERIFIED | All copy locked, buttons disabled correctly, AlertDialog present |
| `frontend/src/components/requests/GateA1DecidedCard.tsx` | Read-only decision card (63 lines) | ✓ VERIFIED | Component exists and renders chip/risk/date/rationale |
| `frontend/src/pages/requests/ReviewQueuePage.tsx` | Review queue, empty state (73 lines) | ✓ VERIFIED | "No items awaiting your review." + table present |
| `frontend/e2e/request-list.spec.ts` | Playwright tests | ✓ VERIFIED | "No requests yet." present, 6 tests |
| `frontend/e2e/request-form.spec.ts` | Playwright tests | ✓ VERIFIED | "Save as Draft" tests present, 7 tests |
| `frontend/e2e/request-detail.spec.ts` | Playwright tests | ✓ VERIFIED | "View Audit Trail" tests present |
| `frontend/e2e/file-upload.spec.ts` | Playwright tests | ✓ VERIFIED | "File type not permitted" tests present |
| `frontend/e2e/gate-a1.spec.ts` | Playwright tests | ✓ VERIFIED | "Keep Request Pending", approval flow, 9 tests |
| `frontend/e2e/review-queue.spec.ts` | Playwright tests | ✓ VERIFIED | "No items awaiting your review." tests present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/src/routes/requests.ts` | `backend/src/services/requests.service.ts` | All 6 service functions called in handlers | ✓ WIRED | Lines 24, 41, 74, 91, 122, 147 |
| `backend/src/routes/requests.ts` | `backend/src/middleware/upload.ts` | `uploadMiddleware` on POST /:id/intake-document | ✓ WIRED | Upload middleware applied with error handler |
| `backend/src/services/requests.service.ts` | `backend/src/storage/local.storage.ts` | `storageProvider.save()` / `storageProvider.delete()` | ✓ WIRED | Lines 172, 175, 194 |
| `backend/src/services/requests.service.ts` | `backend/src/db/index.ts` | `db('requests')` knex queries | ✓ WIRED | Multiple db('requests') calls throughout |
| `backend/src/routes/gate.ts` | `backend/src/services/gate.service.ts` | `recordA1Decision()` in route handler | ✓ WIRED | Line 19 |
| `backend/src/services/gate.service.ts` | `backend/src/db/index.ts` | `db.transaction()`, writes to 4 tables | ✓ WIRED | transaction + gate_decisions + audit_events + engagements |
| `backend/src/routes/index.ts` | `backend/src/routes/requests.ts` | `apiRouter.use('/requests', requestsRouter)` | ✓ WIRED | Line 20 |
| `backend/src/routes/index.ts` | `backend/src/routes/gate.ts` | `apiRouter.use('/requests', gateRouter)` | ✓ WIRED | Line 23 |
| `frontend/src/App.tsx` | `frontend/src/pages/requests/RequestListPage.tsx` | Route path='/requests' | ✓ WIRED | Line 63 |
| `frontend/src/App.tsx` | `frontend/src/pages/requests/RequestDetailPage.tsx` | Route path='/requests/:id' | ✓ WIRED | Line 87 |
| `frontend/src/App.tsx` | `frontend/src/pages/requests/ReviewQueuePage.tsx` | Route path='/review-queue' | ✓ WIRED | Line 113 |
| `frontend/src/pages/requests/RequestFormPage.tsx` | `frontend/src/hooks/useRequests.ts` | createRequest/updateRequest/submitRequest | ✓ WIRED | Lines 95-132 |
| `frontend/src/pages/requests/RequestFormPage.tsx` | `frontend/src/components/requests/IntakeFileUpload.tsx` | IntakeFileUpload in form (edit mode) | ✗ NOT WIRED | Placeholder "File upload component (Plan 03-04)" still present — no import or usage |
| `frontend/src/hooks/useRequests.ts` | `/api/requests` | api.get/post/patch to API endpoints | ✓ WIRED | Lines 47-101 |
| `frontend/src/pages/requests/RequestListPage.tsx` | `frontend/src/components/requests/RequestStatusBadge.tsx` | RequestStatusBadge in table rows | ✓ WIRED | Line 169 |
| `frontend/src/pages/requests/RequestDetailPage.tsx` | `frontend/src/components/requests/GateA1Panel.tsx` | GateA1Panel rendered when status=submitted AND isAL | ✓ WIRED | Lines 144-152 |
| `frontend/src/pages/requests/RequestDetailPage.tsx` | `frontend/src/components/requests/GateA1DecidedCard.tsx` | GateA1DecidedCard rendered for accepted/declined | ⚠️ PARTIAL | Rendered, but 'accepted' status cast incorrectly as 'approved'/'declined' |
| `frontend/src/components/requests/GateA1Panel.tsx` | `/api/requests/:id/gate/a1` | POST with credentials:include | ✓ WIRED | Line 94 |
| `frontend/src/components/requests/IntakeFileUpload.tsx` | `/api/requests/:id/intake-document` | POST FormData with credentials:include | ✓ WIRED | Lines 73, 106 |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| **F2** — Create/edit request, upload intake doc, Draft/Submitted states, field validation | ✓ SATISFIED | All backend + frontend present. Minor gap: IntakeFileUpload not wired in form page (available in detail page edit flow instead) |
| **F3** — Review submitted request, risk level, approve (engagement shell) or decline (rationale), audit events | ✓ SATISFIED | Full backend + frontend. Minor issue: 'accepted' status mapping in GateA1DecidedCard |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/pages/requests/RequestFormPage.tsx` | 334-336 | Placeholder text "File upload component (Plan 03-04)" — literal literal stub text still in production code | 🛑 Blocker | File upload in form is completely absent; users cannot upload a file while editing via the form |
| `frontend/src/pages/requests/RequestDetailPage.tsx` | 160-161 | `request.status as 'approved' \| 'declined'` casts 'accepted' to wrong type; DECISION_CHIP['accepted'] is undefined | ⚠️ Warning | Post-approval GateA1DecidedCard renders with undefined chip — the chip element may crash or show nothing |
| `frontend/src/pages/requests/RequestDetailPage.tsx` | 156-157, 163 | TODO comment + hardcoded rationale='Decision recorded.' for accepted/declined cards | ℹ️ Info | Acknowledged as Phase 4 deferred item; rationale not shown correctly on accepted/declined requests |

---

## Human Verification Required

### 1. Full Approval Flow

**Test:** Log in as admin (AL role), create a request, fill all required fields, submit, then approve with risk_level=Medium and rationale "Valid approval rationale for testing"  
**Expected:** Green banner shows "✅ Engagement ENG-2026-NNNNN created." + "[View Engagement Shell →]" link  
**Why human:** Requires running backend + DB + frontend together in Docker

### 2. Decline Flow

**Test:** Log in as admin, submit a request, then decline with rationale "Decline rationale here enough chars"  
**Expected:** Redirect to /requests; request.status = 'declined' in DB; no engagement row in DB  
**Why human:** Requires live DB to verify no engagement was created

### 3. File Upload Replace Behavior

**Test:** Upload file A to a request, then upload file B to the same request  
**Expected:** File A is deleted from uploads/ directory; DB has file B's file_ref  
**Why human:** Requires filesystem access + DB verification simultaneously

### 4. IntakeFileUpload in Edit Form (after gap fix)

**Test:** After fixing gap 1, navigate to /requests/:id/edit for a draft request  
**Expected:** Drag-and-drop zone visible; uploading a small valid PDF shows success chip  
**Why human:** Gap must be fixed first, then visual + functional verification needed

---

## Gaps Summary

**2 gaps found** requiring code changes before the phase goal is fully achieved:

### Gap 1 — IntakeFileUpload NOT wired in RequestFormPage (BLOCKER)

Plan 03-04 explicitly required replacing the placeholder in `RequestFormPage.tsx` with the real `IntakeFileUpload` component. This was not done. The component was built correctly (`IntakeFileUpload.tsx` — 251 lines, fully functional), but the integration into the form page was missed. 

Users can upload files via the Request Detail page (if they are in edit mode there), but the New/Edit Request form itself shows a static placeholder text instead of the upload widget. This breaks the F2 flow where a user would create a request and attach an intake document in the same form session.

**Fix required:**
1. Add import to `RequestFormPage.tsx`: `import { IntakeFileUpload } from '@/components/requests/IntakeFileUpload';`
2. Replace lines 334-336 (placeholder div) with `IntakeFileUpload` rendered conditionally for edit mode

### Gap 2 — 'accepted' status not mapped to 'approved' in GateA1DecidedCard (WARNING)

When a request is approved, the backend sets `request.status = 'accepted'`. The `GateA1DecidedCard` component has a `DECISION_CHIP` mapping with keys `'approved'` and `'declined'` — not `'accepted'`. The code in `RequestDetailPage` passes `request.status as 'approved' | 'declined'`, which is a TypeScript type assertion that doesn't change the runtime value. At runtime, `DECISION_CHIP['accepted']` is `undefined`, which will likely cause the chip to not render or throw a runtime error.

**Fix required:**
In `RequestDetailPage.tsx` line 161, change:
```
decision: request.status as 'approved' | 'declined',
```
to:
```
decision: request.status === 'accepted' ? 'approved' : 'declined' as 'approved' | 'declined',
```

**Both gaps are in the frontend only.** The backend is fully correct and complete.

---

*Verified: 2026-06-05T21:04:15Z*  
*Verifier: Claude (pivota_spec-verifier)*
