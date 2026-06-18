---
phase: 04-engagement-setup-and-gate-p2
plan: GAP-04
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/engagements/AddMemberForm.tsx
autonomous: true
gap_closure: true

features:
  implements: ["F5"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Clicking a user in the Add Member dropdown commits the selection (user name appears in trigger button)"
  artifacts:
    - path: "frontend/src/components/engagements/AddMemberForm.tsx"
      provides: "CommandItem with onMouseDown={(e) => e.preventDefault()} on each search result item"
      contains: "onMouseDown"
  key_links:
    - from: "CommandItem (user result)"
      to: "onSelect handler"
      via: "onMouseDown prevents focus loss before click fires"
      pattern: "onMouseDown.*preventDefault"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/components/engagements/AddMemberForm.tsx"
      exports: ["AddMemberForm"]
      shape: "CommandItem has onMouseDown={(e) => e.preventDefault()} on all user search results"
      verify: "grep -n 'onMouseDown' frontend/src/components/engagements/AddMemberForm.tsx && echo CONTRACT_OK"
---

<objective>
Fix the Add Member dropdown so that clicking a user in the search results commits the selection.

Purpose: The cmdk v1 + Radix Popover combination has a known focus-loss race condition: on mousedown the browser shifts focus away from CommandInput, triggering a cmdk re-render that clears internal state before the click event fires. Adding `onMouseDown={(e) => e.preventDefault()}` to each CommandItem prevents the browser from stealing focus, ensuring the click event dispatches normally and `onSelect` fires.

Output: `AddMemberForm.tsx` with `onMouseDown` on all CommandItems in the user results list.
</objective>

<feature_dependencies>
Implements: F5: Team assignments — user can be selected and added to team
Depends on: None
Enables: None (unblocks full Gate P2 workflow UAT Test 4)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/phases/04-engagement-setup-and-gate-p2/04-GAP-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add onMouseDown preventDefault to CommandItem in AddMemberForm</name>
  <files>frontend/src/components/engagements/AddMemberForm.tsx</files>
  <action>
In `frontend/src/components/engagements/AddMemberForm.tsx`, locate the `CommandItem` element inside the `users.map(...)` block (currently at line ~131). Add `onMouseDown={(e) => e.preventDefault()}` as a prop on the `CommandItem`.

The fix is a single prop addition. The CommandItem currently looks like:

```tsx
<CommandItem
  key={user.id}
  value={user.id}
  onSelect={() => {
    setSelectedUser(user);
    setOpen(false);
  }}
>
```

Change it to:

```tsx
<CommandItem
  key={user.id}
  value={user.id}
  onMouseDown={(e) => e.preventDefault()}
  onSelect={() => {
    setSelectedUser(user);
    setOpen(false);
  }}
>
```

This is the canonical fix for cmdk v1 + Radix Popover: `e.preventDefault()` on mousedown stops the browser from moving focus away from CommandInput before the click event fires, preventing the cmdk re-render race that swallows the `onSelect` callback.

No other changes to the file.
  </action>
  <verify>
```bash
grep -n 'onMouseDown' frontend/src/components/engagements/AddMemberForm.tsx && echo "FIX PRESENT"
```
Expected output: a line showing `onMouseDown={(e) => e.preventDefault()}` followed by `FIX PRESENT`.
  </verify>
  <done>
`AddMemberForm.tsx` contains `onMouseDown={(e) => e.preventDefault()}` on the `CommandItem` inside `users.map(...)`. Clicking a user in the dropdown now commits the selection (user name appears in the trigger button).
  </done>
</task>

</tasks>

<verification>
```bash
grep -n 'onMouseDown' frontend/src/components/engagements/AddMemberForm.tsx && echo "VERIFIED"
```
</verification>

<success_criteria>
- `AddMemberForm.tsx` has `onMouseDown={(e) => e.preventDefault()}` on the `CommandItem` in the user search results list
- No other changes introduced
- File compiles without TypeScript errors (`cd frontend && npx tsc --noEmit 2>&1 | grep AddMemberForm || echo "No TS errors"`)
</success_criteria>

<output>
After completion, create `.planning/phases/04-engagement-setup-and-gate-p2/04-GAP-04-SUMMARY.md`
</output>
