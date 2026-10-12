# Plan: Auth state + `useUser` hook

Spec: `_specs/auth-state-user-hook.md` (branch `claude/feature/auth-state-user-hook`, already created)

## Context

The app has Firebase Auth configured (`lib/firebase.ts` exports `auth`) but nothing observes auth state. Every route needs a way to read "who is signed in" without each component subscribing itself. This adds one app-wide realtime listener (`onAuthStateChanged`) exposed through a `useUser` hook. No login/signup/logout flow, no redirects or route protection, no Firestore profile data.

Spec open questions are already answered in the spec file and are followed here:

- `useUser()` returns `{ user, loading }`. `loading` is `true` until the first `onAuthStateChanged` callback.
- `user` is a trimmed app shape `{ uid, email, displayName, photoURL }`, or `null`. Firebase's `User` does not leak into the rest of the app.
- The provider renders children immediately; consumers check `loading`.

Audit result: nothing in `components/` or `app/` reads a user today (the only hits are the splash-page comment in `app/(public)/page.tsx` and `lib/firebase.ts`). `Navbar` and `Avatar` take no user. So there is no existing call site to migrate, and I will not wire `useUser` into `Navbar` (out of scope; it would also force `Navbar` to become a client component and break its provider-less test). The splash-page redirect stays a separate feature.

## Approach

Follows the component-folder convention (`components/<Name>/` with barrel). Per CLAUDE.md, Firebase docs were checked via Context7: `onAuthStateChanged(auth, next, error?)` returns an `Unsubscribe`; `User.email`, `displayName` and `photoURL` are `string | null`.

### 1. New `components/AuthProvider/` (client)

- `AuthProvider.tsx`: `"use client"`. Holds `useState` for `{ user, loading }` (initial `{ user: null, loading: true }`). A `useEffect` with `[]` deps calls `onAuthStateChanged(auth, ...)` from `firebase/auth`, using `auth` from `@/lib/firebase`, and returns the unsubscribe (cleanup on unmount, and StrictMode/hot-reload double-mount ends up with one live subscription).
  - Success callback: map the Firebase `User` to the trimmed shape (or `null`) and set `loading: false` in the same state update (single `setState` with the object, so no render where `user` and `loading` disagree).
  - Error callback: set `{ user: null, loading: false }` so a failed session restore does not hang as loading forever.
  - Renders `<AuthContext.Provider value={state}>{children}</AuthContext.Provider>`.
- `AuthContext.ts` (or colocated in the same folder): `createContext<AuthState | null>(null)` plus the exported `AppUser` and `AuthState` types. The `null` default is what lets the hook detect "outside provider".
- `useUser.ts`: `useContext(AuthContext)`; if `null`, throw `Error("useUser must be used within an AuthProvider")`; otherwise return the context value.
- `index.ts`: barrel exporting `AuthProvider` (default), `useUser`, and the types. Import via `@/components/AuthProvider`.
- No CSS module needed (no markup).

### 2. Mount at the root

- `app/layout.tsx` stays a server component and wraps `{children}` in `<AuthProvider>` inside `<body>`. This covers both the `(public)` and `(dashboard)` groups. Pages remain server components; only client components call `useUser`.

### 3. Preview

- Add a tiny client demo to `app/(public)/preview/page.tsx` showing `loading` / signed-out / signed-in state from `useUser`, per the preview-page convention. The preview page is a server component, so the demo goes in its own small `"use client"` component (e.g. `components/UserStatus/`, with barrel). It is removable scratch UI, not a shipped feature. Any styling goes in a CSS module with `@apply` (one Tailwind class max on an element).

### 4. Tests (written first, per the `/component` workflow)

`tests/components/AuthProvider.test.tsx`, mocking `firebase/auth` (`onAuthStateChanged` as a `vi.fn` that captures the callback and returns a spy unsubscribe) and `@/lib/firebase` (stub `auth`). A tiny test consumer component renders `useUser()` output. Cases from the spec, without going heavy:

- Reports `loading` until the first auth callback fires.
- Callback with `null` gives `user === null`, `loading === false`.
- Callback with a Firebase-like user gives the trimmed `{ uid, email, displayName, photoURL }` object (extra Firebase fields are not exposed).
- A later callback (sign in then out) re-renders consumers with the new value (wrap in `act`).
- `onAuthStateChanged` is called exactly once with two consumers mounted, and the unsubscribe spy is called on unmount.
- `useUser` outside the provider throws the descriptive error (silence `console.error` in that test).
  Plus a trivial render test for the preview demo is not needed.

## Conventions to respect

- No semicolons (prettier hook uses `.prettierrc` `semi: false`); minimal dependencies (none added, `firebase` already installed); `@/` imports; barrel imports only.
- Branch is already created; do not use `git checkout`.

## Critical files

- New: `components/AuthProvider/{AuthProvider.tsx,AuthContext.ts,useUser.ts,index.ts}`, `components/UserStatus/{UserStatus.tsx,UserStatus.module.css,index.ts}`, `tests/components/AuthProvider.test.tsx`
- Edit: `app/layout.tsx`, `app/(public)/preview/page.tsx`
- Reuse: `auth` from `lib/firebase.ts`; test/mocking style from `tests/components/AuthForm.test.tsx`.

## Verification

1. `npx vitest run tests/components/AuthProvider.test.tsx` fails first, then passes after implementation; then the full `npx vitest run` is green (existing Navbar/Avatar/AuthForm tests unaffected).
2. `npm run build` passes (confirms the server/client boundary, with the provider imported into the server `layout.tsx`). `npm run lint` passes, apart from the one pre-existing unescaped `'` error in `app/(dashboard)/heists/page.tsx` noted in `_plans/auth-forms.md`.
3. `npm run dev`, open `/preview`: the demo shows "loading" briefly, then "signed out". To check realtime updates, sign a user in from the browser console or via the Firebase MCP-created test user, and confirm the demo flips to signed in without a reload, and back on sign-out; also confirm it updates from a second tab.
4. Navigate between `/login`, `/heists` and `/preview` and confirm no second subscription or flicker (user state persists across routes).

## Out of Scope

Per spec, these are explicitly NOT included:

- Login/signup/logout flow implementation
- Firebase auth integration in LoginForm/SignupForm
- Logout button or user menu
- DO not use the hook anywhere in the application yet.
