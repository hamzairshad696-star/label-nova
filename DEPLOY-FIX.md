# Label Nova — deployment fix (Sept 2026)

## Root cause
1. The whole `components` folder was uploaded to `src/app/components/` instead of `src/components/`.
   The `@/*` alias in tsconfig.json points to `./src/*`, so `@/components/...` looks in `src/components/`.
2. Three folders were never uploaded at all: `src/lib/`, `src/config/`, `src/server/`,
   plus root files `src/app/layout.tsx`, `src/app/globals.css`, `src/proxy.ts`, the `/app` pages and the API routes.
   Together these produced the 38 "Module not found" errors.

## What changed
- MOVED   src/app/components/**  →  src/components/**   (38 files, contents unchanged)
- ADDED   src/app/layout.tsx, globals.css, not-found.tsx, robots.ts, sitemap.ts, icon.svg
- ADDED   src/app/app/layout.tsx, src/app/app/page.tsx              (signed-in workspace)
- ADDED   src/app/api/auth/[...all]/route.ts, api/me/route.ts, api/users/route.ts
- ADDED   src/proxy.ts                                             (redirects signed-out visitors)
- ADDED   src/config/site.ts, src/config/plans.ts
- ADDED   src/lib/cn.ts, auth-client.ts, auth-constants.ts, auth-errors.ts, safe-redirect.ts,
          validation/auth.ts, barcode/code128.ts (+ test)
- ADDED   src/server/auth/{auth,catalog,permissions,request-meta,session}.ts
- ADDED   src/server/db/client.ts, src/server/db/schema/{index,auth,access,audit}.ts
- ADDED   src/server/services/{users,audit}.ts, src/server/email.ts
- ADDED   scripts/deploy-db.ts, scripts/_bootstrap.ts   (automatic DB setup on each Vercel build)
- ADDED   .gitignore, .env.example
- EDITED  package.json      (+ "vercel-build" and "db:deploy" scripts; dependencies unchanged)
- EDITED  drizzle.config.ts (+ casing: "snake_case", matching the existing migration)
- EDITED  scripts/bootstrap.ts (now calls scripts/_bootstrap.ts), README.md (deploy steps)

## Verified
- `tsc --noEmit`: 0 errors. `next build`: success, 0 warnings.
- Database schema regenerates to exactly the existing migration (drizzle-kit: "No schema changes").
- Project's own end-to-end suite (tests/e2e/auth_flow.py) against real Postgres: 29/29 passed.
