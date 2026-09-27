# Label Nova

Premium label creation, bulk generation and management platform.
Architecture, schema and roadmap: see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Status: Phase 2 complete

- **Phase 1:** foundation, design system, landing page.
- **Phase 2:** authentication (register, login, logout, forgot and reset password), four roles
  with database-driven permissions, protected `/app` and `/admin`, audit logging and rate limiting.
  Verified by 29 end-to-end checks against real Postgres (`tests/e2e/`).

## Getting started

```bash
npm install
cp .env.example .env.local     # set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm run db:migrate             # create tables
npm run db:bootstrap           # roles and permissions
ALLOW_SEED=true npm run db:seed   # optional: demo users, password LabelNova-demo-2026
npm run dev                    # http://localhost:3000
```

Demo accounts after seeding: `admin@`, `dealer@`, `reseller@` and `client@demo.labelnova.dev`.
Without `RESEND_API_KEY`, password-reset emails are printed to the server console in development.

Requires Node 20.9 or newer.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests (Code 128 encoder) |

## Where things live

```
src/app/globals.css                    Design tokens (colours, radii, type scale, motion)
src/app/layout.tsx                     Root layout, fonts, SEO metadata, skip link
src/app/(marketing)/layout.tsx         Header + footer for public pages
src/app/(marketing)/page.tsx           Landing page (composes all sections + JSON-LD)
src/app/(auth)/                        Login, register, forgot and reset password
src/app/app/, src/app/admin/           Protected areas (full dashboard shell arrives in Phase 3)
src/app/api/auth/[...all]/             Better Auth endpoints
src/app/api/me, api/users              Examples of permission-checked API routes
src/proxy.ts                           Redirects signed-out visitors (optimistic check)
src/server/auth/                       Auth config, permission catalog, getActor/assertPermission
src/server/db/                         Drizzle schema and client
src/server/services/                   Business logic; every function takes an Actor
scripts/                               migrate/bootstrap/create-admin/seed CLIs
drizzle/                               SQL migrations
src/app/robots.ts, sitemap.ts          SEO files
src/components/ui/                     Button, Badge, Container, SectionHeader, Icons
src/components/brand/logo.tsx          Logo and mark
src/components/label/                  Shared 4×6 label renderer + barcode (reused by the app)
src/components/marketing/              One file per landing section
src/config/site.ts                     Site name, URL, navigation
src/config/plans.ts                    Plan display copy (moves to the pricing table in Phase 9)
src/lib/barcode/code128.ts             Code 128 encoder, shared by SVG preview and future PDF renderer
```

## Deploying to Vercel + Neon

1. Create a Neon project. Copy the **pooled** connection string to `DATABASE_URL` and the
   **direct** one to `DATABASE_URL_UNPOOLED`.
2. Push to GitHub and import the repository in Vercel.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL`, both set to your production URL
   - `RESEND_API_KEY` and `EMAIL_FROM`
4. From your machine, with production env vars loaded, run once:
   `npm run db:migrate && npm run db:bootstrap`, then
   `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:create-admin`.
5. Deploy. Builds don't need database access; secrets are only read at runtime.
