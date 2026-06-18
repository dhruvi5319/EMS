---
phase: 03-intake-and-gate-a1
plan: GAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/requests/RequestDetailPage.tsx
  - frontend/src/pages/requests/RequestFormPage.tsx
  - frontend/src/components/requests/GateA1DecidedCard.tsx
  - frontend/e2e/request-detail.spec.ts
  - frontend/e2e/gate-a1.spec.ts
  - backend/src/routes/gate.ts
autonomous: true
gap_closure: true

features:
  implements: ["F2", "F3"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Intake Document section shows IntakeFileUpload component (drag-drop, progress, success chip) when request is editable (draft + AL/AD role)"
    - "After Gate A1 approval, a green success banner shows the job code and View Engagement Shell link without a page reload"
    - "Gate A1 decided card shows real approver name, correct rationale, formatted date; View Gate History navigates to audit trail; View Audit Trail link on the detail page navigates to the correct engagement audit trail"
  artifacts:
    - path: "backend/src/routes/gate.ts"
      provides: "GET /api/requests/:id/gate/decision endpoint"
      exports: ["GET /:id/gate/decision"]
    - path: "frontend/src/pages/requests/RequestDetailPage.tsx"
      provides: "IntakeFileUpload wired in, approval state managed via React state not reload, audit trail link correct"
    - path: "frontend/src/components/requests/GateA1DecidedCard.tsx"
      provides: "View Gate History uses navigate() to engagement audit trail"
  key_links:
    - from: "frontend/src/pages/requests/RequestDetailPage.tsx"
      to: "frontend/src/components/requests/IntakeFileUpload.tsx"
      via: "conditional render when canEdit"
      pattern: "IntakeFileUpload"
    - from: "frontend/src/pages/requests/RequestDetailPage.tsx"
      to: "GET /api/requests/:id/gate/decision"
      via: "fetch in useEffect when status is accepted/declined"
      pattern: "gate/decision"
    - from: "frontend/src/components/requests/GateA1DecidedCard.tsx"
      to: "/engagements/:engagementId/audit"
      via: "navigate() or Link"
      pattern: "engagements.*audit"

integration_contracts:
  requires: []
  provides:
    - artifact: "backend/src/routes/gate.ts"
      exports: ["GET /:id/gate/decision"]
      shape: |
        GET /api/requests/:id/gate/decision
        Response (200): {
          gate_decision: {
            id: string,
            decision: 'approved' | 'declined',
            risk_level: string | null,
            rationale: string,
            decided_by_name: string,
            decided_at: string,
            engagement_id?: string
          }
        }
        Response (404): { error: "No gate decision found for this request" }
      verify: "grep -n 'gate/decision\\|gate_decision' backend/src/routes/gate.ts && echo CONTRACT_OK"
---

<objective>
Close three UAT failures in Phase 3 that were deferred during initial implementation:
1. IntakeFileUpload component exists but is never rendered on RequestDetailPage (Test 3)
2. Gate A1 approve flow causes blank/wrong page due to `window.location.reload()` destroying React state (Test 8)
3. Gate A1 decided card shows placeholder data, broken anchor link, and wrong audit trail URL (Test 10)

Purpose: Complete the Phase 3 UAT so the intake/Gate A1 workflow passes all 10 acceptance tests.
Output: RequestDetailPage with working file upload, correct post-approval banner, real gate decision data, and working audit trail navigation.
</objective>

<feature_dependencies>
Implements: F2: Request intake (file upload wiring), F3: Gate A1 decision display (real data, navigation)
Depends on: None (all dependencies already exist from Plans 03-01 through 03-05)
Enables: None (gap closure only)
</feature_dependencies>

<execution_context>
@.planning/phases/03-intake-and-gate-a1/03-04-SUMMARY.md
@.planning/phases/03-intake-and-gate-a1/03-05-SUMMARY.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add GET /api/requests/:id/gate/decision backend endpoint</name>
  <files>backend/src/routes/gate.ts</files>
  <action>
Add `GET /:id/gate/decision` route to `gateRouter` in `backend/src/routes/gate.ts`. This route is already mounted at `/api/requests` in `routes/index.ts`, so the full path will be `GET /api/requests/:id/gate/decision`.

Logic:
1. Authenticate via existing `gateRouter.use(authenticateSession)` middleware (already applied to all gateRouter routes).
2. Fetch the engagement linked to this request: `db('engagements').where({ request_id: requestId }).first()` — returns `undefined` if request was declined (no engagement created).
3. **Approved path** (engagement found): Query `gate_decisions` joined with `users`:
   ```sql
   db('gate_decisions as gd')
     .join('users as u', 'gd.decided_by', 'u.id')
     .where({ 'gd.engagement_id': engagement.id, 'gd.gate_type': 'A1' })
     .select('gd.*', 'u.full_name as decided_by_name')
     .first()
   ```
   Extract `risk_level` from `gd.comment` column (stored as `risk_level:low` / `risk_level:medium` / `risk_level:high` by `recordA1Decision`). Parse it: `comment?.split(':')[1] ?? null`.
   Return `{ gate_decision: { id, decision: 'approved', risk_level, rationale, decided_by_name, decided_at, engagement_id: engagement.id } }`.

4. **Declined path** (no engagement): Query `audit_events` for the decline event:
   ```sql
   db('audit_events as ae')
     .join('users as u', 'ae.actor_id', 'u.id')
     .where({ 'ae.request_id': requestId, 'ae.action': 'GATE_A1_DECLINED' })
     .select('ae.*', 'u.full_name as decided_by_name')
     .orderBy('ae.created_at', 'desc')
     .first()
   ```
   Parse `rationale` from `ae.after_state` JSONB: `JSON.parse(ae.after_state)?.rationale`.
   Return `{ gate_decision: { id: ae.id, decision: 'declined', risk_level: null, rationale, decided_by_name: ae.decided_by_name, decided_at: ae.created_at, engagement_id: null } }`.

5. If neither found, return `404 { error: "No gate decision found for this request" }`.

Error handling: wrap in try/catch, return 500 on unexpected errors.

Add this route BEFORE the existing `POST /:id/gate/a1` to ensure correct Express route ordering (though they won't conflict since methods differ).
  </action>
  <verify>
    ```bash
    cd /home/daytona/project && npx tsc --project backend/tsconfig.json --noEmit 2>&1 | grep -v "^$" | tail -20 && echo "TYPECHECK OK"
    ```
  </verify>
  <done>TypeScript compiles with no errors in backend. `grep -n "gate/decision\|gate_decision" backend/src/routes/gate.ts` shows the new GET route exists with join logic for both approved and declined paths.</done>
</task>

<task type="auto">
  <name>Task 2: Fix RequestDetailPage — wire IntakeFileUpload, fix approval reload, fix decided card data + audit trail links</name>
  <files>
    frontend/src/pages/requests/RequestDetailPage.tsx
    frontend/src/pages/requests/RequestFormPage.tsx
    frontend/src/components/requests/GateA1DecidedCard.tsx
    frontend/e2e/request-detail.spec.ts
    frontend/e2e/gate-a1.spec.ts
  </files>
  <action>
Four fixes in `RequestDetailPage.tsx`, one in `RequestFormPage.tsx`, one in `GateA1DecidedCard.tsx`. No changes to `App.tsx` are needed — all navigation uses the already-registered `/engagements/:id/audit` route which is wired in App.tsx from Plan 03-05.

### Fix A — Wire IntakeFileUpload in RequestFormPage (Gap 1 / VERIFICATION.md lines 334-336)

In `RequestFormPage.tsx`:

1. Add import at top of file: `import { IntakeFileUpload } from '@/components/requests/IntakeFileUpload';`

2. Replace the placeholder div at lines 334-336:
   ```tsx
   <div className="mt-4 mb-6 p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
     File upload component (Plan 03-04)
   </div>
   ```
   With:
   ```tsx
   {isEdit && id ? (
     <IntakeFileUpload
       requestId={id}
       existingFile={null}
       onUploadComplete={() => {}}
     />
   ) : (
     <div className="mt-4 mb-6 p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
       Save as draft first to attach intake document.
     </div>
   )}
   ```
   For "new request" mode (`!isEdit`), the placeholder note is appropriate — the user must save as draft to get an ID before uploading. For edit mode (`isEdit && id`), render `IntakeFileUpload` with the request ID. The `existingFile` prop can remain `null` here; the component itself handles fetching existing upload state via its own state.

### Fix A2 — Wire IntakeFileUpload in RequestDetailPage (Gap 1 / Test 3)

In `RequestDetailPage.tsx`:

1. Add import: `import { IntakeFileUpload } from '@/components/requests/IntakeFileUpload';`

2. Replace the Intake Document section (lines 99–122) with conditional logic:
   - When `canEdit` (status === 'draft' AND isAL): render `<IntakeFileUpload requestId={request.id} existingFile={request.file_ref && request.filename && request.file_size ? { file_ref: request.file_ref, filename: request.filename, size: request.file_size } : null} onUploadComplete={...} />`
   - `onUploadComplete` callback: update local `request` state to reflect new `file_ref`/`filename` — use `useState` override or re-fetch. Simplest: call a `refetch` function. Since `useRequest` doesn't expose `refetch`, add a local `setFileAttached` state (`useState<{ file_ref: string; filename: string; size: number } | null>(null)`) and use it to override the display. When `onUploadComplete` fires, update this state so the download link reflects the upload without a full reload.
   - When NOT canEdit AND file exists: keep existing download link display (lines 101–118).
   - When NOT canEdit AND no file: keep the "No intake document attached." text.

### Fix B — Replace `window.location.reload()` with React state (Gap 2 / Test 8)

In `RequestDetailPage.tsx`:

1. Add state: `const [approvalResult, setApprovalResult] = useState<{ jobCode: string; engagementId: string } | null>(null);`

2. Replace `onDecisionRecorded` callback:
   ```tsx
   onDecisionRecorded={(result) => {
     if (result.decision === 'approved' && result.engagement) {
       setApprovalResult({
         jobCode: result.engagement.job_code,
         engagementId: result.engagement.id,
       });
     }
     // For decline: GateA1Panel already navigates to /requests after 300ms
   }}
   ```

3. The success banner should render in the Gate A1 section when `approvalResult` is set:
   ```tsx
   {approvalResult ? (
     <div className="rounded-md bg-green-50 border border-green-200 p-4 flex items-center justify-between">
       <span className="text-green-800 text-sm">
         ✅ Engagement <span className="font-mono font-semibold">{approvalResult.jobCode}</span> created.
       </span>
       <a
         href={`/engagements/${approvalResult.engagementId}`}
         className="text-green-800 underline ml-4 text-sm"
       >
         View Engagement Shell →
       </a>
     </div>
   ) : request.status === 'submitted' && isAL ? (
     <GateA1Panel ... />
   ) : ...}
   ```
   This way the banner persists in React state without requiring a page reload.

### Fix C — Fetch real gate decision data for decided card (Gap 3 / Test 10 — sub-bug a)

In `RequestDetailPage.tsx`:

1. Add state: `const [gateDecision, setGateDecision] = useState<GateDecisionFetched | null>(null);`
   Define interface inline or at top of file:
   ```ts
   interface GateDecisionFetched {
     id: string;
     decision: 'approved' | 'declined';
     risk_level: string | null;
     rationale: string;
     decided_by_name: string;
     decided_at: string;
     engagement_id?: string | null;
   }
   ```

2. Add useEffect to fetch gate decision when status is 'accepted' or 'declined':
   ```tsx
   useEffect(() => {
     if (!request || !['accepted', 'declined'].includes(request.status)) return;
     fetch(`/api/requests/${request.id}/gate/decision`, { credentials: 'include' })
       .then(r => r.json())
       .then(data => { if (data.gate_decision) setGateDecision(data.gate_decision); })
       .catch(() => {}); // silently fail — card shows with available data
   }, [request?.id, request?.status]);
   ```

3. Replace the placeholder `GateA1DecidedCard` call (lines 155–166) with:
   ```tsx
    <GateA1DecidedCard
      decision={gateDecision ?? {
        id: 'loading',
        decision: (request.status === 'accepted' ? 'approved' : 'declined') as 'approved' | 'declined',
        risk_level: null,
        rationale: '—',
        decided_at: request.updated_at,
      }}
      engagementId={gateDecision?.engagement_id ?? undefined}
    />
   ```

### Fix D — Fix "View Gate History" button in GateA1DecidedCard (Gap 3 / Test 10 — sub-bug b)

In `GateA1DecidedCard.tsx`:

1. Add `engagementId?: string | null` to `GateA1DecidedCard` props:
   ```ts
   export function GateA1DecidedCard({ decision, engagementId }: { decision: GateDecisionData; engagementId?: string | null })
   ```

2. Replace line 60:
   ```tsx
   // OLD: <a href="#audit" className="text-xs text-blue-600 hover:underline">View Gate History →</a>
   // NEW:
   {engagementId ? (
     <a href={`/engagements/${engagementId}/audit`} className="text-xs text-blue-600 hover:underline">
       View Gate History →
     </a>
   ) : (
     <span className="text-xs text-muted-foreground">View Gate History</span>
   )}
   ```
   This navigates to the engagement audit trail when engagementId is known (approved), and shows a disabled label for declined (no engagement).

### Fix E — Fix "View Audit Trail" link on RequestDetailPage (Gap 3 / Test 10 — sub-bug c)

`/requests/:id/audit` has no route and catch-all redirects to `/login`→`/dashboard`. The engagement audit trail is at `/engagements/:engagementId/audit`.

In `RequestDetailPage.tsx`:

Replace the "View Audit Trail →" anchor (line 187–190):
```tsx
{/* Show audit trail link only after approval (engagementId known) */}
{gateDecision?.engagement_id && (
  <a
    href={`/engagements/${gateDecision.engagement_id}/audit`}
    className="text-sm text-blue-600 hover:underline ml-auto"
  >
    View Audit Trail →
  </a>
)}
```

For requests without an engagement (draft, submitted, or declined) the link is omitted — there is no engagement audit trail to navigate to. This is correct behavior.

Note: No changes to `App.tsx` are needed since we're navigating to the already-registered `/engagements/:id/audit` route.

### Fix F — Extend Playwright specs for regression coverage

In `frontend/e2e/request-detail.spec.ts`: add tests covering:
1. **IntakeFileUpload visible on draft detail page** — mock the request detail API to return a draft request, navigate to `/requests/:id`, assert the drag-drop zone element is visible (e.g. `page.getByText('Drag & drop').isVisible()` or `page.locator('[data-testid="intake-upload"]').isVisible()`).
2. **Approval banner with job code** — mock POST `/api/requests/:id/gate/a1` to return `{ decision: 'approved', engagement: { id: 'eng-1', job_code: 'ENG-2026-00001' } }`, trigger the GateA1Panel confirm action, assert the green banner contains `ENG-2026-00001` and the "View Engagement Shell →" link is visible pointing to `/engagements/eng-1`.
3. **No page reload on approval** — after mock approval, assert `page.url()` still contains `/requests/:id` (no navigation away).

In `frontend/e2e/gate-a1.spec.ts`: add tests covering:
1. **Decided card with real approver name** — mock GET `/api/requests/:id/gate/decision` to return `{ gate_decision: { id: 'gd-1', decision: 'approved', risk_level: 'medium', rationale: 'Valid rationale', decided_by_name: 'Jane Smith', decided_at: '2026-01-01T00:00:00Z', engagement_id: 'eng-1' } }`, render a detail page with `status='accepted'`, assert the card shows "Jane Smith" (not a placeholder).
2. **View Gate History navigation** — assert "View Gate History →" link href is `/engagements/eng-1/audit` (not `#audit`).
3. **Decided card for declined** — mock no engagement, assert "View Gate History" link is absent or disabled, assert no broken `#audit` anchor.

Use the existing Playwright helper patterns already in `gate-a1.spec.ts` (mock service worker or `page.route()` intercepts). Follow conventions from existing spec files in `frontend/e2e/`.
  </action>
  <verify>
    ```bash
    cd /home/daytona/project && npx tsc --project frontend/tsconfig.json --noEmit 2>&1 | grep -v "^$" | tail -20 && echo "FRONTEND TYPECHECK OK"
    npx playwright test frontend/e2e/request-detail.spec.ts frontend/e2e/gate-a1.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
    ```
  </verify>
  <done>
    - Frontend TypeScript compiles with no errors.
    - `grep -n "IntakeFileUpload" frontend/src/pages/requests/RequestFormPage.tsx` shows import and usage (isEdit && id conditional).
    - `grep -n "IntakeFileUpload" frontend/src/pages/requests/RequestDetailPage.tsx` shows import and usage.
    - `grep -n "File upload component" frontend/src/pages/requests/RequestFormPage.tsx` returns nothing (placeholder removed).
    - `grep -n "window.location.reload" frontend/src/pages/requests/RequestDetailPage.tsx` returns nothing.
    - `grep -n "approvalResult" frontend/src/pages/requests/RequestDetailPage.tsx` shows approval banner state.
    - `grep -n "gate/decision" frontend/src/pages/requests/RequestDetailPage.tsx` shows the fetch useEffect.
    - `grep -n "href=.*#audit" frontend/src/components/requests/GateA1DecidedCard.tsx` returns nothing.
    - `grep -n "engagementId" frontend/src/components/requests/GateA1DecidedCard.tsx` shows prop usage.
    - `grep -n "accepted.*approved\|status === 'accepted'" frontend/src/pages/requests/RequestDetailPage.tsx` shows corrected status mapping in fallback object.
    - Playwright test files `e2e/request-detail.spec.ts` and `e2e/gate-a1.spec.ts` exist and all tests pass (0 failing, 0 skipped).
    - Playwright tests cover: IntakeFileUpload visible on edit mode detail page, approval banner with job code, decided card with real approver name (not placeholder), View Gate History navigation to `/engagements/:id/audit`.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. Backend typecheck passes: `npx tsc --project backend/tsconfig.json --noEmit`
2. Frontend typecheck passes: `npx tsc --project frontend/tsconfig.json --noEmit`
3. New GET endpoint exists: `grep -n "gate/decision" backend/src/routes/gate.ts`
4. IntakeFileUpload wired in form page: `grep -n "IntakeFileUpload" frontend/src/pages/requests/RequestFormPage.tsx`
5. IntakeFileUpload wired in detail page: `grep -n "IntakeFileUpload" frontend/src/pages/requests/RequestDetailPage.tsx`
6. Placeholder removed: `grep -n "File upload component" frontend/src/pages/requests/RequestFormPage.tsx` returns nothing
7. No reload: `grep -rn "window.location.reload" frontend/src/pages/requests/ | wc -l` returns 0
8. No broken anchor: `grep -rn 'href="#audit"' frontend/src/components/requests/ | wc -l` returns 0
9. Status mapping corrected: `grep -n "accepted.*approved\|status === 'accepted'" frontend/src/pages/requests/RequestDetailPage.tsx` shows the ternary mapping
10. Playwright passes: `npx playwright test frontend/e2e/request-detail.spec.ts frontend/e2e/gate-a1.spec.ts --reporter=list`
</verification>

<success_criteria>
- UAT Test 3 (file upload): IntakeFileUpload renders on draft requests for AL/AD users — drag-drop zone, progress bar, success chip, replace button all functional
- UAT Test 8 (approve flow): Clicking Confirm Approve shows the success banner in-page with job code and "View Engagement Shell →" link — no blank screen, no page reload
- UAT Test 10 (decided card): Decided card shows real approver name, correct rationale, correct date; "View Gate History" navigates to `/engagements/:id/audit`; page-level "View Audit Trail" only appears after approval and navigates to the correct engagement audit trail
</success_criteria>

<output>
After completion, create `.planning/phases/03-intake-and-gate-a1/03-GAP-01-SUMMARY.md`
</output>
