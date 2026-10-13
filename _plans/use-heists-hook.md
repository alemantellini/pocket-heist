# Plan: `useHeists` hook and `/heists` title lists

Spec: `_specs/use-heists-hook.md` (branch `claude/feature/use-heists-hook`)
On approval this plan is saved to `_plans/use-heists-hook.md` (project convention) and nothing else is implemented yet.

## Context

`/heists` shows three empty headings ("Your Active Heists", "Heists You've Assigned", "All Expired Heists") and the `heists` rules deny every read. This feature adds a real-time `useHeists(type)` hook over the `heists` collection and uses it to list only the heist titles under each heading. Per the spec's resolved questions:

- `type` is `'active' | 'assigned' | 'expired'`; the hook reads the user itself via `useUser` and returns `{ heists, loading, error }`.
- `active`: `assignedTo == uid` and `deadline > now`, soonest deadline first (deadline only, `finalStatus` is not checked).
- `assigned`: `createdBy == uid`, newest `createdAt` first, no other filters.
- `expired`: any user's heists with `deadline < now` and `finalStatus != null`, most recently expired first.
- `now` is captured once per subscription; no timer.
- Rules: any signed-in user can read heists. Indexes go in `firestore.indexes.json`. Deploying rules and indexes stays the user's call.

Deviations to flag:
- **Hook location:** there is no hooks folder yet (`useUser` lives inside `components/AuthProvider`). I propose `hooks/useHeists/useHeists.ts` plus `index.ts`, imported as `@/hooks/useHeists`.
- **Expired index direction:** the spec lists `finalStatus ASC + deadline ASC`, but the query orders `deadline DESC`, so the index needs `deadline DESC`. Firestore's error message links the exact index if I have it wrong, so check this on the first real run.

## Approach

Before writing code, check current docs via Context7 (CLAUDE.md rule) for `onSnapshot`, `query`/`where`/`orderBy`, `Timestamp.now()`, queries with multiple inequality filters (and their index requirements), and `firestore.indexes.json`.

### 1. `hooks/useHeists/useHeists.ts` (new) + `index.ts`
- `export type HeistQueryType = "active" | "assigned" | "expired"`.
- Builds the query on `collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter)` so snapshots arrive as `Heist` with `Date` fields:
  - `active`: `where("assignedTo", "==", uid)`, `where("deadline", ">", now)`, `orderBy("deadline", "asc")`.
  - `assigned`: `where("createdBy", "==", uid)`, `orderBy("createdAt", "desc")`.
  - `expired`: `where("deadline", "<", now)`, `where("finalStatus", "!=", null)`, `orderBy("deadline", "desc")`.
- Effect keyed on `[type, uid]`: returns early without subscribing when `useUser()` has no user; otherwise `onSnapshot(query, next, error)` and returns the unsubscribe as cleanup. `now = Timestamp.now()` is captured inside the effect.
- State is stored together with the key it belongs to (`{ key, heists, error }`) and `loading` is derived as `state.key !== currentKey`. That avoids resetting state synchronously inside the effect (the `react-hooks/set-state-in-effect` lint rule bit us in `HeistForm`) and prevents stale results from a previous type or user showing up.
- On a snapshot error: store the error and an empty array, `console.error` it, and set `loading` false. Results are empty and `loading: true` until the first snapshot or when there is no user.
- `finalStatus != null` only matches documents that have the field; the create form already writes `finalStatus: null` explicitly, so existing heists qualify.

### 2. `components/HeistList/` (new): `HeistList.tsx`, `HeistList.module.css`, `index.ts`
- `"use client"`; props `{ type: HeistQueryType }`; calls `useHeists(type)`.
- Renders: "Loading heists…" while `loading`; a short error line (`role="alert"`) on error; an empty message ("No active heists", "No heists assigned yet", "No expired heists") when the array is empty; otherwise a `<ul>` of titles only (`key={heist.id}`).
- Empty messages come from a small `EMPTY_MESSAGES` map keyed by type. Styling via the CSS module with `@apply` and `@reference "../../app/globals.css"`; at most one Tailwind class per element.

### 3. `app/(dashboard)/heists/page.tsx` (edit)
- Stays a server component. Keep the three wrapper divs and headings, add `<HeistList type="active" />`, `"assigned"` and `"expired"` under them, and escape the apostrophe (`You&apos;ve`) so the known lint error goes away.

### 4. `firestore.rules` (edit) and `firestore.indexes.json` (new) + `firebase.json` (edit)
- Rules: add `allow read: if request.auth != null` to `match /heists/{heistId}`; update the comment (reads open to signed-in users because the `expired` list covers everyone). Create rules unchanged; update and delete stay denied.
- Indexes (composite, collection `heists`):
  - `assignedTo` ASC, `deadline` ASC (active)
  - `createdBy` ASC, `createdAt` DESC (assigned)
  - `finalStatus` ASC, `deadline` DESC (expired)
- `firebase.json`: add `"indexes": "firestore.indexes.json"` under `firestore`.
- Validate: `npx firebase deploy --only firestore --dry-run --non-interactive` (compiled the rules without deploying last time). Do not deploy.

### 5. Tests (written first, per the `/component` workflow)
- `tests/hooks/useHeists.test.ts` (`renderHook`), mocking `firebase/firestore` (`collection`, `query`, `where`, `orderBy`, `onSnapshot`, `Timestamp`), `@/lib/firebase` and `@/components/AuthProvider` (`useUser`):
  - `active`, `assigned` and `expired` each build the expected `where`/`orderBy` calls (uid and a `now` timestamp where relevant; no user filter for `expired`).
  - Snapshot data is returned as `heists`, `loading` becomes false, and a second snapshot updates the array.
  - Unsubscribes on unmount and when `type` changes (and resubscribes with the new query).
  - No user: no `onSnapshot` call, empty array, `loading: true`.
  - Listener error: empty array, `error` set, `loading: false`, error logged.
- `tests/components/HeistList.test.tsx` mocking `@/hooks/useHeists`: renders only titles; loading, empty (per type) and error states.
- Existing `HeistForm` and auth tests are unaffected.

## Conventions
No semicolons; `@/` imports and barrels; no new dependencies; CSS modules with `@apply`; page stays a server component with the hook in a client component; Context7 consulted for the Firestore calls.

## Critical files
- New: `hooks/useHeists/{useHeists.ts,index.ts}`, `components/HeistList/{HeistList.tsx,HeistList.module.css,index.ts}`, `firestore.indexes.json`, `tests/hooks/useHeists.test.ts`, `tests/components/HeistList.test.tsx`
- Edit: `app/(dashboard)/heists/page.tsx`, `firestore.rules`, `firebase.json`
- Reuse: `heistConverter`, `COLLECTIONS`, `Heist` from `@/types/firestore`; `db` from `@/lib/firebase`; `useUser` from `@/components/AuthProvider`; mock patterns from `tests/components/HeistForm.test.tsx`.

## Verification
1. `npx vitest run`: new tests fail first, then pass; full suite green.
2. `npx tsc --noEmit` and `npm run lint` (should now be fully clean, since the apostrophe error is fixed).
3. `npx firebase deploy --only firestore --dry-run --non-interactive` to compile the rules and indexes without deploying.
4. `npm run build` with the dev server stopped (build overwrites `.next`).
5. After you deploy the rules and indexes: `npm run dev`, sign in with two accounts, create a heist from A assigned to B. B's "Your Active Heists" shows the title without a reload, A's "Heists You've Assigned" shows it, and "All Expired Heists" stays empty (a heist needs a past deadline and a final status, so seed one by hand in the console). If a list shows the error line, open the browser console, since Firestore prints a link to create any missing index.
