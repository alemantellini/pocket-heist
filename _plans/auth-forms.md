# Plan: Auth forms on /login and /signup

Spec: `_specs/auth-forms.md` (branch `claude/feature/auth-forms`)

## Status (updated 2026-10-11): implemented, not yet committed

Done as planned: `components/AuthForm/` (component, CSS module, barrel), `tests/components/AuthForm.test.tsx` (6 tests, written first), login/signup pages wired up (`SignupPage` export on login renamed to `LoginPage`, signup title now an `<h1>`), both forms added to `/preview`. Added `.prettierrc` (`{"semi": false}`) so the prettier hook stops inserting semicolons.

Verification results: all 14 tests pass, `npm run build` succeeds. `npm run lint` reports one pre-existing error in `app/(dashboard)/heists/page.tsx` (unescaped `'`), unrelated to this feature. Not yet checked: manual run in the browser via `npm run dev`.

Remaining: manual browser check, fix the unrelated lint error (optional), commit (`.prettierrc` as its own commit first).

## Context

`/login` and `/signup` currently render only a title. The spec adds email + password forms (with a show/hide password toggle and a submit button) to both pages, logging the submitted details to the console only, with an easy link to switch between the two. No auth backend is involved yet.

Spec open questions resolved with sensible defaults (flag if you disagree):
- One shared `AuthForm` component with a `mode` prop (`"login" | "signup"`), not two components.
- Single password field on signup (no confirm field, no password rules yet).
- Switch link sits below the form.
- Icons from `lucide-react` (`Eye` / `EyeOff`), already a dependency, so no new packages.

## Approach

### 1. New component `components/AuthForm/` (follows the `Avatar` folder convention)
- `AuthForm.tsx`: `"use client"` (needs state and an onSubmit handler; the pages stay server components).
  - Props: `mode: "login" | "signup"`.
  - Local `useState` for password visibility only; the inputs are uncontrolled and read from `FormData` on submit.
  - `onSubmit`: `preventDefault()`, then `console.log` the email and password (a comment marks it as a temporary placeholder to remove once real auth lands). Native `required` and `type="email"` provide the validation.
  - Fields: labelled email input (`type="email"`, `autoComplete="email"`), labelled password input (`type` toggles `password`/`text`, `autoComplete` is `current-password` on login and `new-password` on signup), and an icon `<button type="button">` toggle with `aria-label` "Show password"/"Hide password" and `aria-pressed`.
  - Submit button reuses the global `.btn` class, labelled "Log in" / "Sign up".
  - Switch link (Next `Link`): login shows "Don't have an account? Sign up" → `/signup`, signup shows "Already have an account? Log in" → `/login`.
  - Visibility state is local to the component, so it resets when navigating between the pages.
- `AuthForm.module.css`: form layout, input styling and the toggle button positioned inside the password field, using `@apply` with `@reference "../../app/globals.css"` and the theme tokens (`bg-lighter`, `text-body`, `border`, `text-error`, etc.), same pattern as `components/Avatar/Avatar.module.css`. No multi-class Tailwind strings in JSX (per CLAUDE.md).
- `index.ts`: `export { default } from "./AuthForm"`.

### 2. Wire up the pages
- `app/(public)/login/page.tsx`: render `<AuthForm mode="login" />` under the existing `form-title`. Also rename the misnamed `SignupPage` export to `LoginPage`. The title is an `<h1>` here but `<h2>` on signup, so make signup an `<h1>` too for consistency.
- `app/(public)/signup/page.tsx`: render `<AuthForm mode="signup" />` under the title.

### 3. Preview
- Add `<AuthForm mode="login" />` and `<AuthForm mode="signup" />` to `app/(public)/preview/page.tsx` to eyeball them in isolation, per the project's preview-page convention.

### 4. Tests (TDD, per the `/component` workflow): `tests/components/AuthForm.test.tsx`
Vitest + RTL + `user-event`, mirroring `tests/components/Avatar.test.tsx`. Cover, without going heavy:
- Login mode renders email and password fields and a "Log in" button; signup mode shows "Sign up".
- The toggle switches the password input between `type="password"` and `type="text"`, and its label changes.
- Submitting logs the entered email and password (spy on `console.log`) and does not navigate.
- Each mode renders a link to the other route (`/signup` from login, `/login` from signup).
Write the tests first, watch them fail, then implement.

## Conventions to respect
- No semicolons; minimal dependencies (none added); `@apply` classes in a CSS module instead of Tailwind strings in JSX; import via the barrel `@/components/AuthForm`.
- Heads-up: the PostToolUse prettier hook has no config and adds semicolons (it did so to `app/(public)/page.tsx`). Either add a `.prettierrc` with `"semi": false` first, or strip semicolons after edits. I'd add the `.prettierrc` as a separate small commit before implementing.

## Critical files
- New: `components/AuthForm/{AuthForm.tsx,AuthForm.module.css,index.ts}`, `tests/components/AuthForm.test.tsx`
- Edit: `app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`, `app/(public)/preview/page.tsx`
- Reuse: `.btn`, `.form-title`, `.page-content`, `.center-content` in `app/globals.css`; `lucide-react` icons (already used on the splash page).

## Verification
1. `npm test -- tests/components/AuthForm.test.tsx`, then the full `npm test`, all green.
2. `npm run lint` and `npm run build` pass (confirms the client/server boundary is right).
3. `npm run dev`, then visit `/login`, `/signup` and `/preview`:
   - Toggle shows and hides the password and the icon swaps.
   - Empty or invalid email is blocked by the browser.
   - A valid submit logs `{ email, password }` in the browser console, with no navigation or network request.
   - The switch links move between the pages; keyboard Tab/Enter works on the toggle and submit.
