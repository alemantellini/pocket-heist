# Spec for login-firebase-auth

branch: claude/feature/login-firebase-auth
figma_component (if used): n/a

## Summary

Connect the login form on `/login` to Firebase Authentication so a returning user can sign in with their email and password. When the credentials are correct, the user is signed in and shown a success message on the page. When they are wrong, a clear error is shown. There is no redirect after login yet; that is left to a later feature.

## Functional Requirements

- Submitting the login form signs the user in with Firebase Auth using the entered email and password, via the existing `auth` export from `lib/firebase.ts` and the Firebase web SDK only.
- On success, show a success message in the form (for example "You're logged in") and keep the user on `/login`. No redirect or navigation.
- After a successful login, the existing global `useUser` hook reflects the signed-in user without a reload, so the navbar's logout button appears on pages that have the navbar.
- On failure, show a readable error in the form and keep what the user typed. Wrong email or password must show one generic message that does not reveal which of the two was wrong.
- Handle other failures with friendly messages too, for example too many attempts, a disabled account, an invalid email format and network errors.
- Disable the submit button and show a pending state (for example "Logging in…") while the request is in flight, to prevent duplicate submissions.
- Remove the temporary placeholder that logs the entered email and password to the console in login mode, so credentials are never logged.
- Any previous error or success message is cleared when the user submits again.
- Login mode keeps its current behaviour of not enforcing a minimum password length.
- Reuse the existing `AuthForm` component and the existing error-message handling used by signup where possible, rather than creating a second form.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, pages stay server components, styling via CSS modules with `@apply` and no more than one Tailwind class directly on an element, no new dependencies.
- Out of scope: redirects, route protection, password reset, "remember me", social login, email verification, and changes to the signup flow.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- Wrong password, or an email that is not registered (should look identical to the user).
- Too many failed attempts causing Firebase to temporarily block the account.
- Disabled user account.
- Network failure or Firebase unavailable during login.
- Double click or repeated Enter press submitting twice.
- A user who is already signed in visiting `/login` and logging in again.
- Success message left on screen after the user later edits the form, or after they log out in the navbar.
- Firebase returning the same generic invalid-credential error for both wrong email and wrong password.

## Acceptance Criteria

- Submitting correct credentials on `/login` signs the user in and shows a success message, with no redirect.
- After login, `useUser` returns the signed-in user without a reload.
- Submitting wrong credentials shows a generic, readable error and leaves the form usable with the typed values kept.
- The submit button is disabled while the request is in flight.
- Credentials are no longer logged to the console in login mode.
- Signup mode behaves exactly as before.
- Only Firebase web SDK imports are used and no new dependencies are added.
- `npm run build` and `npm run lint` pass, and the login page remains a server component.

## Open Questions

- What exact wording should the success message use, and should it replace the form or appear above or below it?
  It replaces the form. Wording: "Welcome back, {codename}!" using the user's `displayName`, falling back to "Welcome back!" if it's missing. Optionally a second line: "You're now logged in." Replacing the form avoids a confusing state where the form is still visible and submittable after login.
- Should the success message be announced to screen readers (for example as a polite status message), and should focus move anywhere?
  Yes to both. Wrap the message in an element with `role="status"` (polite announcement). Since the form disappears, move focus to the message container (give it `tabIndex={-1}`) so keyboard and screen reader users aren't left with focus on a removed element.
- Should a user who is already logged in see the login form at all, or is that left to the later redirect and route protection work?
  Left to the later redirect and route protection work. For now the form renders regardless of auth state. The only exception is the success message after submitting, which is driven by local component state, not by `useUser()`.
- Should the success message clear automatically after a while, or stay until the next interaction?
  No, it stays. Auto-dismissing content is bad for accessibility (users may not finish reading it) and there's nothing to go back to, since the user is now logged in. The future redirect will make this moot.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Submitting the login form calls Firebase sign-in with the entered email and password (Firebase mocked).
- A successful sign-in shows the success message and does not navigate.
- A failed sign-in (for example invalid credentials) shows a generic readable error and keeps the typed email.
- The submit button is disabled while sign-in is pending.
- Credentials are not logged to the console in login mode.
- Signup mode still behaves as before, and the short-password check still applies only to signup.
