# Spec for auth-state-user-hook

branch: claude/feature/auth-state-user-hook
figma_component (if used): n/a

## Summary

Add a global, realtime auth state solution so any page or component can read the current user through a `useUser` hook. The hook returns `null` when logged out and the user object when logged in. A single app-wide listener on Firebase Auth keeps this value up to date as the auth state changes. This feature covers only observing auth state; it does not include signup, login or logout flows.

## Functional Requirements

- Provide a `useUser` hook that returns the current user: `null` when logged out, the user object when logged in.
- The hook must be usable in any client page or component in the app, in both the `(public)` and `(dashboard)` route groups.
- A single global listener subscribes to Firebase Auth state changes once for the whole app and shares the result with all consumers, rather than each consumer subscribing on its own.
- The user value updates in realtime when auth state changes (e.g. signing in or out from another tab, token expiry), without a page reload.
- Expose a way for consumers to tell apart "auth state is still being determined" from "logged out", so UI does not flash logged-out content or wrongly redirect on first load.
- The listener is cleaned up when the provider unmounts.
- The provider is mounted high enough in the tree (root layout level) to cover every route, while keeping pages as server components.
- The hook throws a clear error if used outside the provider.
- Review existing components and pages for any place that currently accesses or assumes a user, and update them to use `useUser`. Today no component reads the user directly, so this is mostly an audit; note any placeholders found.
- Follow project conventions: component folder with co-located module CSS if any, `index.ts` barrel, `@/` imports, no semicolons, minimal dependencies (use the existing Firebase `auth` export).
- Out of scope: signup, login and logout flows, route protection and redirects (including the splash page redirect), and user profile data from Firestore.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- First render before Firebase has resolved the persisted session: user is unknown, not logged out.
- Server rendering: the provider and hook run only on the client, so server components must not call the hook.
- Hot reload in development causing duplicate listeners.
- Rapid auth changes (sign in then out) leaving a stale user value.
- Auth listener error or network failure while restoring the session.
- A component using `useUser` outside the provider.
- Multiple tabs with different auth states converging.

## Acceptance Criteria

- `useUser` can be imported via a barrel and used in any client component or page.
- It returns `null` when no user is signed in and the user object when one is.
- Changing auth state (sign in or out) updates all consumers without a reload.
- Only one Firebase auth subscription exists for the app, and it is unsubscribed on unmount.
- Consumers can distinguish the loading state from the logged-out state.
- Using the hook outside the provider throws a descriptive error.
- Any existing code that accessed the user now goes through `useUser`.
- `npm run build` and `npm run lint` pass, and pages remain server components.

## Open Questions

- Should `useUser` return just the user, or an object like `{ user, loading }`? (Spec assumes the user value plus a separate way to read loading.) `useUser` should return an object: `{ user, loading }`. One hook, one call site, no separate mechanism to read loading state. `user` is `null` when signed out, and `loading` is `true` until Firebase's first `onAuthStateChanged` callback fires. If an "always signed in" helper is needed later (e.g. inside protected routes), add a `useRequiredUser()` that throws or redirects when `user` is null.
- Should the exposed user be the raw Firebase `User` or a trimmed app-specific shape? A trimmed app-specific shape, e.g. `{ uid, email, displayName, photoURL }`. This keeps Firebase types out of the rest of the app, makes components easy to test with plain objects, and avoids accidental reliance on Firebase methods. If something needs the raw `User` (e.g. `getIdToken()`), expose it through a dedicated function in the auth module rather than through the context.
- While loading, should the provider render children immediately or hold rendering until auth resolves? Render children immediately and let consumers use `loading`. Blocking the whole tree delays public pages that don't care about auth. Protected routes/components check `loading` and show a spinner or skeleton until it resolves, so there's no flash of signed-out UI where it matters.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- `useUser` returns `null` when the mocked auth listener reports no user.
- `useUser` returns the user object when the mocked auth listener reports a signed-in user.
- Consumers re-render with the new value when the mocked auth state changes.
- Loading state is reported until the first auth callback fires.
- The listener subscribes once and the unsubscribe function is called on unmount.
- Using `useUser` outside the provider throws an error.
