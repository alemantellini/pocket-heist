# Spec for logout-button

branch: claude/feature/logout-button
figma_component (if used): Navbar (Page Designs file, page-level link, specific frame not identified)

## Summary

Add a logout button to the navbar that signs the current user out of Firebase Auth when clicked. The button is only shown while a user is logged in, using the existing `useUser` hook, and is hidden while signed out or while the auth state is still loading. No redirect happens after logout yet; that is left to a later feature.

## Functional Requirements

- The navbar shows a "Log out" button only when `useUser` reports a signed-in user.
- The button is not shown when the user is signed out, and not shown while `useUser` is still loading, so it never flashes in and out on first load.
- Clicking the button signs the user out of Firebase Auth using the Firebase web SDK and the existing `auth` export.
- After sign-out, the global auth listener updates `useUser` to `null` on its own, which hides the button without a reload.
- No redirect or navigation after logout.
- Prevent repeated clicks while sign-out is in progress, for example by disabling the button until it finishes.
- If sign-out fails, the user stays signed in and sees a brief, readable error rather than a silent failure.
- The button is a real `<button>` element with an accessible name, keyboard operable, and sits alongside the existing "Create New Heist" link in the navbar.
- The navbar needs to read auth state and handle a click, so the interactive part runs on the client. The `(dashboard)` layout and pages stay server components.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, icons from `lucide-react` if one is used, styling via the Navbar CSS module with `@apply` and no more than one Tailwind class directly on an element, minimal dependencies.
- Out of scope: redirects after logout, route protection, login flow changes, confirmation dialogs, and showing the user's name or avatar in the navbar.

## Figma Design Reference (only if referenced)

- File: https://www.figma.com/design/elHzuUQZiJXNqJft57oneh/Page-Designs?node-id=0-1&p=f&t=eN7aRUfP7eVa2ExJ-0
- Component name: Navbar (the link points at the whole page, not a specific frame)
- Key visual constraints: Design reference could not be retrieved. See Figma manually for details. The Figma MCP returned an access error for this file, so the button's exact placement, size, colours and icon are unconfirmed. Until checked, match the existing navbar styling and theme tokens.

## Possible Edge Cases

- Auth state still loading on first render: button must not appear and then disappear.
- User signs out in another tab: the button should hide without a reload.
- Double click, or clicking again while sign-out is in progress.
- Sign-out fails, for example due to a network problem.
- The navbar rendered in tests or the preview page without an auth provider: using `useUser` outside the provider throws, so tests must wrap or mock it.
- Signed-in user on a page without the navbar (public routes): no logout button exists there, which is acceptable for now.

## Acceptance Criteria

- When signed in, the navbar shows a "Log out" button.
- When signed out or loading, the navbar shows no logout button.
- Clicking the button signs the user out and the button disappears without a reload.
- The button is disabled while sign-out is in progress.
- A failed sign-out leaves the user signed in and shows a readable error.
- No redirect occurs after logout.
- The button is keyboard accessible and has an accessible name.
- The existing navbar heading and "Create New Heist" link still render and behave as before.
- `npm run build` and `npm run lint` pass, and the `(dashboard)` layout remains a server component.

## Open Questions

- Which Figma frame shows the logout button, and where should it sit (e.g. right of "Create New Heist")? The link provided could not be read, and the file needs to be shared with view access for the Figma tools.
  Just left of the "Create New Heist" button in the navbar. Style it as a secondary/ghost button so it doesn't compete visually with the primary "Create New Heist" action.
- Should the button include an icon (e.g. from `lucide-react`), or be text only?
  Text plus icon: `LogOut` from `lucide-react`, placed before the "Log out" label. Since it has a visible label, the icon is decorative (`aria-hidden="true"`). Disable the button while sign-out is in progress to prevent double clicks.
- How should a failed sign-out be shown: inline text in the navbar, or something else?
  No inline text in the navbar; it would break the layout and is an extremely rare case. Log the error to the console and keep the user signed in (the button simply becomes clickable again). If a toast system is added later, surface the error there.
- Should the navbar link to the dashboard routes only render for signed-in users too, or is that left to the later route protection feature?
  Left to the later route protection feature. This work only conditionally renders the logout button, based on `user` from `useUser()`. While `loading` is `true`, render nothing in that slot to avoid the button flashing in and out.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The logout button renders when `useUser` returns a signed-in user.
- The logout button does not render when `useUser` returns no user, or is still loading.
- Clicking the button calls Firebase sign-out (Firebase mocked).
- The button is disabled while sign-out is pending.
- A failed sign-out shows an error and leaves the button usable.
- The existing Navbar heading and Create New Heist link tests still pass (update them to provide a mocked `useUser`).
