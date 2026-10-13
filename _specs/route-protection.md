# Spec for route-protection

branch: claude/feature/route-protection
figma_component (if used): n/a

## Summary

Protect the app's two route groups using the existing `useUser` hook. Pages in the `(public)` group should only be viewable by unauthenticated users, and pages in the `(dashboard)` group should only be viewable by authenticated users. A user in the wrong group is redirected to the right place. While Firebase is still working out who the user is, each group layout shows a very simple loader instead of its pages, so nothing is flashed to the wrong user before the redirect kicks in.

## Functional Requirements

- Routes in the `(dashboard)` group (`/heists`, `/heists/create`, `/heists/[id]`) are only viewable by a signed-in user. A signed-out visitor is redirected to `/login`.
- Routes in the `(public)` group (`/`, `/login`, `/signup`, `/preview`) are only viewable by a signed-out visitor. A signed-in user is redirected to `/heists`.
- Redirects are driven by the `useUser` hook (`user` and `loading`) and happen on the client, in response to auth state.
- While `useUser` reports `loading`, each group layout shows a very simple loader and does not render its children or, for the dashboard group, the navbar.
- While a redirect is pending (the user is in the wrong group), the layout keeps showing the loader rather than the page, so protected or public-only content never flashes.
- Once the correct auth state is confirmed for that group, the layout renders its normal content (the public wrapper, or the navbar plus page for the dashboard).
- Redirects replace the current history entry so the back button does not bounce the user between the two groups.
- Auth changes while the user is on a page are handled live: logging out from the navbar on a dashboard page sends the user to `/login`, and logging in on `/login` or `/signup` sends the user to `/heists`.
- The splash page `/` is covered by the public group rule. Its existing comment about deciding where to send the user is satisfied by this feature, and the comment should be updated to match.
- The loader is minimal: a simple accessible indicator with a status message for screen readers, styled with existing theme tokens, with no new dependencies.
- The group layouts are the place the protection lives, so individual pages need no changes and stay server components. Only the client part of each layout needs to run in the browser.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, styling via CSS modules with `@apply` and no more than one Tailwind class directly on an element, components in `components/<Name>/` with an `index.ts` barrel, minimal dependencies.
- Out of scope: server-side or middleware-based protection, per-page roles or permissions, remembering the originally requested URL to return to after login, Firestore security rules, and changes to the signup and login flows themselves.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- First load while Firebase restores the persisted session: both groups must show only the loader and never briefly show the wrong content.
- A signed-in user opening `/login` or `/signup` directly, or following a bookmark to the splash page.
- A signed-out visitor opening a dashboard URL directly (for example `/heists/some-id`).
- The success message the login form shows today ("Welcome back...") will be replaced almost immediately by the redirect to `/heists`, because logging in makes the user authenticated inside the public group.
- Right after signup the user becomes authenticated and is redirected to `/heists` while the signup flow is still finishing its profile steps (display name and user document); the redirect should not cut those off.
- Logging out in one tab while another tab is open on a dashboard page.
- Firebase auth listener errors, which leave `loading` false with no user: the user is treated as signed out.
- Redirect loops between the two groups if the two layouts ever disagree about auth state.
- The `/preview` scratch page becomes unreachable for signed-in users.

## Acceptance Criteria

- A signed-out visitor to any dashboard route ends up on `/login`, and never sees dashboard content.
- A signed-in user visiting `/`, `/login`, `/signup` or `/preview` ends up on `/heists`, and never sees the public page content.
- While auth status is loading, each group shows only the loader.
- Signing out from the navbar sends the user to `/login` without a reload.
- Signing in or signing up sends the user to `/heists` without a reload.
- Redirects use history replacement, so Back does not return to the page that redirected.
- The navbar is not rendered for signed-out visitors, and not rendered while loading.
- No page files need to become client components.
- Existing tests keep passing and new tests cover the behaviour above.
- `npm run build` and `npm run lint` pass.

## Open Questions

- Should signed-in users still be able to reach `/preview` (the component scratch page), or is it fine for it to be public-only like the rest of the group?
  Yes. It's a dev scratch page, not a public page, so it shouldn't follow the group's auth rules. Move it out of the `(public)` group (e.g. `app/preview/`) so neither redirect applies to it.
- Now that login redirects straight to `/heists`, should the login success message be kept, shortened, or removed?
  Remove it. The redirect is the success feedback, and a message that flashes for a split second before navigation is just noise (and confusing for screen readers). Keep the generic error message for failed logins. Remove the related focus-management and `role="status"` code too.
- Should the signup flow be allowed to finish writing the profile before the redirect fires, and if so how?
  Yes. `onAuthStateChanged` fires right after `createUserWithEmailAndPassword`, which would redirect before `updateProfile` and `setDoc` complete, and `onAuthStateChanged` won't fire again after `updateProfile`, so the context user would have no `displayName`. Fix: - Add a `pendingSignup` flag to the auth context (with a setter). - The signup form sets it to `true` before creating the account and back to `false` in a `finally` block. - The `(public)` layout doesn't redirect while `pendingSignup` is `true` (it keeps showing the form in its submitting state). - After the profile writes, call `auth.currentUser.reload()` and refresh the context user so `displayName` is populated before the redirect. - If the profile writes fail, still clear the flag and let the redirect happen; the "ensure profile exists" fallback from the signup spec covers the gap.
- Should the loader look the same in both groups, or should the dashboard loader keep the page background and the public one the centered layout?
  Same component, different shells. Create one `<AuthLoader />` that spins the same clock icon used in the site title (reuse the exact `lucide-react` icon the title imports, so they stay in sync), with `animate-spin` and `motion-reduce:animate-none` for users who prefer reduced motion. The icon is decorative (`aria-hidden="true"`); wrap it in an element with `role="status"` containing a visually hidden "Loading…" label. Each layout renders it inside its own wrapper, so the dashboard keeps its page background and the public group keeps its centered layout. Also show the loader (not the page) while a redirect is pending, to avoid flashing the wrong page
- Should the intended destination (for example a direct link to `/heists/some-id`) be remembered and used after login, or always go to `/heists`?
  Not for now; always go to `/heists`. Supporting a `?next=` param properly means validating it (only same-origin relative paths) to avoid open redirects, which is worth its own small feature later.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The loader is shown, and children are not rendered, while `useUser` reports loading, in both group layouts.
- A signed-out visitor in the dashboard layout is redirected to `/login` and sees no children or navbar.
- A signed-in user in the dashboard layout sees the navbar and children and is not redirected.
- A signed-in user in the public layout is redirected to `/heists` and sees no children.
- A signed-out visitor in the public layout sees the children and is not redirected.
- Redirects use history replacement.
- The loader renders an accessible status message.
- Mock `useUser` and the Next.js router in these tests.
