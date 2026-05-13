# Film Production Budget App

A film production management app for tracking budgets, managing expenses, artists/technicians, song/BGM, documents, and generating reports.

## Run & Operate

- `pnpm --filter @workspace/film-production run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18, Vite 7, Tailwind CSS v4, shadcn/ui (Radix UI primitives)
- Charts: Recharts
- Icons: Lucide React
- API: Express 5 (shared api-server artifact)
- Build: Vite

## Where things live

- `artifacts/film-production/` — the main React frontend app
  - `src/app/App.tsx` — root component; manages login → project selection → dashboard flow
  - `src/app/components/` — page components (Dashboard, Expenses, Artists, Reports, etc.)
  - `src/app/components/ui/` — shadcn/ui component library
  - `src/app/components/figma/` — Figma-exported helper components
  - `src/assets/` — PNG image assets (film posters, backgrounds)
  - `src/styles/` — CSS files (index.css, globals.css, default_theme.css)
- `artifacts/api-server/` — shared Express API server (currently only /api/healthz)

## Architecture decisions

- Source imported directly from private GitHub repo (ashikjamalmca/Filmproduction) via GitHub OAuth connector
- The original repo used Figma Make's versioned import convention (`@pkg@1.0.0`); imports were normalized to standard package names on import
- `figma:asset/` imports are resolved via a custom Vite plugin pointing to `src/assets/`
- The `@` path alias resolves to `src/app/` (matching the original repo's convention)
- App state is managed with local React state (no backend/DB needed for the frontend)

## Product

- Login page with role selection (Producer, Director, etc.) and demo credentials
- Project selection screen showing active film projects
- Dashboard with budget overview, expense summaries, and charts
- Daily expense entry and comparison views
- Artists & technicians management
- Song/BGM tracking
- Document management
- Reports with charts and export options
- User management

## User preferences

- No codebase changes initially — imported as-is from GitHub
- Changes to be made step by step in a controlled manner

## Gotchas

- The original repo's package.json used npm alias syntax (`"pkg@ver": "npm:pkg@ver"`) — this was not carried over; standard package names are used instead
- CSS theme variables in `src/styles/default_theme.css` and `globals.css` control all colors — the theme uses placeholder `red` values in spots that should be replaced with real HSL values when theming work begins

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Demo credentials (from the app): `demo@filmproduction.com` / `demo123`
