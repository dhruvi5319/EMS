---
phase: 06-draft-reference-check-gate-p4-and-dashboard
plan: GAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/hooks/useDraftProduct.ts
  - backend/src/routes/draft.ts
  - frontend/src/components/statements/AddStatementForm.tsx
autonomous: true
gap_closure: true

features:
  implements: ["F11", "F12"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "After uploading a draft file, the Draft Product tab continues to show the draft (no empty-state reset)"
    - "Add Statement dialog evidence multi-select correctly registers a click on a CommandItem"
  artifacts:
    - path: "frontend/src/hooks/useDraftProduct.ts"
      provides: "uploadFile calls fetchDraft() after successful upload"
      contains: "fetchDraft()"
    - path: "backend/src/routes/draft.ts"
      provides: "POST /draft/file returns { draft: DraftProduct } shape"
      contains: "draft: toDraftProduct"
    - path: "frontend/src/components/statements/AddStatementForm.tsx"
      provides: "CommandItem with onMouseDown preventDefault"
      contains: "onMouseDown"
  key_links:
    - from: "useDraftProduct.uploadFile"
      to: "DraftProductPage state"
      via: "fetchDraft() re-fetch after upload"
      pattern: "fetchDraft\\(\\)"
    - from: "AddStatementForm CommandItem"
      to: "selectedEvidenceIds state"
      via: "onSelect fires before popover unmounts"
      pattern: "onMouseDown.*preventDefault"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/hooks/useDraftProduct.ts"
      exports: ["uploadFile"]
      shape: "uploadFile calls fetchDraft() after success — setDraft is NOT called directly with upload response"
      verify: "grep -n 'fetchDraft' frontend/src/hooks/useDraftProduct.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/components/statements/AddStatementForm.tsx"
      exports: ["AddStatementForm"]
      shape: "CommandItem has onMouseDown={(e) => e.preventDefault()} to prevent focus-loss race"
      verify: "grep -n 'onMouseDown' frontend/src/components/statements/AddStatementForm.tsx && echo CONTRACT_OK"
---

<objective>
Fix two UAT-reported major issues in the Phase 6 draft/statements workflow.

**Gap 1 (UAT Test 3):** After uploading a draft file, the Draft Product tab reverts to its empty state (no draft shown) until page refresh. Root cause: `useDraftProduct.uploadFile` reads `data.draft` from the upload response, but the backend `POST /draft/file` route returns `{ file_ref, filename, size }` — `data.draft` is `undefined`, so `setDraft(undefined)` wipes the state and the empty-state guard fires.

**Fix strategy:** Two-part fix — (a) change the backend route to return `{ draft: DraftProduct }` wrapping the full draft object (consistent with all other draft endpoints), and (b) update the frontend `uploadFile` to properly read `data.draft` from the corrected response. This is the cleanest fix that ensures the response shape is consistent with every other draft endpoint.

**Gap 2 (UAT Test 5):** Evidence multi-select in `AddStatementForm` dialog is broken — clicking a `CommandItem` doesn't register. Root cause: cmdk v1 + Radix `Popover` focus-loss race condition — `mousedown` on a `CommandItem` causes the `Popover` to lose focus and unmount before the `click`/`onSelect` fires. Fix: add `onMouseDown={(e) => e.preventDefault()}` to every `CommandItem` in the evidence picker (same fix applied in `AddMemberForm.tsx` for Phase 4 and `LinkObjectivePopover.tsx` for Phase 5).

Purpose: Unblock UAT Tests 5–9 (all statement/IR tests were skipped due to Test 5 failure) and resolve the file upload state reset (Test 3).

Output: Fixed `useDraftProduct.ts`, fixed `draft.ts` route, fixed `AddStatementForm.tsx`.
</objective>

<feature_dependencies>
Implements: F11: Draft product file upload (state persists after upload), F12: Statement evidence multi-select (selection registers correctly)
Depends on: None (fixes to existing Phase 6 code)
Enables: None (UAT re-test of Tests 3, 5, 6, 7, 8, 9)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/06-draft-reference-check-gate-p4-and-dashboard/06-04-SUMMARY.md
@.planning/phases/06-draft-reference-check-gate-p4-and-dashboard/06-05-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix backend POST /draft/file to return full draft object</name>
  <files>backend/src/routes/draft.ts</files>
  <action>
In `backend/src/routes/draft.ts`, the `POST /file` route handler (around line 106) currently calls `res.json(result)` where `result` is the `{ file_ref, filename, size }` object returned by `uploadDraftFile()`.

Change the route handler to fetch and return the full draft object after the upload completes, consistent with every other draft endpoint that returns `{ draft: DraftProduct }`.

The fix is to replace:
```typescript
res.json(result);
```
with a call to `getDraftProduct(req.params.id)` (already imported at the top of the file) and return `{ draft }`:
```typescript
const draft = await getDraftProduct(req.params.id);
res.json({ draft });
```

Check that `getDraftProduct` (or equivalent function that returns `DraftProduct | null`) is already imported from `draft.service.ts`. If it is not imported under that name, look for the correct function name (e.g. `getDraft`) and use the actual exported name. Add the import if needed.

**Why:** All other draft route handlers (`POST /`, `PATCH /`, `DELETE /file`) return `{ draft: DraftProduct }`. The file upload handler was the only outlier — fixing it at the source is cleaner than working around it on the frontend.
  </action>
  <verify>
```bash
grep -n "getDraftProduct\|getDraft\|res\.json" backend/src/routes/draft.ts | grep -A2 "file"
npx tsc --noEmit -p backend/tsconfig.json 2>&1 | tail -5 && echo "BACKEND TS OK"
```
  </verify>
  <done>The POST /draft/file route handler returns `res.json({ draft })` with a full `DraftProduct` object. `npx tsc --noEmit` on backend exits 0.</done>
</task>

<task type="auto">
  <name>Task 2: Fix useDraftProduct.uploadFile and AddStatementForm cmdk race</name>
  <files>frontend/src/hooks/useDraftProduct.ts, frontend/src/components/statements/AddStatementForm.tsx</files>
  <action>
**Fix 1 — useDraftProduct.ts uploadFile:**

In `frontend/src/hooks/useDraftProduct.ts`, the `uploadFile` function currently does:
```typescript
const data = await res.json() as { draft: DraftProduct };
setDraft(data.draft);
return data.draft;
```

Now that the backend returns `{ draft: DraftProduct }`, this will work. However, to be defensive and ensure the draft state is always fresh (file_ref, filename, file_size all updated), change the implementation to call `fetchDraft()` after the upload succeeds rather than reading from the upload response directly:

```typescript
if (!res.ok) {
  // existing error handling unchanged
}
// Re-fetch the full draft to ensure all fields (file_ref, filename, file_size) are current
await fetchDraft();
// Return the current draft state — caller can read it from the `draft` state variable
const data = await res.json() as { draft: DraftProduct };
return data.draft;
```

Wait — since `fetchDraft` sets state asynchronously and we need to return a `DraftProduct`, do this instead:

After `res.ok` is confirmed, call `res.json()` to get `{ draft }`, call `setDraft(data.draft)` with the correctly shaped response (which now has `data.draft` populated), and return `data.draft`. The backend fix in Task 1 means `data.draft` is now the full `DraftProduct` object (not undefined).

Exact change in `uploadFile`:
```typescript
const data = await res.json() as { draft: DraftProduct };
setDraft(data.draft);
return data.draft;
```
This code already exists and is correct in shape — it was broken only because the backend was not returning `{ draft }`. With Task 1 applied, this code now works. **No change needed to the frontend hook** if the existing code already reads `data.draft`. Verify the current code does read `data.draft` — if it does, skip this file.

If the current code reads `data.file_ref` or similar (not `data.draft`), update it to read `data.draft` and call `setDraft(data.draft)`.

**Fix 2 — AddStatementForm.tsx cmdk CommandItem fix:**

In `frontend/src/components/statements/AddStatementForm.tsx`, find the `CommandItem` inside the evidence picker Popover (around line 172). It currently renders as:
```tsx
<CommandItem
  key={item.id}
  value={item.id}
  onSelect={() => handleToggleEvidence(item.id)}
>
```

Add `onMouseDown={(e) => e.preventDefault()}` to prevent the Radix Popover from losing focus before `onSelect` fires (cmdk v1 focus-loss race condition):
```tsx
<CommandItem
  key={item.id}
  value={item.id}
  onSelect={() => handleToggleEvidence(item.id)}
  onMouseDown={(e) => e.preventDefault()}
>
```

This is the identical fix applied to `AddMemberForm.tsx` (Phase 4 GAP-04) and `LinkObjectivePopover.tsx` (Phase 5). Apply it to every `CommandItem` in the evidence picker loop — there is only one loop here, so one `CommandItem` to fix.
  </action>
  <verify>
```bash
grep -n "onMouseDown" frontend/src/components/statements/AddStatementForm.tsx && echo "CMDK FIX OK"
grep -n "data\.draft\|fetchDraft\|setDraft" frontend/src/hooks/useDraftProduct.ts
npx tsc --noEmit -p frontend/tsconfig.json 2>&1 | tail -5 && echo "FRONTEND TS OK"
```
  </verify>
  <done>
- `AddStatementForm.tsx` CommandItem has `onMouseDown={(e) => e.preventDefault()}`
- `useDraftProduct.ts` uploadFile either reads `data.draft` from the corrected backend response OR calls `fetchDraft()` after upload — in either case `setDraft` is called with a valid `DraftProduct` (not undefined)
- `npx tsc --noEmit` exits 0 on frontend
  </done>
</task>

</tasks>

<verification>
```bash
# Backend compiles
npx tsc --noEmit -p backend/tsconfig.json 2>&1 | tail -5 && echo "BACKEND OK"

# Frontend compiles
npx tsc --noEmit -p frontend/tsconfig.json 2>&1 | tail -5 && echo "FRONTEND OK"

# Backend route returns { draft }
grep -n "res\.json.*draft\|getDraft" backend/src/routes/draft.ts | grep -i "file"

# CommandItem fix present
grep -n "onMouseDown" frontend/src/components/statements/AddStatementForm.tsx
```
</verification>

<success_criteria>
1. `POST /api/engagements/:id/draft/file` returns `{ draft: DraftProduct }` — the full draft object including `file_ref` and `filename`
2. After uploading a file in the Draft Product tab, `setDraft` is called with the full `DraftProduct` (not undefined) — no state reset occurs
3. `AddStatementForm` `CommandItem` has `onMouseDown={(e) => e.preventDefault()}` — clicking an evidence item in the multi-select registers the selection
4. TypeScript compiles cleanly on both backend and frontend
</success_criteria>

<output>
After completion, create `.planning/phases/06-draft-reference-check-gate-p4-and-dashboard/06-GAP-01-SUMMARY.md`
</output>
