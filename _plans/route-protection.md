# Plan: Route protection for the (public) and (dashboard) groups

Spec: `_specs/route-protection.md` (branch `claude/feature/route-protection`, already created; the spec is untracked, so commit it with the work)

## Context

Auth state now exists (`useUser`), login/signup/logout work, but nothing stops a signed-out visitor from opening `/heists` or a signed-in user from opening `/login`. This adds client-side route protection in the two group layouts: `(dashboard)` is for signed-in users only (redirect to `/login`), `(public)` is for signed-out visitors only (redirect to `/heists`), with a simple loader shown while auth is loading or a redirect is pending, so wrong content never flashes. Server/middleware protection, `?next=` return URLs and per-role permissions are out of scope.

Spec answers followed here:
- `/preview` moves out of the public group (to `app/preview/`) so neither rule applies; the URL stays `/preview`.
- The login success message is removed (the redirect is the feedback), along with its focus/`role="status"` code; the generic login error stays.
- Signup is protected from being cut off: a `pendingSignup` flag in the auth context keeps the public layout from redirecting until the profile writes finish.
- One `AuthLoader` component (spinning clock icon used in the site title, `animate-spin motion-reduce:animate-none`, `role="status"` with a visually hidden "Loading…").
- Always redirect to `/heists`.

Deviation from the spec worth flagging: it suggests calling `auth.currentUser.reload()` after the profile writes to populate `displayName`. `AuthProvider` already listens with `onIdTokenChanged` and `signUp` already ends with `getIdToken(true)`, which re-emits the user with the new `displayName`. So no `reload()` is planned; the manual check below verifies the name is present on arrival at `/heists`. Another known gap, accepted: if the profile writes fail after the account is created, the flag is cleared and the user is still redirected (no "ensure profile exists" fallback yet).

## Approach

Per CLAUDE.md, check the Next.js docs via Context7 (`useRouter().replace` from `next/navigation`, moving a folder out of a route group) before writing code.

### 1. Auth context: `pendingSignup` (edit `components/AuthProvider/`)
- `AuthContext.ts`: extend `AuthState` with `pendingSignup: boolean` and `setPendingSignup: (value: boolean) => void`.
- `AuthProvider.tsx`: keep the listener state as is, add `useState(false)` for `pendingSignup`, and provide `{ ...state, pendingSignup, setPendingSignup }` (memoised so consumers don't re-render needlessly). `useUser` keeps returning the whole context value; existing consumers that destructure `{ user, loading }` are unaffected.

### 2. `components/AuthLoader/` (new)
- `AuthLoader.tsx`: centered, full-height wrapper containing the same lucide clock icon as the site title (`Clock8`, see `components/Navbar/Navbar.tsx` and `app/(public)/page.tsx`), `aria-hidden="true"`, spinning; the wrapper has `role="status"` with `<span className="sr-only">Loading…</span>`.
- `AuthLoader.module.css` (`@reference "../../app/globals.css"`): `.loader` (flex centre, `min-h-lvh`) and `.spinner` (`animate-spin motion-reduce:animate-none text-primary`), one rule per class, no multi-class strings in JSX.
- `index.ts` barrel.

### 3. `components/RouteGuard/` (new, client)
- `RouteGuard.tsx`, `"use client"`. Props: `require: "user" | "guest"` and `children`. Uses `useUser()` and `useRouter()` (`next/navigation`).
- Compute `allowed`:
  - `require="user"`: `!loading && !!user`.
  - `require="guest"`: `!loading && (!user || pendingSignup)`.
- `useEffect`: when `!loading` and not allowed, `router.replace(require === "user" ? "/login" : "/heists")` (history replacement, per spec).
- Render `children` only when `allowed`; otherwise `<AuthLoader />` (covers both loading and the pending redirect).
- `index.ts` barrel. One component with a prop, rather than two near-identical guards.

### 4. Layouts (stay server components)
- `app/(dashboard)/layout.tsx`: wrap in the guard so the navbar is only rendered for signed-in users:
  `<RouteGuard require="user"><Navbar /><main>{children}</main></RouteGuard>` (server `Navbar` is passed as children, which is allowed).
- `app/(public)/layout.tsx`: `<main className="public"><RouteGuard require="guest">{children}</RouteGuard></main>`.
- Pages are untouched and remain server components. Update the splash comment in `app/(public)/page.tsx` to say the redirect is now handled by the group guard.

### 5. Move the preview page
- `git mv "app/(public)/preview" app/preview` (URL unchanged, now outside both groups, still under the root layout so `AuthProvider` works for `UserStatus`).

### 6. Signup flag + remove the login success message (edit `AuthForm` and libs)
- `AuthForm.tsx`: call `useUser()` for `setPendingSignup`. In the signup branch, `setPendingSignup(true)` before `signUp(...)` and `setPendingSignup(false)` in the existing `finally` (so it clears even on failure).
- Remove the login welcome code: the `welcome` state, `welcomeRef`, the focus `useEffect`, the success view, and `.success` in `AuthForm.module.css`; the login branch becomes `await logIn(email, password)` and relies on the redirect. `lib/login.ts` no longer needs to return the display name (return nothing).

### 7. Docs
- `CLAUDE.md`: update the architecture bullets (preview now lives at `app/preview/`, splash redirect is handled by the group guard, new `RouteGuard`/`AuthLoader`).

### 8. Tests (written first, per the `/component` workflow)
Mock `@/components/AuthProvider` (`useUser`) and `next/navigation` (`useRouter` returning a `replace` spy):
- New `tests/components/RouteGuard.test.tsx`:
  - Shows the loader and no children while loading (both modes), and does not call `replace`.
  - `require="user"`, signed out: shows the loader (no children), calls `replace("/login")`.
  - `require="user"`, signed in: renders children, no redirect.
  - `require="guest"`, signed in: loader and `replace("/heists")`.
  - `require="guest"`, signed out: renders children, no redirect.
  - `require="guest"`, signed in with `pendingSignup`: renders children, no redirect.
- New `tests/components/AuthLoader.test.tsx`: renders a `role="status"` with accessible "Loading…" text; the icon is hidden from assistive tech.
- `tests/components/AuthProvider.test.tsx`: `pendingSignup` defaults to false and `setPendingSignup(true)` updates consumers.
- `tests/components/AuthForm.test.tsx`: mock `@/components/AuthProvider` for `setPendingSignup`; add assertions that signup sets it to true then false (also when signup fails); remove the two welcome-message tests (replaced by "no status message after login" is unnecessary); keep the generic error, pending and no-min-length login tests.

## Conventions
No semicolons; `@/` imports; barrel imports; CSS modules with `@apply`; `lucide-react` icon; no new dependencies; pages stay server components.

## Critical files
- New: `components/AuthLoader/{AuthLoader.tsx,AuthLoader.module.css,index.ts}`, `components/RouteGuard/{RouteGuard.tsx,index.ts}`, `tests/components/{RouteGuard,AuthLoader}.test.tsx`
- Edit: `components/AuthProvider/{AuthContext.ts,AuthProvider.tsx}`, `components/AuthForm/{AuthForm.tsx,AuthForm.module.css}`, `lib/login.ts`, `app/(dashboard)/layout.tsx`, `app/(public)/layout.tsx`, `app/(public)/page.tsx` (comment), `CLAUDE.md`, plus the three existing test files above
- Move: `app/(public)/preview` to `app/preview`
- Reuse: `useUser` (`components/AuthProvider`), the existing `finally` in `AuthForm`'s submit, `getIdToken(true)` in `lib/signup.ts`, `.center-content` look for the loader.

## Verification
1. `npx vitest run`: new tests fail first, then pass; full suite green.
2. `npm run lint` (only the known `'` error in `app/(dashboard)/heists/page.tsx`) and `npm run build` pass; the build confirms the layouts and pages are still server components and `/preview` still builds.
3. Manual with `npm run dev` (start only when asked; restart it if CSS edits stop appearing):
   - Signed out: `/heists`, `/heists/create` and `/heists/abc` land on `/login` with only the loader flashing, never dashboard content or the navbar.
   - Sign up with a new email: ends on `/heists` and the user already has a three-word display name (check `/preview`, which stays reachable); Back does not return to `/signup`.
   - Signed in: `/`, `/login`, `/signup` all land on `/heists`; `/preview` stays reachable.
   - Log out via the navbar: lands on `/login` without a reload; log in: lands on `/heists`.
   - Hard refresh while signed in on `/heists` shows the loader then the page, never `/login`.
   - With reduced-motion enabled in the OS, the loader icon doesn't spin.
