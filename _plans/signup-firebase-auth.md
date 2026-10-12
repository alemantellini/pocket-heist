# Plan: Signup wired to Firebase Auth + `users` document

Spec: `_specs/signup-firebase-auth.md` (branch `claude/feature/signup-firebase-auth`)

## Context

`/signup` renders `AuthForm mode="signup"`, which currently only validates the password length and `console.log`s the credentials. This feature makes signup real with the Firebase web SDK only: create the Auth account, give the user a random PascalCase `displayName` (three words from three sets), and write `users/{uid}` containing only `{ id, codename }` (never the email). Login, logout, redirects and codename uniqueness are out of scope.

Spec answers followed here: keep config in `lib/firebase.ts` (`lib/firebase/config.ts` does not exist); word sets plus generator in `lib/codename.ts` (25 words per set: adjectives, materials/colours, animals); no rollback if the Firestore write fails (idempotent `setDoc`, show an error); no redirect after signup; include Firestore rules for `users`.

Assumptions made because the questions were skipped (flag if you disagree):
- **useUser and displayName.** `updateProfile` does not fire `onAuthStateChanged`, so `useUser` would keep `displayName: null` right after signup. Fix: switch `AuthProvider` to `onIdTokenChanged` and call `getIdToken(true)` after `updateProfile`, so the listener fires again with the new name.
- **Rules are edited in `firestore.rules` only, not deployed.** Deploying replaces the live test-mode rules for the whole database, so that stays your call (there are open-test rules until 2026-11-11).

## Approach

Checked via Context7: `createUserWithEmailAndPassword(auth, email, password)`, `updateProfile(user, { displayName })` from `firebase/auth`; `doc`, `setDoc` from `firebase/firestore`; Auth error codes `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, `auth/network-request-failed`. `setDoc` only resolves once the backend confirms, so it is awaited inside the signup try block (an offline user stays pending, then errors).

### 1. `lib/codename.ts` (new)
- Three exported `const` arrays of 25 unique, PascalCase-ready words (adjective, material/colour, animal). No duplicates within or across sets.
- `generateCodename()`: picks one at random from each set and joins them (e.g. `SilentCopperFox`). No dependencies.

### 2. `lib/signup.ts` (new): the signup flow, kept out of the component
- `signUp(email, password)`:
  1. `createUserWithEmailAndPassword(auth, email, password)`.
  2. `codename = generateCodename()`.
  3. `updateProfile(user, { displayName: codename })`.
  4. `setDoc(doc(db, "users", user.uid), { id: user.uid, codename })`: explicit fields only, never spread the user object, so email cannot leak.
  5. `user.getIdToken(true)` to refresh the token so the auth listener re-emits with the display name.
- Throws on any failure. No rollback (per spec); if step 3 or 4 fails the account remains and the form shows an error.
- `getAuthErrorMessage(error)`: maps `FirebaseError` codes to friendly messages, with a generic fallback (also used for Firestore failures such as `permission-denied`).

### 3. `components/AuthForm/AuthForm.tsx` (edit)
- Signup branch of `handleSubmit` becomes async: after the existing 8-character check, set `pending`, call `signUp`, show errors in a `role="alert"` message (`formError` state), and clear `pending` in `finally`.
- Submit button gets `disabled={pending}` and label "Signing up…" while pending. Typed values are kept on failure because the inputs stay uncontrolled.
- Login branch keeps the temporary `console.log` placeholder (login is out of scope). Signup no longer logs credentials.
- `AuthForm.module.css`: reuse the existing `.error` class for the form-level error; add a disabled-button rule only if the global `.btn` has none (one `@apply` rule, no multi-class strings in JSX).
- Page `app/(public)/signup/page.tsx` stays a server component and needs no change.

### 4. `components/AuthProvider/AuthProvider.tsx` (edit)
- Replace `onAuthStateChanged` with `onIdTokenChanged` (same `(auth, next, error)` signature, also fires on sign-in, sign-out and token refresh). Existing error handling and unsubscribe stay. Update the mock and assertions in `tests/components/AuthProvider.test.tsx` accordingly.

### 5. `firestore.rules` (edit, validate only)
Replace the open test-mode rule with per-user rules for `users/{uid}`:
- `read`: owner only (`request.auth.uid == uid`).
- `create`/`update`: owner only, `request.resource.data.keys().hasOnly(["id", "codename"])`, `request.resource.data.id == request.auth.uid`, `codename` a string.
- No delete. Anything else is denied.
Validate with the Firebase MCP `firebase_validate_security_rules`. Do not deploy (see assumptions). Note that the deployed rules stay open test-mode until you deploy.

### 6. Tests (first, per the `/component` workflow)
- New `tests/lib/codename.test.ts`: sets have no duplicates (within and across); `generateCodename()` matches `/^[A-Z][a-z]+[A-Z][a-z]+[A-Z][a-z]+$/` and each part comes from its own set; the pick uses `Math.random` (spy to make it deterministic).
- Update `tests/components/AuthForm.test.tsx`, mocking `firebase/auth`, `firebase/firestore` and `@/lib/firebase`:
  - Signup calls `createUserWithEmailAndPassword` with the entered email and password.
  - After it, `updateProfile` is called with a generated display name, and `setDoc` is called with exactly `{ id: uid, codename }` and no `email` key.
  - A rejected `auth/email-already-in-use` shows a readable alert and re-enables the button.
  - The submit button is disabled while the promise is pending.
  - The short-password test still blocks submission before any Firebase call.
  - Login mode still logs as before; signup mode does not call `console.log`. The two existing signup `console.log` tests are rewritten for this.
- `tests/components/AuthProvider.test.tsx` updated for `onIdTokenChanged`.

## Conventions
No semicolons; `@/` imports and barrels; no new dependencies (Firebase already installed); CSS modules with `@apply`; Context7 consulted for Firebase calls.

## Critical files
- New: `lib/codename.ts`, `lib/signup.ts`, `tests/lib/codename.test.ts`
- Edit: `components/AuthForm/AuthForm.tsx` (+ `.module.css` if needed), `components/AuthProvider/AuthProvider.tsx`, `firestore.rules`, `tests/components/AuthForm.test.tsx`, `tests/components/AuthProvider.test.tsx`
- Reuse: `auth`, `db` from `lib/firebase.ts`; `.error` class in `AuthForm.module.css`; `.btn` in `app/globals.css`.

## Verification
1. `npx vitest run`: new and updated tests fail first, then pass; full suite green.
2. `npm run lint` (only the known unescaped `'` error in `app/(dashboard)/heists/page.tsx`) and `npm run build` pass.
3. Validate `firestore.rules` with the Firebase MCP rules validator.
4. `npm run dev`, open `/signup`, create a test account: the button disables while pending; `/preview` then shows the new user with a three-word display name without a reload; the Firebase MCP (`auth_get_users`, `firestore_get_document` on `users/{uid}`) shows the account with the codename and a document holding only `id` and `codename`.
5. Sign up again with the same email to see the friendly "already in use" error and a re-enabled button.
