# Spec for create-heist-form

branch: claude/feature/create-heist-form
figma_component (if used): n/a

## Summary

Build the "Create a New Heist" form on `/heists/create` so a signed-in user can set a title and description, pick another user to assign the heist to, and save it as a new document in the `heists` collection in Firestore. The assignee list is built from the `users` collection (each document holds a user's id and `codename`). The form fields follow the existing `CreateHeistInput` type. Values the user does not enter (who created it, their codename, the creation time, the deadline and the starting final status) are filled in by the app. After a successful save the user is redirected to `/heists`. Listing heists on `/heists` and viewing a single heist are not part of this feature.

## Functional Requirements

- The page at `/heists/create` shows a form under the existing "Create a New Heist" title, with a title input, a description input and an "assign to" choice listing other users by codename.
- The form is a client component, so the page itself stays a server component, following the same split as the auth forms.
- The "assign to" options come from the `users` collection in Firestore, using the existing `db` export. Each option shows the user's `codename`, and selecting it supplies that user's id.
- The signed-in user does not appear in the "assign to" list, so a heist cannot be assigned to yourself.
- The list shows a loading state while users are being fetched, and a clear message if there are no other users to assign to. In that case the form cannot be submitted.
- Title and description are required, and the user must pick an assignee before submitting. Whitespace-only values count as empty.
- On submit, a new document is created in the `heists` collection, typed with the existing `CreateHeistInput` interface and the existing heist converter and `COLLECTIONS` constant.
- The fields the user enters are `title`, `description`, `assignedTo` and `assignedToCodename`.
- The fields added by the app are:
  - `createdBy`: the signed-in user's uid.
  - `createdByCodename`: the signed-in user's display name.
  - `createdAt`: a server timestamp.
  - `deadline`: exactly 48 hours after the time of submission.
  - `finalStatus`: `null`.
- After the document is saved, redirect the user to `/heists`. The redirect only happens after the save has succeeded.
- Disable the submit button and show a pending state while the save is in progress, to prevent duplicate heists.
- If the save fails, show a clear, friendly error in the form, keep what the user typed, and leave the form usable.
- Only the Firebase web SDK already installed is used. No new dependencies and no server-side Firebase code.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, at most one Tailwind class directly on an element, styling via a CSS module with `@apply`, components in `components/<Name>/` with an `index.ts` barrel, and theme tokens only.
- Out of scope: the heists list on `/heists`, the single heist page, editing or deleting a heist, marking a heist as success or failure, and notifying the assigned user.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- The users fetch fails or is slow, leaving the assignee list empty or loading for a while.
- The signed-in user is the only user in the collection, so there is nobody to assign to.
- The assigned user's document is missing a codename, or a user is removed between loading the list and submitting.
- The signed-in user's display name is not yet available when the form is submitted.
- Double click or repeated Enter press submitting twice.
- The save fails because of a network error or Firestore security rules rejecting the write.
- Very long titles or descriptions, or pasted whitespace-only text.
- A signed-out user reaching the page; the existing route guard already redirects them, so the form never needs to handle this.
- The deadline being calculated when the page loads instead of when the form is submitted, which would shorten the 48 hours.

## Acceptance Criteria

- `/heists/create` shows the form with title, description and assignee fields and a submit button.
- The assignee list shows the codenames of the other users from the `users` collection, and not the signed-in user.
- Submitting with an empty title, an empty description or no assignee is blocked, with a readable message.
- A valid submission creates exactly one document in the `heists` collection with all `CreateHeistInput` fields set as described above.
- The created document has `createdBy` and `createdByCodename` of the signed-in user, `finalStatus` of `null`, and a `deadline` 48 hours after submission.
- After a successful save the user lands on `/heists`.
- A failed save shows a readable error, keeps the typed values, and does not redirect.
- The submit button is disabled while the save is in flight.
- The create page remains a server component, and only Firebase web SDK imports are used, with no new dependencies.
- `npm run build` and `npm run lint` pass.

## Open Questions

- Should the signed-in user be allowed to assign a heist to themselves? (Assumed: no, they are excluded from the list.)
  No. Exclude the signed-in user from the assignee list. Heists are something you hand to someone else, and it keeps the dropdown cleaner. If self-assignment is wanted later, it's a one-line filter change.
- Should the assignee list load once when the page opens, or update live as users join? (Assumed: load once.)
  Load once on mount with `getDocs`, sorted by codename. A live listener is overkill for a form; new users joining mid-session is rare. Show a disabled select with "Loading crew…" while fetching, and an inline error with a retry button if the fetch fails.
- Are Firestore security rules for the `heists` collection and for reading the `users` collection already in place, or should they be part of this work? The signup spec limited reads on `users` to the owner, which would stop users seeing each other's codenames.
  Part of this work, since the feature can't work without them.
  - `users`: relax reads so any signed-in user can read all user docs. This is safe because the docs only contain `id` and `codename` (no email, per the signup spec). Writes stay owner-only.
  - `heists`: a signed-in user can create a heist only if `createdBy == request.auth.uid`, `createdAt == request.time` (set with `serverTimestamp()`), the assignee is not the creator, the fields are limited to the expected set, and title/description lengths respect the limits below. Reads, updates and deletes are left to the features that need them; deny them for now.
- Should there be length limits on the title and description? (Assumed: a short limit on the title and a longer one on the description, to be agreed during planning.)
  Title: required, 3–80 characters. Description: required, up to 500 characters. Enforce with `maxLength` on the inputs, client-side validation with inline errors, and the same limits in the security rules. Trim whitespace before validating and saving.
- Should the form be a new component in `components/` (for example a heist form) or live in the page's own client component? (Assumed: a new component, following the `AuthForm` pattern.)
  New component, `components/HeistForm.tsx`, following the `AuthForm` pattern. The page stays a thin wrapper. Disable the submit button while submitting, and only redirect to `/heists` after the `addDoc` promise resolves; on failure, show an inline error and keep the form values.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The form lists the other users' codenames from the `users` collection and leaves out the signed-in user (Firestore mocked).
- Submitting with an empty title, an empty description or no assignee shows an error and does not save.
- A valid submission saves a heist with the entered title, description and assignee, plus the signed-in user's id and codename, a `null` final status and a server timestamp (Firestore mocked).
- The saved deadline is 48 hours after the submission time (fake timers).
- A successful save redirects to `/heists`.
- A failed save shows a readable error, keeps the typed values and does not redirect.
- The submit button is disabled while the save is pending.
