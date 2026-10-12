# Plan: Logout button in the navbar

Spec: `_specs/logout-button.md` (branch `claude/feature/logout-button`, already created; the spec is untracked, so commit it with the work)

## Context

Signup and the global `useUser` hook exist, but nobody can sign out. Add a "Log out" button to the navbar that calls Firebase `signOut`, shown only when `useUser()` has a user. No redirects, no route protection. The spec's open questions are answered in the spec file and are followed here: button sits just left of "Create New Heist", styled as a secondary/ghost button, `LogOut` icon from `lucide-react` plus label, disabled while pending, and failures are only logged to the console (user stays signed in, button re-enabled). Figma could not be read (view-only seat), so styling follows the existing navbar tokens.

Note: there was no logout plan yet (the plan file in this session was for signup), so this is a fresh plan.

## Approach

Checked via Context7 conventions already in use: `signOut(auth)` from `firebase/auth` returns a promise; the existing `AuthProvider` (`onIdTokenChanged`) fires with `null` afterwards, so `useUser` flips and the button unmounts on its own.

### 1. New `components/LogoutButton/` (client)
- `LogoutButton.tsx`, `"use client"`. Reads `{ user, loading }` from `useUser` (`@/components/AuthProvider`). Returns `null` when `loading` or `!user`, so nothing flashes in and out.
- Otherwise returns `<li>` containing a `<button type="button">` with `<LogOut size={18} aria-hidden="true" />` and the text "Log out". It renders the `<li>` itself so no empty list item appears when logged out (it lives inside the navbar `<ul>`).
- `onClick`: set `pending`, `await signOut(auth)` (from `firebase/auth`, `auth` from `@/lib/firebase`), `catch` logs with `console.error`, `finally` clears `pending`. `disabled={pending}` blocks double clicks.
- `LogoutButton.module.css` (`@reference "../../app/globals.css"`): one `.logout` class with `@apply` for the ghost style (inline-flex, `h-10`, gap, `px-4`, `rounded-[10px]`, `text-body`, transparent background with a `border` and a hover state using theme tokens, plus a disabled rule), matching the existing `.createLink` dimensions. No more than one Tailwind class on the element.
- `index.ts`: `export { default } from "./LogoutButton"`.

### 2. Edit `components/Navbar/`
- `Navbar.tsx` stays a server component: add `<LogoutButton />` inside the `<ul>`, before the existing "Create New Heist" `<li>`.
- `Navbar.module.css`: add `.siteNav ul { @apply flex items-center gap-3; }` so the two items sit side by side. The `(dashboard)` layout is untouched.

### 3. Preview
- Add `<LogoutButton />` is not needed on `/preview` (a bare `<li>` outside a list is poor markup, and `UserStatus` already shows auth state). Skip it.

### 4. Tests (first, per the `/component` workflow)
- New `tests/components/LogoutButton.test.tsx`, mocking `firebase/auth` (`signOut`), `@/lib/firebase` (`auth: {}`) and `@/components/AuthProvider` (`useUser` as a `vi.fn`):
  - Renders a "Log out" button for a signed-in user.
  - Renders nothing when signed out, and nothing while `loading`.
  - Clicking calls `signOut` with the `auth` object.
  - The button is disabled while `signOut` is pending (unresolved promise).
  - A rejected `signOut` logs via `console.error` (spied) and the button is enabled again.
- Update `tests/components/Navbar.test.tsx`: mock `@/components/AuthProvider` (`useUser` returning `{ user: null, loading: false }`) so `LogoutButton` doesn't throw outside the provider; existing heading and link tests unchanged. Add one assertion that a signed-in mock shows "Log out" before "Create New Heist" in DOM order.

## Conventions
No semicolons; `@/` imports and barrels; icons from `lucide-react`; CSS module with `@apply`; no new dependencies.

## Critical files
- New: `components/LogoutButton/{LogoutButton.tsx,LogoutButton.module.css,index.ts}`, `tests/components/LogoutButton.test.tsx`
- Edit: `components/Navbar/Navbar.tsx`, `components/Navbar/Navbar.module.css`, `tests/components/Navbar.test.tsx`
- Reuse: `useUser` (`components/AuthProvider`), `auth` (`lib/firebase.ts`), `.createLink` sizing in `Navbar.module.css`.

## Verification
1. `npx vitest run tests/components/LogoutButton.test.tsx tests/components/Navbar.test.tsx` fail first, then pass; full `npx vitest run` green.
2. `npm run lint` (only the known `'` error in `app/(dashboard)/heists/page.tsx`) and `npm run build` pass, confirming `Navbar` and the dashboard layout stay server components.
3. `npm run dev` (it was stopped for memory, start only when you ask), sign up at `/signup`, open `/heists`: "Log out" appears left of "Create New Heist"; clicking it signs out and the button disappears without a reload or redirect; refreshing while signed out shows no button; no button flash on load while signed in.
