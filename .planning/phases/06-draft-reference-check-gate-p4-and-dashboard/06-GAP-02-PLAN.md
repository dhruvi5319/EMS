---
phase: 06-draft-reference-check-gate-p4-and-dashboard
plan: GAP-02
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/EngagementShellPage.tsx
  - frontend/src/pages/PortfolioDashboardPage.tsx
autonomous: true
gap_closure: true

features:
  implements: ["F13", "F14"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Gate P4 review page is reachable from the Engagement Shell (via a tab or link)"
    - "Portfolio Dashboard shows an Export CSV button for users who are not exclusively IR (all other roles including admin can export)"
  artifacts:
    - path: "frontend/src/pages/EngagementShellPage.tsx"
      provides: "Gate P4 tab in the tab array navigating to /engagements/:id/gates/p4"
      contains: "gate-p4"
    - path: "frontend/src/pages/PortfolioDashboardPage.tsx"
      provides: "canExport allowlist using roles.some() instead of !roles.includes('IR')"
      contains: "roles?.some"
  key_links:
    - from: "EngagementShellPage tab array"
      to: "/engagements/:id/gates/p4 route"
      via: "react-router Link or tab navigation"
      pattern: "gate-p4|gates/p4"
    - from: "PortfolioDashboardPage canExport"
      to: "Export CSV button render"
      via: "canExport boolean guard"
      pattern: "canExport.*some\\|some.*canExport"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/pages/EngagementShellPage.tsx"
      exports: ["EngagementShellPage"]
      shape: "Tab array includes { value: 'gate-p4', label: 'Gate P4' } entry; TabsContent renders GateP4ReviewPage or navigates to /engagements/:id/gates/p4"
      verify: "grep -n 'gate-p4\\|Gate P4' frontend/src/pages/EngagementShellPage.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/pages/PortfolioDashboardPage.tsx"
      exports: ["PortfolioDashboardPage"]
      shape: "canExport uses allowlist: user?.roles?.some(r => ['AD','EM','AN','QA','AL','PC','RO'].includes(r)) ?? false"
      verify: "grep -n 'roles.*some\\|some.*roles' frontend/src/pages/PortfolioDashboardPage.tsx && echo CONTRACT_OK"
---

<objective>
Fix two UAT-reported navigation and access control issues in Phase 6.

**Gap 3 (UAT Test 10):** There is no way to navigate to the Gate P4 review page from the Engagement Shell. The route `/engagements/:id/gates/p4` is registered in `App.tsx` and `GateP4ReviewPage` exists, but no tab or link in `EngagementShellPage.tsx` points to it. The tab array has 8 entries (overview, team, planning, evidence, findings, draft, gate-history, audit) — `gate-p4` is missing. The `GateStatusCard` for P4 is display-only with no navigation.

**Fix:** Add a "Gate P4" tab to the `EngagementShellPage.tsx` tab array. Since `GateP4ReviewPage` is a full page at its own route (not a panel component like `DraftProductPage`), the tab should use `react-router-dom`'s `useNavigate` to navigate to `/engagements/${id}/gates/p4` when clicked, OR embed the page directly in a `TabsContent`. The simpler and more consistent approach is to add the tab to the array and use `TabsContent` with `<GateP4ReviewPage>` inlined — but since `GateP4ReviewPage` is a standalone route page (not designed as a panel), the cleanest fix is to render a `<Link>` button inside the tab content that says "Open Gate P4 Review" and navigates to the route. However, the best UX is to make the tab itself navigate — use `onClick` on the `TabsTrigger` to call `navigate('/engagements/${id}/gates/p4')` instead of switching tab content. This matches how the existing Draft Product "Proceed to Gate P4 →" button already works.

Add the tab as the 7th tab (after "Draft Product", before "Gate History") so the gate lifecycle tabs stay together.

**Gap 4 (UAT Test 13):** The Portfolio Dashboard "Export CSV" button is hidden for the admin user because `canExport = !user?.roles?.includes('IR')`. The admin seed grants all roles including `IR`, so the expression evaluates to `false` even though admin should always have export access.

**Fix:** Replace the blocklist logic with an allowlist: `const canExport = user?.roles?.some(r => ['AD','EM','AN','QA','AL','PC','RO'].includes(r)) ?? false`. This includes all roles except `IR`, and an admin (who has `AD`) will always satisfy the condition regardless of what other roles are present.

Purpose: Unblock UAT Tests 10, 11 (Gate P4 navigation was the blocker for all P4 tests) and fix Test 13 (CSV export).

Output: Fixed `EngagementShellPage.tsx` (Gate P4 tab), fixed `PortfolioDashboardPage.tsx` (canExport allowlist).
</objective>

<feature_dependencies>
Implements: F13: Gate P4 page accessible via Engagement Shell navigation, F14: Portfolio Dashboard CSV export visible to all non-IR roles including admin
Depends on: None (fixes to existing Phase 6 code)
Enables: None (UAT re-test of Tests 10, 11, 13)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/06-draft-reference-check-gate-p4-and-dashboard/06-07-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Gate P4 tab to EngagementShellPage</name>
  <files>frontend/src/pages/EngagementShellPage.tsx</files>
  <action>
In `frontend/src/pages/EngagementShellPage.tsx`, add a "Gate P4" tab to the shell so users can navigate to the Gate P4 review page.

**Step 1: Add import for GateP4ReviewPage (if not already imported)**

Check if `GateP4ReviewPage` is already imported. If not, add:
```tsx
import GateP4ReviewPage from '@/pages/engagements/GateP4ReviewPage';
```

Note: `GateP4ReviewPage` uses `useParams()` internally to get the engagement ID, so it can be embedded directly inside a `TabsContent` without needing to pass any props.

**Step 2: Add tab to the tab array**

The current tab array (around line 273) is:
```tsx
[
  { value: 'overview', label: 'Overview' },
  { value: 'team', label: 'Team' },
  { value: 'planning', label: 'Planning Record' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'findings', label: 'Findings' },
  { value: 'draft', label: 'Draft Product' },
  { value: 'gate-history', label: 'Gate History' },
  { value: 'audit', label: 'Audit Trail' },
]
```

Add a new entry after `{ value: 'draft', label: 'Draft Product' }`:
```tsx
{ value: 'gate-p4', label: 'Gate P4' },
```

The array becomes:
```tsx
[
  { value: 'overview', label: 'Overview' },
  { value: 'team', label: 'Team' },
  { value: 'planning', label: 'Planning Record' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'findings', label: 'Findings' },
  { value: 'draft', label: 'Draft Product' },
  { value: 'gate-p4', label: 'Gate P4' },
  { value: 'gate-history', label: 'Gate History' },
  { value: 'audit', label: 'Audit Trail' },
]
```

**Step 3: Add TabsContent for gate-p4**

After the `<TabsContent value="draft">` block (around line 332), add:
```tsx
<TabsContent value="gate-p4">
  <GateP4ReviewPage />
</TabsContent>
```

Insert it before `<TabsContent value="gate-history">`.

**Why embed vs navigate:** `GateP4ReviewPage` uses `useParams()` to get the engagement ID from the URL (e.g., `/engagements/:id/gates/p4`). When rendered inside a `TabsContent` at `/engagements/:id`, the `:id` param is still available from the parent route, so `useParams()` will correctly return the engagement ID. This avoids a navigation away from the shell, keeping the tabbed UX consistent with all other tabs. Check the `GateP4ReviewPage` source — if it uses `useParams()` it works in-place; if it reads from a non-existent route context, use `navigate` approach instead (but `useParams` is the expected pattern per Phase 6 plan 07 SUMMARY).
  </action>
  <verify>
```bash
grep -n "gate-p4\|Gate P4\|GateP4ReviewPage" frontend/src/pages/EngagementShellPage.tsx
npx tsc --noEmit -p frontend/tsconfig.json 2>&1 | tail -5 && echo "FRONTEND TS OK"
```
  </verify>
  <done>
- `EngagementShellPage.tsx` tab array includes `{ value: 'gate-p4', label: 'Gate P4' }`
- A `<TabsContent value="gate-p4">` block renders `<GateP4ReviewPage />` (or equivalent navigation)
- TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix canExport allowlist in PortfolioDashboardPage</name>
  <files>frontend/src/pages/PortfolioDashboardPage.tsx</files>
  <action>
In `frontend/src/pages/PortfolioDashboardPage.tsx`, find the `canExport` variable (around line 34):

```typescript
// IR role cannot see Export button
const canExport = !user?.roles?.includes('IR');
```

Replace it with an allowlist that grants export access to any user who has at least one non-IR role (AD, EM, AN, QA, AL, PC, or RO):

```typescript
// Export button visible for all roles except pure IR-only users
// Use allowlist so admin (who holds all roles including IR) still gets access
const canExport = user?.roles?.some(r => ['AD', 'EM', 'AN', 'QA', 'AL', 'PC', 'RO'].includes(r)) ?? false;
```

Also update the comment on the nearby JSX (around line 151) from:
```tsx
{/* Export CSV button — hidden for IR role */}
```
to:
```tsx
{/* Export CSV button — visible for AD/EM/AN/QA/AL/PC/RO; hidden if user only has IR role */}
```

**Why:** The original blocklist `!roles.includes('IR')` fails for any user who has `IR` combined with other roles (e.g., admin seeded with all roles). An allowlist checking for at least one export-eligible role is robust — only a pure IR-only user will have `canExport = false`, which is the intended behavior (IRs should not export the full portfolio register).
  </action>
  <verify>
```bash
grep -n "canExport\|roles.*some\|some.*roles" frontend/src/pages/PortfolioDashboardPage.tsx
npx tsc --noEmit -p frontend/tsconfig.json 2>&1 | tail -5 && echo "FRONTEND TS OK"
```
  </verify>
  <done>
- `canExport` uses `user?.roles?.some(r => ['AD','EM','AN','QA','AL','PC','RO'].includes(r)) ?? false`
- The old `!user?.roles?.includes('IR')` expression is removed
- TypeScript compiles cleanly
- An admin user (who holds all roles including IR) now sees the Export CSV button
  </done>
</task>

</tasks>

<verification>
```bash
# Gate P4 tab present
grep -n "gate-p4\|Gate P4" frontend/src/pages/EngagementShellPage.tsx

# canExport allowlist present
grep -n "canExport\|roles.*some" frontend/src/pages/PortfolioDashboardPage.tsx

# Full frontend compile
npx tsc --noEmit -p frontend/tsconfig.json 2>&1 | tail -10 && echo "TS CLEAN"
```
</verification>

<success_criteria>
1. The Engagement Shell tab bar includes a "Gate P4" tab that renders the Gate P4 review page content
2. Navigating to the Gate P4 tab shows the prerequisites checklist, reference summary, and P4 decision panel
3. Admin user (with all roles) sees the "Export CSV" button on the Portfolio Dashboard
4. A pure IR-only user (no other roles) does NOT see the Export CSV button
5. TypeScript compiles cleanly on frontend
</success_criteria>

<output>
After completion, create `.planning/phases/06-draft-reference-check-gate-p4-and-dashboard/06-GAP-02-SUMMARY.md`
</output>
