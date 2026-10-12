# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pocket Heist — "Steal small. Laugh big." A Next.js starter app (built for the Claude Code Masterclass) where users assign/complete small office "heists" (prank-like tasks). Most routes currently render placeholder content; no backend, data layer, or auth logic is implemented yet.

## Commands

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint
npm test        # run vitest test suite (watch mode by default)
```

Run a single test file: `npm test -- tests/components/Navbar.test.tsx`

## Architecture

- **Next.js App Router** with two parallel route groups under `app/`, each with its own layout:
  - `app/(public)/` — unauthenticated routes (`/`, `/login`, `/signup`, `/preview`). Layout has no nav.
  - `app/(dashboard)/` — authenticated routes (`/heists`, `/heists/create`, `/heists/[id]`). Layout wraps children in `<Navbar />`.
  - Route groups share no layout logic with each other; `app/layout.tsx` (root) only sets metadata and imports `globals.css`.
- Splash page (`app/(public)/page.tsx`) is intended to redirect based on auth state (logged in → `/heists`, else → `/login`), but this redirect is not yet implemented — see the comment at the top of that file.
- `app/(public)/preview/page.tsx` is a scratch page for previewing new UI components in isolation before wiring them into real routes.
- Components live under `components/<ComponentName>/` as a folder with the component file, a co-located CSS module, and an `index.ts` barrel export (see `components/Navbar/`). Import via the barrel (`@/components/Navbar`), not the file directly.
- Path alias `@/*` maps to the repo root (configured in `tsconfig.json`).
- Tests live under `tests/`, mirroring the source structure (e.g. `components/Navbar/Navbar.tsx` → `tests/components/Navbar.test.tsx`), using Vitest + React Testing Library + jsdom.

## Styling

- Tailwind CSS v4, configured via `@theme` in `app/globals.css` (not a `tailwind.config` file) — custom tokens like `--color-primary`, `--color-dark`, `--color-heading` are defined there.
- Generic layout/utility classes (`.page-content`, `.center-content`, `.form-title`) are defined once in `globals.css` and reused across pages rather than repeating Tailwind utility strings.
- Component-specific styles use CSS Modules (`*.module.css`) co-located with the component.

## Additional Coding Preferences

- Do NOT use semicolons for JavaScript or TypeScript code.
- Do NOT apply tailwind classes directly in component templates unless essential or just 1 at most. If an element needs more than a single tailwind class, combine them into a custom class using the `@apply` directive.
- Use minimal project dependencies where possible.
- Use the `git switch -c` command to switch to new branches, not `git checkout`.

## Checking Documentation

- **important:** When implementing any lib/framework-specific features, ALWAYS check the appropriate lib/framework documentation using the Context7 MCP server before writing any code.
