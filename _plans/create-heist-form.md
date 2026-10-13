# Plan: Create heist form (`/heists/create`)

Spec: `_specs/create-heist-form.md` (branch `claude/feature/create-heist-form`)
On approval this plan is also saved to `_plans/create-heist-form.md` (project convention). Plan mode only lets me write this file until then.

## Context

`/heists/create` only renders the "Create a New Heist" title. This feature adds the form: a signed-in user enters a title and description, picks another user from a list built from the `users` collection, and saves a new document to `heists`. The app fills in `createdBy`, `createdByCodename`, `createdAt` (server timestamp), `deadline` (submit time + 48h) and `finalStatus: null`, then redirects to `/heists`. No heist list/detail, editing, or notifications.

Spec answers followed (the open questions were answered in the spec file): self excluded from the list; users loaded once with `getDocs` and sorted by codename; "Loading crew…" disabled select, and an inline error with a retry button if the fetch fails; title 3–80 chars, description 1–500, trimmed, `maxLength` on inputs plus the same limits in the rules; rules are part of this work; new component following the `AuthForm` pattern.

Deviations from the spec text (flag if you disagree):
- **Component path:** `components/HeistForm/HeistForm.tsx` with `index.ts` and `HeistForm.module.css` (project convention), not `components/HeistForm.tsx`.
- **Converter on write:** `heistConverter.toFirestore` takes `Partial<Heist>` (`createdAt: Date`), which does not accept `CreateHeistInput.createdAt: FieldValue`. So the write uses a plain `collection(db, COLLECTIONS.HEISTS)` and a `CreateHeistInput`-typed object; the converter stays for the later read features.

## Approach

Before writing code, check current docs via Context7 (CLAUDE.md rule) for `addDoc`, `serverTimestamp`, `getDocs`/`collection` from `firebase/firestore`, `useRouter` from `next/navigation`, and the Firestore rules functions used below.

### 1. `types/firestore/user.ts` (new) and `types/firestore/index.ts` (edit)
- `User` interface `{ id: string; codename: string }` (matches what `lib/signup.ts` writes).
- Export it from the barrel and add `USERS: "users"` to `COLLECTIONS`. `lib/signup.ts` keeps its string literal; no unrelated refactor.

### 2. `lib/heists.ts` (new): Firestore calls kept out of the component
- `HEIST_DURATION_MS = 48 * 60 * 60 * 1000`.
- `getAssignableUsers(currentUid)`: `getDocs(collection(db, COLLECTIONS.USERS))`, map to `User`, drop the current uid and any doc without a string `codename`, sort by codename.
- `createHeist(input: { title, description, assignedTo, assignedToCodename }, creator: { uid, codename })`: builds a `CreateHeistInput` with `createdAt: serverTimestamp()`, `deadline: new Date(Date.now() + HEIST_DURATION_MS)` computed at call time (not on page load), `finalStatus: null`, then `addDoc(collection(db, COLLECTIONS.HEISTS), data)`. Explicit fields only.
- Reuse `getAuthErrorMessage` from `lib/signup.ts` for the friendly fallback ("permission-denied" already has a message, but it says "profile"; add a generic heist-specific message rather than reusing it, see below).

### 3. `components/HeistForm/` (new)
- `"use client"`; reads the user with `useUser` (`@/components/AuthProvider`) and navigates with `useRouter().push("/heists")` only after `createHeist` resolves.
- On mount: load assignable users once via `getAssignableUsers(user.uid)`; states `loading | ready | error`. Disabled select with "Loading crew…" while loading; an alert plus a "Try again" button on error; when the list is empty show "No one else has joined yet, invite a coworker first" and disable submit.
- Fields (uncontrolled inputs like `AuthForm`, so values survive a failed save): `title` input (`maxLength=80`), `description` textarea (`maxLength=500`), `assignedTo` select (placeholder option, then codenames).
- `handleSubmit`: read `FormData`, trim; validate title 3–80, description 1–500, assignee chosen; per-field inline `role="alert"` messages with `aria-invalid`/`aria-describedby` (same pattern as the signup password field). Block if `user.displayName` is null ("Your profile is still loading, try again in a moment"). Resolve `assignedToCodename` from the loaded list by the selected id.
- Pending: `pending` state disables the button and relabels it "Creating heist…"; cleared in `finally`. On failure show a form-level alert, keep values, no redirect.
- `HeistForm.module.css` (starts with `@reference "../../app/globals.css"`): `.heistForm`, `.form`, `.field` (labels, input/select/textarea styles copied in spirit from `AuthForm.module.css`), `.error`, `.retry`. Submit uses the shared `.btn`. At most one Tailwind class per element in JSX.

### 4. `app/(dashboard)/heists/create/page.tsx` (edit)
- Stays a server component: keep the existing wrappers and title, render `<HeistForm />` below it.

### 5. `firestore.rules` (edit, validate only, do not deploy)
- `users`: `allow read: if request.auth != null` (any signed-in user; docs hold only `id` and `codename`). Writes stay owner-only, unchanged.
- `heists`: `allow create` only if signed in and `request.resource.data`:
  - has exactly the keys `title, description, createdBy, createdByCodename, assignedTo, assignedToCodename, deadline, createdAt, finalStatus`;
  - `createdBy == request.auth.uid`, `assignedTo != createdBy`, both codenames strings;
  - `title` string of 3–80, `description` string of 1–500;
  - `createdAt == request.time`, `deadline` a timestamp roughly 48h ahead (bounded between 47h and 49h after `request.time`, since the client clock is not exact);
  - `finalStatus == null`.
  - `read, update, delete`: denied for now.
- Validate with the Firebase MCP `firebase_validate_security_rules`. Deploying is left to you: it replaces the live rules for the whole database.

### 6. Tests (written first, per the `/component` workflow)
- `tests/components/HeistForm.test.tsx`, mocking `firebase/firestore` (`collection`, `getDocs`, `addDoc`, `serverTimestamp`), `@/lib/firebase`, `@/components/AuthProvider` (`useUser`) and `next/navigation` (`useRouter`):
  - Lists other users' codenames, sorted, without the signed-in user; shows "Loading crew…" first.
  - Empty title / empty (or whitespace) description / no assignee shows an alert and does not call `addDoc`.
  - Valid submit calls `addDoc` with the entered title, description, assignee id and codename, the creator's uid and displayName, `finalStatus: null` and the `serverTimestamp()` value.
  - Deadline is exactly 48h after submit (`vi.useFakeTimers({ toFake: ["Date"] })` plus `vi.setSystemTime`).
  - Success pushes `/heists`; failure shows an alert, keeps typed values and does not push.
  - Submit button is disabled and relabelled while the save is pending.
  - Fetch failure shows an alert and a retry button; empty list shows the message and disables submit.
- Light `tests/lib/heists.test.ts` is optional; component tests cover `createHeist` through the mocks.

## Conventions
No semicolons; `@/` imports and barrels; no new dependencies; CSS modules with `@apply`; Context7 consulted for Firestore/Next calls. The form needs a signed-in user and Firestore, so skip the `/preview` scratch page for it and test in the real route.

## Critical files
- New: `types/firestore/user.ts`, `lib/heists.ts`, `components/HeistForm/{HeistForm.tsx,HeistForm.module.css,index.ts}`, `tests/components/HeistForm.test.tsx`
- Edit: `types/firestore/index.ts`, `app/(dashboard)/heists/create/page.tsx`, `firestore.rules`
- Reuse: `db` from `lib/firebase.ts`; `useUser` from `components/AuthProvider`; `CreateHeistInput` and `COLLECTIONS` from `types/firestore`; `.btn` in `app/globals.css`; field/error styling pattern from `components/AuthForm/AuthForm.module.css`; mock setup pattern from `tests/components/AuthForm.test.tsx`.

## Verification
1. `npx vitest run`: new tests fail first, then pass; full suite green.
2. `npx tsc --noEmit`, `npm run lint` (only the known unescaped `'` error in `app/(dashboard)/heists/page.tsx`), and `npm run build` (stop the dev server first; build overwrites `.next`).
3. Validate `firestore.rules` with the Firebase MCP rules validator.
4. `npm run dev`, sign in with two test accounts: `/heists/create` lists only the other user's codename; submitting blocks bad input with inline errors; a valid submit disables the button, then lands on `/heists`; the Firebase MCP (`firestore_get_document` / list on `heists`) shows one document with all fields, `finalStatus: null` and a deadline 48h after `createdAt`.
5. Until the rules are deployed, the live database stays in open test mode, so the rules themselves can only be checked with the validator.
