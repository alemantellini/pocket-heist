# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pocket Heist — "Steal small. Laugh big." A Next.js starter app (built for the Claude Code Masterclass) where users assign/complete small office "heists" (prank-like tasks). There is no backend, data layer, or auth yet: most routes render placeholder content, and the login/signup forms only `console.log` their input.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build (also catches server/client component boundary errors)
npm run lint    # eslint (next core-web-vitals + typescript configs)
npm test        # vitest in watch mode; use `npx vitest run` for a single pass
```

Run a single test file: `npm test -- tests/components/AuthForm.test.tsx`

## Architecture

- **Next.js App Router with two route groups** under `app/`, each with its own layout and no shared layout logic:
  - `app/(public)/`: routes for signed-out visitors only (`/`, `/login`, `/signup`). Layout wraps pages in `<main className="public">` and a `<RouteGuard require="guest">`, no nav.
  - `app/(dashboard)/`: routes for signed-in users only (`/heists`, `/heists/create`, `/heists/[id]`). Layout wraps `<Navbar />` and the page in a `<RouteGuard require="user">`.
  - Root `app/layout.tsx` only sets metadata and imports `globals.css`.
- Route protection is client-side: `components/RouteGuard` (using `useUser`) shows `components/AuthLoader` until auth is known, redirects with `router.replace` (signed out in dashboard → `/login`, signed in in public → `/heists`), and only then renders the page. The splash page `/` is covered by the public guard.
- `app/preview/page.tsx` (outside both route groups, so reachable signed in or out) is a scratch page for previewing new components in isolation before wiring them into real routes. Add new components there.
- Pages are server components. Anything with state or event handlers lives in a component marked `"use client"` (e.g. `components/AuthForm`), so the pages themselves stay server components.
- **Components** live in `components/<Name>/` with the component file, a co-located `*.module.css`, and an `index.ts` barrel. Import via the barrel (`@/components/AuthForm`), not the file. `@/*` maps to the repo root.
- **Tests** live in `tests/`, mirroring source (`components/Avatar/Avatar.tsx` → `tests/components/Avatar.test.tsx`). Vitest + React Testing Library + `@testing-library/user-event` on jsdom; `vitest.setup.ts` loads the jest-dom matchers.
- Icons come from `lucide-react` (already a dependency); prefer it over adding another icon library.

## Styling

- Tailwind CSS v4, configured via `@theme` tokens in `app/globals.css` (no `tailwind.config` file): `primary`, `secondary`, `dark`, `light`, `lighter`, `success`, `error`, `heading`, `body`.
- Shared classes (`.page-content`, `.center-content`, `.form-title`, `.btn`) are defined once in `globals.css` and reused rather than repeating utility strings.
- CSS modules must start with `@reference "../../app/globals.css";` to use theme tokens inside `@apply`.

## Workflow

- Default branch is `master` (there is no `main`). There is no git remote.
- Feature work flows through the project slash commands in `.claude/commands/`: `/spec` writes `_specs/<slug>.md` from `_specs/template.md` and creates a `claude/feature/<slug>` branch; approved plans are saved to `_plans/<slug>.md`; `/component` builds components test-first; `/commit-message` drafts emoji-prefixed commits (`✨ feat:`, `🐛 fix:`, `🔨 refactor:`, `📝 docs:`, `🎨 style:`, `✅ test:`, `⚡ perf:`).
- A PostToolUse hook in `.claude/settings.local.json` runs `npx prettier --write` on every edited `.ts`/`.tsx` file. `.prettierrc` sets `"semi": false` to keep it consistent with the no-semicolon rule; don't remove it.

## Coding Preferences

- Do NOT use semicolons in JavaScript or TypeScript.
- Do NOT put more than one Tailwind class directly on an element in a template. Combine them into a custom class with `@apply` (in the component's CSS module, or `globals.css` if shared).
- Keep project dependencies minimal.
- Create branches with `git switch -c`, not `git checkout`.

## Checking Documentation

- **important:** When implementing any lib/framework-specific features, ALWAYS check the appropriate lib/framework documentation using the Context7 MCP server before writing any code.
