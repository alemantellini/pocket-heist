# Spec for heist-card-component

branch: claude/feature/heist-card-component
figma_component (if used): HeistCard (default variant, node 1:94)

## Summary

Add a `HeistCard` component that shows one heist as a card, and a `HeistCardSkeleton` placeholder with the same size and layout. On `/heists`, the "Your Active Heists" and "Heists You've Assigned" sections show their heists as cards in a 3-column grid, with skeleton cards in the same grid while the heists load. The "All Expired Heists" section is not changed and keeps its current title-only list. Each card's title links to the heist details page (`/heists/:id`). The details page itself gets no new content in this feature.

## Functional Requirements

- A `HeistCard` component takes one heist and shows:
  - the title, as a link to `/heists/<heist id>`
  - the codename of the person it is assigned to ("To:")
  - the codename of the person who created it ("By:")
  - the deadline as a short date and time, followed by the time left until the deadline (for example "4h 42m" or "1d 0h"), or "Overdue" once the deadline has passed
  - a clock icon at the top right of the card
- Only the title is a link. The rest of the card is not clickable.
- Long titles are limited to two lines and cut off with an ellipsis rather than growing the card.
- Cards in the same row have equal height.
- A `HeistCardSkeleton` component has the same outer size, border, background and padding as `HeistCard`. It shows pulsing placeholder bars where the title and the three detail lines go.
- `/heists` shows cards only for the "Your Active Heists" and "Heists You've Assigned" sections. The "All Expired Heists" section is not changed by this feature.
- In those two sections the cards sit in a 3-column grid with the same gap between rows and columns. On narrower screens the grid drops to fewer columns instead of squeezing the cards.
- While a section is loading, it shows a row of skeleton cards (three) in the same grid instead of the current plain loading text. When loading finishes, the cards replace the skeletons.
- The existing empty message and error message for each section still show when there are no heists or the query fails.
- The heist details route `/heists/:id` keeps its current placeholder content. No details, data fetching or layout work is added to it. The route must exist and render without errors so that the card links do not lead to a 404.
- The page stays a server component. Only the part that uses the heists hook is a client component, as today.
- Any new color is added as a theme token in `app/globals.css`. Icons come from `lucide-react`. No new dependencies are added.
- New components are added to the preview page (`app/preview/page.tsx`) so they can be viewed in isolation.
- Follow project conventions: no semicolons, `@/` imports, barrel imports, at most one Tailwind class directly on an element, styling in CSS modules with `@apply`, and each component in its own folder with an `index.ts` barrel.
- Out of scope: the history/expired card variant, hover or click behaviour beyond the title link, any content on the details page, editing or completing heists, and live countdown updates.

## Figma Design Reference (only if referenced)

- File: https://www.figma.com/design/VJoMJzOrIq3b2nY8VV0qSk/Pocket-Heist (file key `VJoMJzOrIq3b2nY8VV0qSk`). No node id was in the link; the cards were found in the "App" screen frame `1:2`.
- Component name: `HeistCard` (symbol `1:94`; instances `1:24`, `1:59`, `1:138`, `1:173`, `1:208`). The Figma file has no skeleton, so the skeleton is derived from the card design.
- Key visual constraints:
  - Card: dark background (project `lighter` color), 1px border in `#1E2939` (not yet a theme token and needs adding), 10px corner radius, about 20px padding, 12px gap between title row and details, no shadow, fixed height of about 177px.
  - Title: Inter 16px, white, up to two lines. Clock icon 16px at the top right, in the primary purple.
  - Details: three rows with 12px icons (user, user, calendar), 14px text, 8px gap between rows. Labels in the body gray (`#99A1AF`), the assignee handle in `primary`, the creator handle in `secondary`, and the time-left or "Overdue" text in `primary`.
  - Handles are shown with an `@` prefix.
  - The Figma design shows 2 columns with a 16px gap. This feature intentionally uses 3 columns as requested, so the card width will be smaller than in the design.
  - The Figma "Heist History" row variant (symbol `1:443`) is not part of this feature.

## Possible Edge Cases

- A very long title, or a title with no spaces, must not break the card layout.
- A deadline that has already passed on an active or assigned heist shows "Overdue" rather than a negative time.
- A deadline less than a minute away, or exactly now.
- A deadline more than a day away shows days and hours; one under a day shows hours and minutes.
- The time left is calculated when the card renders and does not tick live, so it can be a little stale on a page left open.
- Heists with missing codenames show a sensible fallback instead of "@undefined".
- A section with one or two heists leaves empty cells in the 3-column grid without stretching the cards.
- Server and browser render the date in different locales or timezones, which could cause a mismatch warning if the card is rendered on the server first.
- Switching quickly from loading to loaded must not make the grid jump, so skeleton and card sizes match.
- The "Heists You've Assigned" section includes every heist the user created, including ones whose deadline has passed, so many of its cards may show "Overdue".
- A card link opening `/heists/:id` for a heist id that does not exist.
- Keyboard users can reach each title link and see a visible focus style.

## Acceptance Criteria

- `HeistCard` shows title, "To:" codename, "By:" codename, deadline date and time, and time left or "Overdue", using the Figma card's colors, spacing, radius and icons.
- The card title links to `/heists/<id>` and navigates there without a full page reload.
- `HeistCardSkeleton` matches the card's size and layout and visibly pulses.
- On `/heists`, the active and assigned sections show cards in a 3-column grid, and skeleton cards in the same grid while loading.
- The expired section is unchanged.
- Empty and error states in each section still work.
- `/heists/:id` renders its existing placeholder with no new content.
- The new components appear on the preview page.
- The new border color is a theme token, and no new dependencies are added.
- `npm run lint`, `npx vitest run` and `npm run build` pass.

## Open Questions

- The Figma design shows a 2-column grid but the request asks for 3 columns. Should the card keep the Figma proportions at the narrower width, or should something be adjusted (for example less padding)? (Assumed: 3 columns as requested, with the Figma styling unchanged.)
- The page content area is 1152px wide, but the Figma screen content is only 771px. Should the grid use the full page content width? (Assumed: yes, use the existing page width.)
- How many columns should the grid use on tablet and phone widths? (Assumed: 2 on medium screens and 1 on small screens.)
- Should the time left update live while the page is open? (Assumed: no, calculated at render.)
- The Figma shows a status line like "Overdue" for active heists and a countdown for assigned heists. Should both sections use the same rule (countdown, or "Overdue" if past)? (Assumed: yes, one rule for both.)
- The Figma has no skeleton and no hover or focus design. Is it fine for the skeleton to be derived from the card and for only the title link to get a focus style? (Assumed: yes.)
- Should the card show the heist description? Figma does not show it. (Assumed: no.)
- How many skeleton cards should show while loading? (Assumed: three, one full row.)

## Resolved Questions

- **3 columns vs Figma's 2?** Keep 3 columns as requested, with the Figma styling (colours, typography, radii, spacing between elements) unchanged. Only reduce the card's inner padding if content actually feels cramped at the narrower width; don't shrink font sizes. Long titles wrap (max 2 lines with `line-clamp-2`) rather than overflowing.
- **Full page width for the grid?** Yes, use the existing page content width (1152px). The Figma screen is a mockup width, not a constraint. Use a consistent gap (e.g. `gap-6`) matching the spacing in Figma.
- **Columns on tablet and phone?** 1 column on small screens, 2 on medium, 3 on large (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Should time left update live?** No, calculated at render, consistent with the `useHeists` decision to capture "now" once. A shared timer can be added later if live countdowns matter.
- **Same status rule for both sections?** Yes, one rule: show a countdown (e.g. "2d 4h left", or "45m left" under an hour) and "Overdue" once the deadline has passed. Put the formatting in a small pure helper (e.g. `lib/formatTimeLeft.ts`) so it's easy to test and reuse on the details page later.
- **Skeleton and focus states not in Figma?** Fine. The skeleton mirrors the card's layout with neutral blocks (`animate-pulse`, with `motion-reduce:animate-none`), same size as a real card to avoid layout shift, and `aria-hidden="true"`; the loading state is announced once by the section, not per skeleton. Only the title link gets a visible `focus-visible` outline plus an underline on hover. Don't make the whole card clickable.
- **Show the description?** No, follow Figma. The details page will show it.
- **How many skeleton cards?** Three, one full row on large screens.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- `HeistCard` renders the title, both codenames with `@` prefixes, and the formatted deadline.
- The title is a link whose `href` is `/heists/<id>`.
- A future deadline shows the time left, and a past deadline shows "Overdue".
- `HeistCardSkeleton` renders without a link or heist text.
- On `/heists`, loading sections show skeleton cards, and loaded active and assigned sections show one card per heist (hook mocked).
- The empty message still shows when a loaded section has no heists.
- The expired section still shows titles only, not cards.
