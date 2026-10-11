# Spec for auth-forms

branch: claude/feature/auth-forms
figma_component (if used):

## Summary

Add authentication forms to the `/login` and `/signup` pages. Each form has an email field, a password field with a show/hide toggle icon, and a submit button labelled for its purpose (Log in / Sign up). For now, submitting a form only logs the entered details to the console; no real authentication or backend call happens. Users can easily move between the two forms via a link on each page pointing to the other.

## Functional Requirements

- The `/login` page shows a form with an email input, a password input and a "Log in" submit button.
- The `/signup` page shows a form with an email input, a password input and a "Sign up" submit button.
- The password field has an icon button that toggles between hiding the password (default) and revealing it as plain text; the icon reflects the current state.
- The password toggle must be keyboard accessible and have an accessible label describing its action.
- Submitting either form logs the entered email and password to the browser console and does nothing else (no navigation, no network request).
- Each page includes a clear link to switch to the other form (e.g. "Don't have an account? Sign up" on login, "Already have an account? Log in" on signup).
- Both forms share the same look and layout so switching feels seamless, with the existing page title (`form-title`) kept as the heading.
- Inputs have visible labels (or equivalent accessible names) and use the appropriate input types and autocomplete hints for email and password.
- Form styling follows existing project conventions (shared global classes and component-level CSS modules, no ad hoc utility strings in templates).

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- Submitting with empty fields (browser-level required validation should block submission).
- Invalid email format (browser-level email validation should block submission).
- Toggling password visibility repeatedly, and toggling while the field has focus or a typed value (value and cursor position must be preserved).
- Password visibility state should not carry over when navigating between login and signup.
- Double submission by rapid clicks or pressing Enter repeatedly.
- Logging credentials to the console is acceptable only as a temporary placeholder and must be removed once real authentication is wired in.

## Acceptance Criteria

- Visiting `/login` and `/signup` each renders an email field, a password field with a visibility toggle, and a correctly labelled submit button.
- Clicking the toggle switches the password between masked and visible, and the icon updates accordingly.
- Submitting a valid form logs the email and password to the console and performs no navigation or network request.
- Empty or invalid-email submissions are prevented with standard browser validation.
- Each page has a working link to the other form.
- The toggle and submit button are operable by keyboard and have accessible names.
- Code follows `CLAUDE.md` conventions (no semicolons, minimal dependencies, shared classes or `@apply` for styling).

## Open Questions

- Should signup include a confirm-password field, or is a single password field enough for now? No. A single password field plus the show/hide toggle is enough: the toggle lets users verify what they typed, and it keeps the form shorter.
- Should there be minimum password rules (length, complexity) on signup at this stage? Yes, but only a minimum length of 8 characters, validated client-side with an inline error. Skip complexity rules (uppercase, symbols, etc.) for now; they add friction without much security gain. The server must enforce the same minimum.
- Which icon set should be used for the show/hide toggle (the project already uses `lucide-react`)? `lucide-react`, since it's already a dependency. Use `Eye` / `EyeOff`, with an `aria-label` ("Show password" / "Hide password") and `aria-pressed` on the toggle button.
- Should the form be one shared component with a mode, or two separate components? One shared `AuthForm` component with a `mode: "login" | "signup"` prop. The fields and logic overlap almost entirely; mode-specific differences (title, submit label, password validation, `autocomplete="current-password"` vs `"new-password"`) are handled by conditionals.
- Should the "switch form" link live inside the form or below it? Below the form, outside the `<form>` element, as a separate line ("Don't have an account? Sign up" / "Already have an account? Log in"). This keeps it out of the form's tab order and submit semantics.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Each form renders email and password fields and the correct submit button label.
- The password toggle switches the input between `password` and `text` types.
- Submitting the form logs the entered email and password to the console (spy on `console.log`).
- Each page renders a link to the other form pointing at the correct route.
