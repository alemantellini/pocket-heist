# Plan: heist-card-component

Spec: `_specs/heist-card-component.md` | Branch: `claude/feature/heist-card-component`
Save target: `_plans/heist-card-component.md` (saved only, not implemented yet)

## Context

`/heists` currently lists heist titles as plain `<li>` text, with a plain "Loading heists…" line while loading. The spec adds a Figma-based `HeistCard` (title linking to `/heists/:id`, To/By codenames, deadline and time left), a matching `HeistCardSkeleton`, and a 3-column grid for the Active and Assigned sections. The Expired section stays title-only. The details page stays a placeholder.

## Findings that shape the plan

- `components/HeistList/HeistList.tsx` (client) is the single place that renders each section's list: error → loading text → empty message → `<ul>` of titles. It receives `type: "active" | "assigned" | "expired"` and calls `useHeists(type)` (`{ heists, loading, error }`). The page `app/(dashboard)/heists/page.tsx` stays a server component.
- `app/(dashboard)/heists/[id]/page.tsx` already exists with a placeholder, so links won't 404. No change.
- No date or time-left helpers exist anywhere. `Heist` (`types/firestore/heist.ts`) has `title`, `assignedToCodename`, `createdByCodename`, `deadline: Date`, `id`.
- Conventions to copy: `components/Skeleton` (pulse bars, `aria-hidden`, `data-testid`), `components/Navbar` (`next/link`, lucide icons, `rounded-[10px]` style arbitrary values with a Figma comment), `Avatar` (several `@apply` lines per class is accepted).
- `.page-content` has `w-6xl min-w-2xl max-w-full`, so the page never gets narrower than 672px. A 3-column grid at that width gives ~210px cards, which is tight.
- No border color token exists. Figma border `#1E2939` needs one.

## Design decisions (from spec assumptions)

- 3 columns by default, 2 on medium, 1 on small screens. Equal-height cards per row.
- Cards in Active and Assigned only. Expired keeps `<ul>` of titles.
- Time left is computed at render. Fixed `en-US` locale for date formatting to avoid server/client differences on the preview page.
- Title link only (no whole-card link). Title clamped to 2 lines. Codename fallback if missing.
- Three skeleton cards while loading.

## Steps (test-first per project `/component` workflow, in this order)

1. **Theme token.** Add `--color-outline: #1E2939` to `@theme` in `app/globals.css`.
2. **Time helpers.** Add `lib/time.ts`: `formatDeadline(date)` (short date and time, `en-US`) and `formatTimeLeft(date, now = new Date())` returning "Overdue", "Xh Ym" (under a day) or "Xd Yh". Write `tests/lib/time.test.ts` first (past, under an hour, under a day, over a day, exactly now).
3. **`HeistCard`.** `components/HeistCard/{HeistCard.tsx, HeistCard.module.css, index.ts}`. Test first in `tests/components/HeistCard.test.tsx`. Server-safe component (no `"use client"`).
   - `next/link` title → `/heists/${id}`. Lucide `Clock` (16), `User` (12), `Calendar` (12).
   - CSS values from Figma brief: `rounded-[10px]`, border `outline`, bg `lighter`, `p-5`, `gap-3`, min height ~177px, title 16px `line-clamp-2`, meta 14px `body`, assignee `primary`, creator `secondary`, time left `primary`, visible focus style on the link.
4. **`HeistCardSkeleton`.** `components/HeistCardSkeleton/…` with the same outer box and pulsing bars (2 title lines plus 3 meta lines). `aria-hidden`, `data-testid="heist-card-skeleton"`. Test first.
5. **Wire into `HeistList`.** Keep the error and empty branches as they are. When `type !== "expired"`:
   - Loading → grid with 3 `HeistCardSkeleton`.
   - Loaded → grid of `<li><HeistCard/></li>`.
   - `expired` keeps the current title-only list and loading text.
   - Add `.grid` to `HeistList.module.css` (`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`, `list-none`) and keep `.list` for expired.
6. **Update tests.** `tests/components/HeistList.test.tsx`: the shared "titles only" and "Loading heists…" tests apply to `expired` only. Add cases for active/assigned (skeletons while loading, one card per heist, empty and error states unchanged).
7. **Preview page.** Add a 3-column section to `app/preview/page.tsx` with a `HeistCard` fixture (future and overdue) and three `HeistCardSkeleton`s (a `.preview-grid-3` class in `globals.css`, or reuse the same grid class).
8. **Verify** (below).

## Critical files

- Modify: `app/globals.css`, `components/HeistList/HeistList.tsx`, `components/HeistList/HeistList.module.css`, `app/preview/page.tsx`, `tests/components/HeistList.test.tsx`
- Create: `lib/time.ts`, `components/HeistCard/*`, `components/HeistCardSkeleton/*`, `tests/lib/time.test.ts`, `tests/components/HeistCard.test.tsx`, `tests/components/HeistCardSkeleton.test.tsx`
- Unchanged: `app/(dashboard)/heists/page.tsx`, `app/(dashboard)/heists/[id]/page.tsx`, `hooks/useHeists`

## Project rules to respect

No semicolons, one Tailwind class per element (use `@apply` in modules), `@reference "../../app/globals.css";` at the top of each module, barrel imports, no new dependencies. Check Next.js `Link` docs via Context7 before writing the component.

## Verification

- `npx vitest run` (new and updated tests pass), `npm run lint`, `npm run build`.
- `npm run dev`, then check `/preview` (card, overdue card, skeletons) and `/heists` signed in: skeleton row while loading, cards in a 3-column grid for Active and Assigned, Expired unchanged, title click opens `/heists/<id>` placeholder, and the layout holds at medium and small widths.
- Compare the card against the Figma screenshot (node `1:24`).

## Remaining risks / things to confirm during build

- Grid width at the `min-w-2xl` floor of `.page-content` (may need card padding tweaks).
- Whether to keep the Figma 177px height as `min-h` only.
