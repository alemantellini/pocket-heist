# Plan: Login form wired to Firebase Auth

Spec: `_specs/login-firebase-auth.md` (branch `claude/feature/login-firebase-auth`, already created; the spec is untracked, so commit it with the work)

## Context

Signup is real now, but `/login` still only `console.log`s the entered email and password (`components/AuthForm/AuthForm.tsx`, login branch of `handleSubmit`). This wires login mode to Firebase `signInWithEmailAndPassword` (web SDK only), shows a success message on correct credentials, and a generic error otherwise. No redirect, no route protection, signup unchanged.

Spec answers followed here: the success message **replaces the form** with "Welcome back, {displayName}!" (falls back to "Welcome back!" when there is no display name), uses `role="status"` and moves focus to the message container (`tabIndex={-1}`), and stays on screen (no auto-dismiss). The form still renders regardless of auth state; the success state comes from local component state, not `useUser()`.

## Approach

Firebase call: `signInWithEmailAndPassword(auth, email, password)` from `firebase/auth` resolves a `UserCredential` whose `user.displayName` is `string | null`. Newer Firebase projects return `auth/invalid-credential` for both a wrong password and an unknown email (email enumeration protection), which fits the spec's "one generic message" requirement; `auth/wrong-password` and `auth/user-not-found` are mapped to the same text for older configurations. The existing `AuthProvider` (`onIdTokenChanged`) updates `useUser` on its own, so the navbar logout button appears with no extra code.

### 1. `lib/login.ts` (new)
- `logIn(email, password)`: calls `signInWithEmailAndPassword(auth, email, password)` and returns the signed-in user's `displayName` (`string | null`). Throws on failure. Mirrors `lib/signup.ts` (flow lives outside the component).

### 2. `lib/signup.ts` (edit): error messages
- Extend the `ERROR_MESSAGES` map used by `getAuthErrorMessage` with login codes:
  - `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found` → "Incorrect email or password" (generic, doesn't reveal which was wrong)
  - `auth/too-many-requests` → "Too many attempts, please wait a moment and try again"
  - `auth/user-disabled` → "This account has been disabled"
- `auth/invalid-email` and `auth/network-request-failed` already exist. `lib/login.ts` imports `getAuthErrorMessage` from here (no new module, no duplication).

### 3. `components/AuthForm/AuthForm.tsx` (edit)
- Add `pending` copy per mode to `COPY` ("Logging in…" / "Signing up…") and use it for the button label instead of the hardcoded "Signing up…".
- Replace the login `console.log` placeholder: for `mode === "login"`, run the same pending/error flow as signup but call `logIn`, and on success set `welcome` state (`{ name: string | null }`).
- Success view: when `welcome` is set, render only `<div role="status" tabIndex={-1} ref={...}>` with `<p>Welcome back, {name}!</p>` (or "Welcome back!") instead of the form and switch link. A `useEffect` on `welcome` focuses the container, so keyboard and screen reader users aren't left on a removed element.
- Clear `formError` at the start of each submit (already done). Signup branch and the 8-character check stay exactly as they are (signup only).
- `AuthForm.module.css`: add a `.success` class (one `@apply` rule, e.g. text colour `text-success`, centered, spacing like `.authForm`) using the existing `success` theme token. Page `app/(public)/login/page.tsx` needs no change and stays a server component.

### 4. Tests (first, per the `/component` workflow): `tests/components/AuthForm.test.tsx`
Add `signInWithEmailAndPassword` (`signIn`) to the hoisted `firebase/auth` mock. Rewrite the two login tests that depended on `console.log`, and add:
- Submitting login calls `signIn` with `{}`, the entered email and password.
- Success shows `role="status"` "Welcome back, {displayName}!", the form is gone, and focus is on the status element; with a null display name it shows "Welcome back!".
- `auth/invalid-credential` rejection shows the generic "Incorrect email or password" alert, keeps the typed email and re-enables the button.
- The button is disabled and reads "Logging in…" while pending.
- Login mode no longer calls `console.log` (spy), and doesn't enforce a minimum password length (a 5-character password is still sent to `signIn`).
- Existing signup tests unchanged and still passing.

## Conventions
No semicolons; `@/` imports; barrel imports; CSS module with `@apply`; no new dependencies; pages stay server components.

## Critical files
- New: `lib/login.ts`
- Edit: `components/AuthForm/AuthForm.tsx`, `components/AuthForm/AuthForm.module.css`, `lib/signup.ts`, `tests/components/AuthForm.test.tsx`
- Reuse: `auth` from `lib/firebase.ts`, `getAuthErrorMessage` in `lib/signup.ts`, the existing `.error` class and pending pattern in `AuthForm`.

## Verification
1. `npx vitest run tests/components/AuthForm.test.tsx` fails first for the new cases, then passes; full `npx vitest run` green.
2. `npm run lint` (only the known `'` error in `app/(dashboard)/heists/page.tsx`) and `npm run build` pass.
3. Manual, `npm run dev` (only start when asked): create an account at `/signup`, log out via the navbar button at `/heists`, then at `/login`:
   - correct credentials show "Welcome back, {codename}!" in place of the form with focus on it, no redirect, and `/heists` shows the logout button again without a reload;
   - wrong password and an unregistered email both show the same "Incorrect email or password";
   - the button shows "Logging in…" and is disabled while the request runs.
