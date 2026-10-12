# Spec for signup-firebase-auth

branch: claude/feature/signup-firebase-auth
figma_component (if used): n/a

## Summary

Connect the signup form on `/signup` to Firebase Authentication so a visitor can create a real account with email and password. On successful signup, the new user is given a randomly generated display name (one word from each of three different sets of unique words, joined in PascalCase). A matching document is also created in the `users` collection in Firestore, storing the user's id and that same name as their `codename`, and never their email. Only the Firebase web SDK is used. Login and logout flows are not part of this feature.

## Functional Requirements

- Submitting the signup form creates a Firebase Auth account using the entered email and password, via the existing `auth` export (currently in `lib/firebase.ts`).
- On success, set the new user's `displayName` to a randomly generated name: one word picked at random from each of three distinct sets of unique words, concatenated in PascalCase (e.g. `BraveCrimsonFox`).
- On success, create a document in the `users` collection in Firestore, using the existing `db` export. The document is keyed by the user's uid and contains only the user's id and their `codename` (the same value as the generated display name).
- The user document must NOT contain the user's email, or any other personal data.
- Only the Firebase web SDK (the `firebase` package already installed) is used. No Admin SDK, no server-side Firebase code, no additional Firebase packages.
- The auth account creation, display name update and user document creation should feel like one signup: the user is not told signup succeeded until all three are done.
- Show clear, friendly error feedback in the form when signup fails (e.g. email already in use, weak password, invalid email, network error), without losing what the user typed.
- Disable the submit button and show a pending state while signup is in progress, to prevent duplicate submissions.
- Signup mode no longer logs the entered email and password to the console. Login mode keeps its current behaviour since the login flow is out of scope.
- After successful signup, the user is signed in, and the existing global `useUser` hook reflects the new user, including the display name, without a reload.
- The word sets live in their own small module, each set containing unique words (no duplicates within or across sets), so the generator is easy to test and extend.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, minimal dependencies, pages stay server components, any styling via CSS modules with `@apply`.
- Out of scope: login, logout, route protection and redirects, email verification, password reset, profile editing, and guaranteeing codename uniqueness across users.

## Figma Design Reference (only if referenced)

- File: n/a
- Component name: n/a
- Key visual constraints: n/a

## Possible Edge Cases

- Email already registered, invalid email format, or weak password rejected by Firebase.
- Auth account is created but setting the display name or writing the user document fails, leaving a half-created account.
- Network failure or Firebase unavailable during signup.
- Double click or repeated Enter press submitting twice.
- Two users randomly receiving the same codename (accepted, since uniqueness is out of scope).
- `useUser` briefly showing the new user without a display name, because the auth listener can fire before the profile update lands.
- Firestore security rules rejecting the write to `users` for the new user.
- The email accidentally ending up in the user document through spreading the auth user object.

## Acceptance Criteria

- Submitting valid details on `/signup` creates a Firebase Auth user.
- The new user has a display name made of three PascalCase words, one from each of three distinct word sets.
- A document exists in the `users` collection, keyed by uid, containing the user's id and `codename` (equal to the display name) and nothing else, in particular no email.
- Failed signups show a readable error in the form and leave the form usable.
- The submit button is disabled while the request is in flight.
- Signup mode no longer logs credentials to the console.
- After signup, `useUser` returns the new user with the generated display name.
- Only Firebase web SDK imports are used, and no new dependencies are added.
- `npm run build` and `npm run lint` pass, and the signup page remains a server component.

## Open Questions

- The request mentions `lib/firebase/config.ts`, but that file does not exist; the `auth` and `db` exports currently live in `lib/firebase.ts`. Should the spec use the existing file, or should the config be moved into a `lib/firebase/` folder first? (Assumed: use the existing file.)
  Use the existing `lib/firebase.ts`. Moving files is unrelated to this feature and would add noise to the diff. If a `lib/firebase/` folder is wanted later, do it as a separate refactor.
- How large should each word set be, and what theme should the words follow (e.g. adjectives, colours, animals)?
  - Set 1, adjectives: e.g. `Silent`, `Crimson`, `Swift`, `Velvet`, `Shadow`...
  - Set 2, nouns or colours/materials: e.g. `Iron`, `Midnight`, `Glass`, `Copper`, `Neon`...
  - Set 3, animals: e.g. `Fox`, `Raven`, `Viper`, `Panther`, `Falcon`...
    Result like `SilentCopperFox`. With 25 words per set that's ~15,600 combinations, which is plenty for now. Codenames don't need to be globally unique at this stage. Keep the sets in a small constants file (e.g. `lib/codename.ts`) alongside the generator function.
- If the Firestore write fails after the account is created, should the account be rolled back (deleted), or kept and retried later?
  Keep the account, don't roll back. Deleting the user is a second network call that can also fail, and it makes the flow fragile. Instead: show an error, and make the profile write idempotent (`setDoc` on `users/{uid}`) so it can be retried. A later "ensure profile exists" check on sign-in can fill the gap. Same for `updateProfile`: if setting `displayName` fails, the Firestore `codename` is the source of truth.
- Should the user be redirected anywhere after successful signup (e.g. `/heists`), or is that left to the later redirect feature?
  Leave it to the later redirect feature. This work ends once the account, `displayName`, and `users/{uid}` document are created; at most, show a success state or clear the form.
- Are Firestore security rules for the `users` collection already in place, or should they be part of this work (e.g. a user can only create their own document)?
  Include them in this work, since the feature depends on writing to that collection. Minimal rules: - - A signed-in user can create/update only `users/{uid}` where `uid == request.auth.uid`. - Allowed fields are only `id` and `codename` (no `email`); `id` must equal `request.auth.uid`. - Reads: limit to the owner for now unless another feature needs codenames visible to others.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The codename generator returns three words in PascalCase, one from each set, and the word sets contain no duplicates.
- Submitting the signup form calls Firebase account creation with the entered email and password (Firebase mocked).
- After account creation, the display name is set and a `users` document is written for the new uid containing only the id and codename, with no email.
- A Firebase error (e.g. email already in use) shows a readable message in the form.
- The submit button is disabled while signup is pending.
- Login mode still behaves as before, and signup mode no longer logs credentials.
