# Spec for use-heists-hook

branch: claude/feature/use-heists-hook
figma_component (if used): n/a

## Summary

Add a `useHeists` hook that reads heists from the `heists` collection in Firestore in real time and returns them as an array of heist objects. The hook takes one argument that decides which heists it returns: `active` (heists assigned to the current user whose deadline has not passed) or `expired` (heists of any user whose deadline has passed and whose final status has been set). The `/heists` page then uses the hook to list only the titles of three result sets, one under each of its three existing headings. The page currently has three headings: "Your Active Heists", "Heists You've Assigned" and "All Expired Heists". The middle heading needs a third kind of query that the request does not define (see Open Questions). Heist cards, links to individual heists, and any way to mark a heist as a success or failure are out of scope.

## Functional Requirements

- A hook named `useHeists` takes a single argument, which is one of the supported query types, and returns an array of heists. Each item has the same shape as the existing `Heist` type, with the `createdAt` and `deadline` fields as `Date` values, using the existing heist converter and `COLLECTIONS` constant.
- Data is real time: the hook subscribes to the matching Firestore query, and the returned array updates whenever the underlying data changes, without a reload. The subscription is closed when the component using the hook unmounts or the argument changes, so no listeners leak.
- `active`: returns heists where `assignedTo` is the signed-in user's uid and the deadline has not yet passed.
- `expired`: returns heists, regardless of who created or was assigned them, where the deadline has passed and `finalStatus` is not `null`.
- The hook makes a different query for each argument value, so filtering happens in Firestore rather than by downloading every heist and filtering in the browser.
- A third query type is needed for the "Heists You've Assigned" section, which lists heists the signed-in user created and handed to others. It follows the same rules as the other two (see Open Questions for its exact filters).
- The current user comes from the existing `useUser` hook. When there is no signed-in user yet, the user-specific queries return an empty array and do not subscribe.
- Before the first snapshot arrives the hook returns an empty array. A failed subscription (for example, permission denied or a missing index) returns an empty array and logs the error rather than crashing the page.
- The "now" used to decide whether a deadline has passed is taken when the subscription starts.
- Results are ordered sensibly: soonest deadline first for `active`, most recently expired first for `expired`.
- On `/heists`, each of the three existing sections lists only the heist titles from its result set, one per entry, under the existing headings. No other heist fields are shown.
- When a section has no heists it shows a short empty message instead of a blank space.
- The page itself stays a server component. The part that uses the hook is a client component, following the project's existing split.
- The existing unescaped apostrophe in the "Heists You've Assigned" heading is fixed while this page is edited, so that `npm run lint` passes cleanly.
- Firestore security rules are updated so these queries are allowed: a signed-in user can read heists assigned to them, heists they created, and heists whose final status has been set. Everything else stays denied, and writes are unchanged.
- Firestore indexes needed by the queries are added to the project's index configuration, if any of them require one.
- Only the Firebase web SDK already installed is used. No new dependencies.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, at most one Tailwind class directly on an element, styling via CSS modules with `@apply`, and hooks and components in their own folders with an `index.ts` barrel.
- Out of scope: pagination, heist detail pages, heist cards or deadlines display, editing or completing heists, and notifications.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- A heist's deadline passes while the page is open. With "now" taken at subscription time, it stays in the active list until the page is reloaded or the hook resubscribes.
- A heist has a final status set before its deadline. It is not in `expired` yet, and may still appear in `active` depending on the answer to the open question below.
- A heist whose deadline has passed but whose final status is still `null` appears in neither `active` nor `expired`.
- The signed-in user is not available when the hook first runs, then becomes available (or signs out) later.
- The argument changes while mounted, which must close the old subscription and open the new one without mixing results.
- A new heist is created in another tab or by another user and appears without a reload.
- The query needs a composite index that does not exist yet, so the subscription errors until the index is created.
- Firestore security rules reject a query that could return documents the user is not allowed to read.
- Heist documents with missing or malformed fields (for example a missing `deadline`) are skipped or handled without crashing the page.
- Large result sets, especially `expired`, which covers every user, with no pagination in this feature.
- The page rendering three subscriptions at once, and each unsubscribing correctly on navigation away.

## Acceptance Criteria

- `useHeists` exists and returns an array of heists for each supported argument value.
- With `active`, only heists assigned to the signed-in user with a deadline in the future are returned, and a newly created heist assigned to the user appears without a reload.
- With `expired`, only heists with a past deadline and a non-null final status are returned, for any user.
- The returned heists have `Date` values for `createdAt` and `deadline`.
- The Firestore listener is removed when the component unmounts or the argument changes.
- `/heists` shows three sections under their existing headings, each listing only heist titles, with an empty message when there are none.
- The `/heists` page remains a server component, and `npm run lint` no longer reports the unescaped apostrophe.
- The security rules allow the three queries for a signed-in user and still deny reading other users' unfinished heists.
- Any required indexes are defined in the project.
- No new dependencies are added.
- `npm run build` and `npm run lint` pass.

## Open Questions

- The request defines two query types, but the page has three sections, and the middle one ("Heists You've Assigned") needs a third. Should the hook accept a third value, for example `assigned`, returning heists created by the current user? (Assumed: yes, `assigned` returns heists where `createdBy` is the signed-in user.)
- Should the `assigned` set include every heist the user created, or only those whose deadline has not passed or that are still unresolved? (Assumed: every heist the user created, newest first.)
- Should `active` also require `finalStatus` to be `null`? As described, a heist marked a success or failure before its deadline would still count as active. (Assumed: follow the request literally, deadline only, and revisit once completing heists exists.)
- The request says the hook returns an array of heists. Should it also expose a loading state and an error, so the page can tell "still loading" from "no heists"? (Assumed: return only the array, as requested, and show the empty message until data arrives.)
- Should the hook read the current user itself from `useUser`, or should the user's uid be passed in? (Assumed: the hook reads it itself, since the argument is only the query type.)
- Should the "now" used for deadlines refresh over time so heists move from active to expired on a live page? (Assumed: no, taken once when subscribing.)
- Are the Firestore rules and indexes part of this work? The current rules deny all heist reads, so the hook cannot work without them. (Assumed: yes, edited in the repo and validated, but deploying stays your call.)

## Resolved Questions

- **Third query type for "Heists You've Assigned"?** Yes. Add `assigned`, returning heists where `createdBy` is the signed-in user. The hook's argument becomes `'active' | 'assigned' | 'expired'`.
- **What does `assigned` include?** Every heist the user created, newest first (`orderBy('createdAt', 'desc')`). No deadline or status filtering for now; it's the creator's full history.
- **Should `active` also require `finalStatus == null`?** Follow the request literally for now: `assignedTo == uid` and `deadline > now`, ordered by deadline ascending (most urgent first). Revisit once completing heists exists. At that point, note that `where('finalStatus', '==', null)` only matches docs where the field exists, so the create form would need to write `finalStatus: null` explicitly.
- **Expose loading and error?** Yes, deviate slightly from the request: return `{ heists, loading, error }`, consistent with `useUser`. Showing "no heists" while data is still loading is misleading. The page shows a small loading line per section, the empty message only when `loading` is false and the array is empty, and a short error message if the listener fails.
- **Read the user inside the hook or pass the uid?** Read it inside via `useUser`. If there's no user yet (or auth is loading), don't subscribe and return `loading: true` with an empty array. All three types require a signed-in user, since the rules require auth. Unsubscribe in the effect cleanup and resubscribe when the uid or type changes.
- **Refresh "now" over time?** No. Capture `now` once when subscribing (as a Firestore `Timestamp`). Heists will move between sections on the next page load or resubscribe. A timer can be added later if live expiry matters.
- **Firestore rules and indexes?** Part of this work: edited in the repo and validated with the emulator, deploying stays your call.
  - Rules: any signed-in user can read heists. The `expired` query is "regardless of user", and heists contain no sensitive data, so per-user read rules would add complexity without real benefit. Create rules from the create-heist spec stay as they are; updates and deletes remain denied.
  - Indexes (in `firestore.indexes.json`):
    - `assignedTo` ASC + `deadline` ASC (active)
    - `createdBy` ASC + `createdAt` DESC (assigned)
    - `finalStatus` ASC + `deadline` ASC (expired: two inequality filters, `deadline < now` and `finalStatus != null`)

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- With `active`, the hook queries by the signed-in user's uid and a future deadline, and returns the heists from the snapshot as objects with `Date` values (Firestore mocked).
- With `expired`, the hook queries by past deadline and non-null final status, with no user filter.
- With the third query type, the hook queries by the signed-in user as creator.
- The returned array updates when the mocked snapshot listener emits new data.
- The listener is unsubscribed on unmount and when the argument changes.
- The hook returns an empty array and does not subscribe when there is no signed-in user, and returns an empty array when the subscription errors.
- The `/heists` sections render only the titles from each result set, and show an empty message when a set is empty (hook mocked).
