# LABEL NOVA — Architecture Blueprint

Version 1.0 · Phase 1 baseline

This document is the source of truth for how Label Nova is built. Every later phase
extends it; nothing in a later phase should contradict it without updating this file first.

---

## A. Product architecture

Label Nova is a single Next.js application with three surfaces that share one design
system, one database and one permission layer.

```
                        ┌──────────────────────────────────────────┐
                        │              Next.js (Vercel)            │
                        │                                          │
  Visitors ───────────▶ │  (marketing)   landing, pricing, docs    │  static / ISR
                        │                                          │
  Signed-in users ────▶ │  (app)         dashboard, designer,      │  RSC + server actions
                        │                bulk, orders, wallet      │
                        │                                          │
  Admins ─────────────▶ │  (admin)       users, templates,         │  RSC + server actions
                        │                pricing, audit            │
                        │                                          │
  API clients ────────▶ │  /api/v1/*     REST, API-key auth        │  route handlers
                        └───────┬───────────────┬──────────────┬───┘
                                │               │              │
                     ┌──────────▼───┐   ┌───────▼──────┐  ┌────▼─────────────┐
                     │ Neon Postgres│   │ Vercel Blob  │  │ Job queue        │
                     │ (Drizzle ORM)│   │ PDFs, uploads│  │ (Inngest)        │
                     └──────────────┘   └──────────────┘  │ bulk + PDF jobs  │
                                                          └──────────────────┘
```

### Layering inside the codebase

| Layer | Lives in | Rule |
|---|---|---|
| UI | `src/components`, `src/app/**/page.tsx` | No database access. Receives typed data. |
| Actions / route handlers | `src/app/**/actions.ts`, `src/app/api/**` | Parse input with Zod, check permission, call a service. Nothing else. |
| Services | `src/server/services/*` | Business logic. Every function takes an `Actor` (who is acting) as its first argument. |
| Repositories | `src/server/db/queries/*` | The only code that writes SQL (through Drizzle). Scoping to tenant happens here. |
| Domain | `src/domain/*` | Pure TypeScript: template model, renderer, pricing maths, validation. No I/O, fully unit-testable. |

This split is what makes the security promise enforceable: a page can hide a button,
but the service refuses the operation regardless of how it was called.

### Key technology decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript strict | RSC keeps dashboards fast; one deploy unit. |
| Styling | Tailwind CSS 4 with CSS-variable tokens | Tokens live in CSS, so a rebrand is one file. |
| Database | Neon Postgres + Drizzle ORM over `pg` (node-postgres) using Neon's pooled connection string | Typed SQL, parameterised by default; the same driver works against Neon, local Postgres and CI. |
| Auth | Better Auth (email + password, DB sessions) | Sessions in our Postgres, password reset built in, no vendor lock. |
| Validation | Zod, shared between client and server | One schema, two uses. |
| PDF | `pdf-lib` + our own vector barcode/QR drawing | True vector output, no headless browser, runs in a serverless function. |
| Spreadsheets | `papaparse` (CSV), `exceljs` (XLSX) | Streaming-friendly, maintained, no known CVEs in current versions. |
| Background jobs | Inngest | Retries, step functions and chunking beyond the serverless time limit. |
| File storage | Vercel Blob (private) | Signed URLs for downloads. |
| Charts | Recharts, loaded only on dashboard routes | Keeps the landing bundle small. |
| Email | Resend | Password reset, bulk-complete notices. |
| Rate limiting | Upstash Redis | API and auth endpoints. |

### A note on carrier labels (important for launch)

A template can print any tracking number and barcode the customer supplies. That is
correct for internal, warehouse, product and return labels, but **postage for USPS, UPS,
FedEx, DHL and others is only valid when the label is purchased from the carrier or an
authorised aggregator** (EasyPost, Shippo, ShipEngine). Carriers scan the barcode against
their own records, so a self-made carrier-style label will be rejected in the network and
can be treated as postage fraud.

The architecture therefore reserves a `carrier_integrations` module for Phase 11+:
when a template is marked `kind = 'carrier_postage'`, tracking number and barcode become
**fixed, system-supplied fields** filled from the carrier API response, and customers can
no longer type them. Generic templates keep the free-text tracking field. Carrier logos
are never shipped as template assets unless a carrier agreement allows it.

---

## B. Page map

```
PUBLIC (marketing)
/                         Landing (14 sections)
/pricing                  Pricing detail                    Phase 11
/templates                Public template gallery           Phase 5
/docs/api                 API reference                     Phase 11
/legal/terms, /legal/privacy                                 Phase 13

AUTH
/login  /register  /forgot-password  /reset-password?token=  Phase 2
/logout (server action, no page)

APP (any signed-in role)
/app                      Dashboard overview
/app/labels/new           Create label (template → data → preview → generate)
/app/designer/[id]        Label designer (own layouts built on permitted templates)
/app/templates            Template library
/app/bulk                 Bulk uploads list
/app/bulk/new             Upload → map → validate → preview → generate
/app/bulk/[id]            Bulk job detail, error report, download
/app/orders   /app/orders/[id]
/app/labels               Label history
/app/customers  /app/customers/[id]
/app/wallet               Balance + transactions
/app/billing              Top-ups, invoices
/app/analytics
/app/api                  API keys + usage
/app/settings             Profile, password, notifications

ADMIN (ADMIN role only; dealers see a scoped subset under /app/network)
/admin                    Platform overview
/admin/users  /admin/users/[id]
/admin/network            Dealers & resellers tree
/admin/customers
/admin/orders   /admin/labels
/admin/templates  /admin/templates/[id]   (template builder)
/admin/pricing
/admin/payments  /admin/wallets
/admin/analytics
/admin/api
/admin/settings
/admin/audit
```

---

## C. Roles and permission matrix

Roles form an ownership tree: **ADMIN → DEALER → RESELLER → CLIENT**. Every user row
has `parent_user_id`. A user can act on their own data and, where the permission says
`scope: network`, on data belonging to users below them in the tree.

Permissions are strings (`orders.read`, `templates.write` …) stored in the database and
granted to roles, so new permissions never need a schema change.

| Permission | ADMIN | DEALER | RESELLER | CLIENT |
|---|---|---|---|---|
| `labels.create` / `labels.read` | all | network | network | own |
| `bulk.create` | ✓ | ✓ | ✓ | ✓ |
| `orders.read` | all | network | network | own |
| `orders.cancel` | all | network | own | own |
| `customers.manage` | all | network | network | own |
| `templates.use` | all | assigned | assigned | assigned |
| `templates.write` (create/edit/publish) | ✓ | — | — | — |
| `designer.custom_layouts` | ✓ | ✓ | ✓ | if enabled on plan |
| `pricing.write` | ✓ | — | — | — |
| `pricing.override_downline` (set margins for children) | ✓ | ✓ | ✓ | — |
| `wallet.read` | all | network | network | own |
| `wallet.adjust` (manual credit/debit) | ✓ | — | — | — |
| `wallet.transfer_downline` | ✓ | ✓ | ✓ | — |
| `users.create` | any role | RESELLER, CLIENT | CLIENT | — |
| `users.disable` | all | network | network | — |
| `users.assign_role` | ✓ | — | — | — |
| `api_keys.manage` | own + revoke any | own | own | own |
| `analytics.read` | platform | network | network | own |
| `audit.read` | ✓ | — | — | — |
| `settings.system` | ✓ | — | — | — |

Privilege-escalation rules enforced in `users.service`:
a user can never grant a role equal to or above their own, never move a user outside
their subtree, and never grant a permission they do not hold.

---

## D. Database schema

All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`,
`updated_at timestamptz` where rows are mutable. Money is stored as **integer minor units
(cents)** with a `currency char(3)`; never floats.

### Relationships at a glance

```
users ─┬─< user_roles >── roles ──< role_permissions >── permissions
       ├── parent_user_id → users (ownership tree)
       ├─< sessions, auth_accounts, verifications         (Better Auth)
       ├── wallets (1:1) ──< wallet_transactions
       ├─< customers
       ├─< api_keys
       ├─< notifications
       ├─< orders ──< order_items ──< labels
       ├─< bulk_uploads ──< bulk_upload_rows
       └─< audit_logs (actor)

templates ──< template_versions ──< template_elements
template_versions ──< labels
pricing (per product, optionally per role / per user)
```

### Tables

**users** — `email citext unique`, `name`, `password_hash` (Better Auth manages),
`status enum(active, disabled, pending)`, `parent_user_id → users null`, `company`,
`email_verified_at`, `last_login_at`. Index: `(parent_user_id)`, `(status)`.

**roles** — `key unique` (`ADMIN`, `DEALER`, `RESELLER`, `CLIENT`), `name`, `rank int`
(used for "cannot grant a role above yours").

**permissions** — `key unique` (`orders.read`), `description`.

**role_permissions** — `role_id`, `permission_id`, `scope enum(own, network, all)`.
PK `(role_id, permission_id)`. *Not in the original list, but required: without it the
matrix above would have to live in code, which defeats "change permissions without a deploy".*

**user_roles** — `user_id`, `role_id`. PK `(user_id, role_id)`. Single role per user is
the default policy; the join table keeps multi-role possible later.

**sessions / auth_accounts / verifications / rate_limits** — owned by Better Auth. Password
hashes (scrypt) live in `auth_accounts`, never on `users`. Cookies are `httpOnly`,
`secure` in production, `sameSite=lax`, prefixed `labelnova`. Rate-limit counters are kept in
Postgres so limits hold across serverless instances.

**customers** — the people a user ships to or bills. `owner_user_id → users`, `name`,
`email`, `phone`, `company`, `address jsonb` (validated shape), `status`, Index
`(owner_user_id, name)`, trigram index on `name` / `email` for search.

**templates** — `slug unique`, `name`, `description`, `kind enum(generic, shipping, product, carrier_postage)`,
`status enum(draft, published, archived)`, `current_version_id`, `visibility enum(all, assigned)`,
`created_by → users`.

**template_versions** — immutable once published. `template_id`, `version int`,
`width_mm numeric`, `height_mm numeric`, `orientation`, `dpi_hint int`, `field_schema jsonb`
(Zod-compatible field definitions: key, label, type, required, max length, pattern),
`published_at`. Unique `(template_id, version)`. *Added so that editing a template never
changes the appearance of labels already generated; labels reference a version.*

**template_elements** — `template_version_id`, `type enum(text, image, logo, barcode, qr, address, date, line, box)`,
`x_mm, y_mm, w_mm, h_mm, rotation`, `z int`, `props jsonb` (font, size, weight, align…),
`binding text null` (e.g. `recipient.name` or `{{tracking_number}}`),
`lock enum(fixed, style_locked, editable)`.

**template_assignments** — `template_id`, `user_id`. Used when `visibility = assigned`.

**pricing** — `product_key` (`label.standard`, `label.premium`, `label.bulk`),
`role_id null`, `user_id null`, `unit_amount int`, `currency`, `min_quantity int default 1`,
`active_from`, `active_to null`. Resolution order: user → role → default; highest
matching `min_quantity` wins. Price changes insert rows (history kept), never update.

**orders** — `number text unique` (human readable, `LN-24-000123`), `user_id`,
`customer_id null`, `status enum(draft, processing, completed, failed, cancelled)`,
`subtotal int`, `currency`, `source enum(web, bulk, api)`, `bulk_upload_id null`,
`failure_reason`. Index `(user_id, created_at desc)`, `(status)`.

**order_items** — `order_id`, `template_version_id`, `quantity`, `unit_amount`, `data jsonb`.

**labels** — `public_id unique` (`lbl_…`), `order_item_id`, `template_version_id`,
`user_id` (denormalised for fast scoped queries), `tracking_number null`,
`data jsonb`, `status enum(queued, rendered, failed, voided)`, `pdf_blob_key`,
`rendered_at`. Index `(user_id, created_at desc)`, `(tracking_number)`.

**bulk_uploads** — `user_id`, `template_version_id`, `original_filename`, `blob_key`,
`row_count`, `valid_count`, `invalid_count`, `column_mapping jsonb`,
`status enum(uploaded, mapped, validated, generating, completed, failed)`,
`estimated_amount int`, `merged_pdf_blob_key`, `order_id null`.

**bulk_upload_rows** — `bulk_upload_id`, `row_number int`, `data jsonb`,
`errors jsonb` (array of `{field, code, message}`), `is_valid bool`, `label_id null`.
Unique `(bulk_upload_id, row_number)`, partial index where `is_valid = false`.

**wallets** — `user_id unique`, `currency`, `balance int` (cached), `pending int`
(held for in-flight jobs), `version int` (optimistic check).

**wallet_transactions** — append-only ledger. `wallet_id`, `type enum(credit, debit, refund, adjustment, hold, release)`,
`amount int` (signed), `balance_after int`, `reference_type`, `reference_id`,
`description`, `created_by`, `idempotency_key unique`. The cached balance is updated in
the same transaction with `SELECT … FOR UPDATE` on the wallet row; a nightly check
compares it to `SUM(amount)`.

**payments** — `user_id`, `provider` (`stripe`, `manual`), `provider_ref unique`,
`amount`, `currency`, `status`, `wallet_transaction_id null`. Kept separate from the
ledger so a payment can exist before it is credited (pending review).

**api_keys** — `user_id`, `name`, `prefix` (first 8 chars, shown in UI), `key_hash`
(SHA-256 of the full key, unique), `scopes text[]`, `last_used_at`, `revoked_at`,
`expires_at`.

**api_requests** — `api_key_id`, `route`, `status_code`, `duration_ms`, `created_at`.
Partitioned by month; powers the usage chart.

**notifications** — `user_id`, `type`, `title`, `body`, `link`, `read_at`. Index
`(user_id, read_at)`.

**audit_logs** — append-only. `actor_user_id`, `action` (`template.published`),
`target_type`, `target_id`, `metadata jsonb` (before/after diff), `ip inet`,
`user_agent`. Index `(created_at desc)`, `(target_type, target_id)`.

**system_settings** — `key unique`, `value jsonb`, `updated_by`.

Seed vs production data: seeds live in `src/server/db/seed/` and every seeded row is
created by a script that refuses to run when `NODE_ENV=production` or when
`ALLOW_SEED` is not `true`. Demo users use the `@demo.labelnova.dev` domain so they are
trivially identifiable and deletable.

---

## E. Label template architecture

A template is data, not code. The same JSON drives the designer canvas, the browser
preview and the PDF renderer.

```ts
type Mm = number;

interface TemplateVersion {
  size: { width: Mm; height: Mm };        // 101.6 × 152.4 for 4×6"
  fields: FieldDef[];                      // what the customer fills in
  elements: TemplateElement[];             // what gets drawn
}

interface FieldDef {
  key: string;                             // "recipient_name"
  label: string;
  type: "text" | "multiline" | "number" | "date" | "enum" | "postal_code" | "country";
  required: boolean;
  maxLength?: number;
  pattern?: string;                        // compiled to a Zod regex
  options?: string[];
}

interface TemplateElement {
  id: string;
  type: "text" | "address" | "barcode" | "qr" | "image" | "logo" | "line" | "box" | "date";
  frame: { x: Mm; y: Mm; w: Mm; h: Mm; rotation: 0 | 90 | 180 | 270 };
  content?: string;                        // "TO:" or "{{recipient_name}}"
  barcode?: { symbology: "code128" | "code39" | "ean13"; value: string; showText: boolean };
  qr?: { value: string; errorCorrection: "L" | "M" | "Q" | "H" };
  style: { font: FontKey; size: number; weight: 400 | 500 | 700; align: "left" | "center" | "right"; lineHeight: number };
  lock: "fixed" | "style_locked" | "editable";
  visible: boolean;
}
```

**Binding.** `content` and barcode/QR `value` use `{{field_key}}` placeholders.
Resolution is a pure function `resolveTemplate(version, data) → ResolvedElement[]`
in `src/domain/template/resolve.ts`. Values are always inserted as text, never HTML,
which removes a whole class of XSS.

**Locks.** `fixed` elements cannot be moved, restyled or deleted by non-admins.
`style_locked` allows content changes only. `editable` is fully customisable.
The designer reads the lock and disables handles; **the server re-validates every saved
layout against the parent version**, so a crafted request cannot move a fixed element.

**Units.** Everything is millimetres. The canvas converts mm → px with a zoom factor;
the PDF converts mm → points (1 mm = 2.8346 pt). One coordinate system, no drift between
preview and print.

**Fonts.** A small registry (`FontKey`) maps to font files embedded in the PDF and loaded
as web fonts in the browser, guaranteeing identical metrics in both places.

---

## F. PDF generation

```
resolveTemplate()  ──▶  ResolvedElement[] (mm, plain values)
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   <LabelCanvas> (browser, SVG)       renderPdf() (server, pdf-lib)
```

- **Renderer interface:** `LabelRenderer { render(elements, size): Promise<Uint8Array> }`.
  `PdfLibRenderer` is the first implementation; ZPL (thermal printers) and PNG can be added
  later behind the same interface.
- **Vector everything.** Text is real text with embedded, subset fonts. Barcodes are drawn
  as filled rectangles from our Code 128 encoder (`src/lib/barcode/code128.ts`, already
  shipped in Phase 1). QR codes come from the `qrcode` package's matrix output and are
  drawn as rectangles. Nothing is rasterised, so labels stay sharp at 203/300/600 dpi.
- **Page size = label size.** A 4×6" template produces a 288 × 432 pt page. Sheet
  layouts (e.g. 2-up on A4/Letter) are an imposition step on top, not a different template.
- **Bulk.** Pages are appended to one document in chunks of 250; each chunk is saved to Blob,
  then merged. Memory stays flat regardless of row count.
- **Storage.** Output goes to private Vercel Blob; downloads go through
  `/api/labels/[id]/download`, which checks ownership before issuing a short-lived signed URL.
- **Testing.** Golden-file tests render fixtures and compare extracted text and element
  positions, so a refactor that shifts the barcode by 1 mm fails CI.

---

## G. Bulk CSV / Excel pipeline

```
1 Upload      client → signed Blob upload (max 20 MB)      bulk_uploads.status = uploaded
2 Detect      server reads header + first 50 rows           returns columns + samples
3 Map         user maps columns → template fields           auto-suggested by name similarity
4 Validate    Inngest job streams all rows through the       bulk_upload_rows written in
              template's Zod schema                          batches of 500
5 Review      totals, per-row errors, estimated cost         status = validated
6 Preview     render first 5 / 10 rows in the browser        no charge
7 Confirm     wallet hold for estimated amount               status = generating
8 Generate    Inngest job renders valid rows in chunks       progress via polling
9 Merge       chunk PDFs merged, uploaded                    hold settled as debit;
                                                             unused hold released
10 Deliver    notification + download link                   status = completed
```

Errors are stored per row as structured objects and shown as plain sentences:
*Row 231 — ZIP code is missing. Add a 5-digit ZIP in the "zip" column.*
Users can download an error CSV (original row + error column), fix it and re-upload only
the failed rows. Formula injection is prevented by prefixing cells starting with
`= + - @` with `'` in any CSV we export.

Idempotency: the confirm step carries an idempotency key, so a double click never charges
twice or generates two batches.

---

## H. Project folder structure

```
label-nova/
├─ ARCHITECTURE.md
├─ README.md
├─ .env.example
├─ drizzle.config.ts                      Phase 4
├─ next.config.ts
├─ public/
└─ src/
   ├─ app/
   │  ├─ (marketing)/                      landing & public pages
   │  │  ├─ layout.tsx
   │  │  └─ page.tsx
   │  ├─ (auth)/                           login, register, reset      Phase 2
   │  ├─ app/                              signed-in app                Phase 3+
   │  ├─ admin/                            admin console                Phase 10
   │  ├─ api/
   │  │  ├─ auth/[...all]/route.ts         Better Auth                  Phase 2
   │  │  ├─ v1/                            public REST API              Phase 11
   │  │  └─ inngest/route.ts               job endpoint                 Phase 8
   │  ├─ globals.css                       design tokens + base
   │  ├─ layout.tsx
   │  ├─ robots.ts
   │  └─ sitemap.ts
   ├─ components/
   │  ├─ ui/                               design-system primitives
   │  ├─ brand/                            logo, marks
   │  ├─ label/                            label rendering (shared by site + app)
   │  ├─ marketing/                        landing sections
   │  ├─ app/                              dashboard shell, tables    Phase 3
   │  └─ designer/                         label designer             Phase 6
   ├─ config/                              site, nav, plan display config
   ├─ domain/                              pure logic: template, pricing, validation
   ├─ lib/                                 small shared utilities (cn, barcode, format)
   └─ server/
      ├─ auth/                             session helpers, requirePermission()
      ├─ db/                               schema, client, queries, migrations, seed
      ├─ services/                         business logic per domain
      ├─ jobs/                             Inngest functions
      └─ pdf/                              renderers
```

---

## I. Design system

**Concept: "Printed precision."** The product's hero object is a thermal-printed label —
black ink on bright paper, exact measurements, nothing decorative. The interface borrows
that discipline: a cool paper-white canvas, true ink text, a single cobalt-violet accent
used for *interaction and selection only* (the colour you see when something is picked,
focused or about to happen), and millimetre-true label rendering as the signature element.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4F5F2` | App/page background — cool, not cream |
| `--surface` | `#FFFFFF` | Panels, the label itself |
| `--ink` | `#15171C` | Primary text, primary buttons |
| `--ink-muted` | `#5A606B` | Secondary text |
| `--line` | `#E1E3DE` | Borders, dividers |
| `--nova` | `#4338E0` | Accent: focus, selection, links, active state |
| `--nova-soft` | `#ECEBFC` | Selected backgrounds, highlight on label fields |
| `--success` / `--warning` / `--danger` / `--info` | `#17804F` / `#A86A12` / `#C33A2E` / `#2563C9` | Status only |

**Type.** Hanken Grotesk (variable, self-hosted) for everything in the interface — a
grotesk with slightly squared shapes that sits between technical and warm. JetBrains Mono
appears *only on the label itself* for tracking numbers and codes, where monospaced digits
are a functional requirement of the subject. Scale (rem): 0.8125 · 0.875 · 1 · 1.125 ·
1.375 · 1.75 · 2.5 · 3.5 · 4.75 (display, fluid via `clamp`). Headlines at 600 weight
with −2.5% tracking; body at 400, 1.55 line height, 68ch max measure.

**Shape and depth.** Radius is hierarchical, not uniform: 6 px controls, 10 px menus,
16 px panels, 3 px for labels (paper has near-square corners). Depth comes from 1 px
borders; a single "lifted" shadow is reserved for the label and floating menus.

**Motion.** One orchestrated moment on the landing page: the hero label feeds out of a
printer slot and its fields ink in. Everything else is response to user action
(hover, open, select) at 150–220 ms with `cubic-bezier(.2,.7,.2,1)`. All motion is
disabled under `prefers-reduced-motion`.

**Voice.** Plain verbs, sentence case, specific numbers. Buttons say what happens
("Generate PDF", not "Submit"). Errors say what went wrong and how to fix it.

**Components (Phase 1 ships the first six):** Button, Badge, Container, SectionHeader,
Logo, ShippingLabel/Barcode → Phase 3 adds Input, Select, Modal, Dropdown, Tooltip,
Toast, Card, Table/DataTable, Tabs, Sidebar, Topbar, ChartFrame, EmptyState, Skeleton.

---

## J. Development phases

| # | Phase | Exit criteria |
|---|---|---|
| 1 | Foundation, design system, landing page | `next build` passes; Lighthouse ≥ 95 perf/a11y on `/`; landing complete and responsive |
| 2 | Auth + roles | Register/login/reset work against Neon; `/app` redirects when signed out; role seeded |
| 3 | Dashboard shell | Sidebar/topbar/mobile nav; empty, loading, error states for every app route |
| 4 | Database | Full Drizzle schema, migrations, seed script, scoped query helpers + tests |
| 5 | Template system | Admin template builder; versions; field schemas; customer template library |
| 6 | Label designer | Canvas with drag/resize/snap, properties panel, locks enforced client + server |
| 7 | PDF generation | Single label → vector PDF, golden tests, secure download |
| 8 | Bulk processing | Full 10-step pipeline with Inngest, error CSV, merged PDF |
| 9 | Orders, wallet, billing | Ledger with holds, Stripe top-up, order lifecycle |
| 10 | Admin console | Users, network tree, pricing, payments, audit log viewer |
| 11 | Analytics + API | Charts, `/api/v1` with keys, rate limits, docs |
| 12 | Security, performance, tests | Authorization test suite per role, load test bulk path, CSP headers |
| 13 | Deployment | Vercel + Neon branches per preview, domain, monitoring |

Each phase ends with `npm run typecheck && npm run build` and a manual pass through the
screens touched.

---

## Phase 2 implementation notes (authentication and roles)

**Request path for a protected page**

```
browser ─▶ src/proxy.ts        no session cookie? → /login?next=…   (fast, optimistic only)
        ─▶ app/app/layout.tsx  requireActor(): validates session in DB, loads role + grants
        ─▶ app/app/page.tsx    requireActor() again (layouts are not a security boundary)
        ─▶ service function    assertPermission(actor, "users.read") and scopes the SQL
```

**Actor.** `getActor()` (`src/server/auth/session.ts`) runs once per request (React `cache`).
It reads user status, role and grants from the database on every request, so disabling a user
or changing a grant takes effect immediately. It does not wait for the session to expire.

**Route handlers** use `withActor(handler, { permission })`, which returns JSON 401/403.

**Scoping.** `listUsers` shows the pattern every later service follows. It checks the grant's
scope: `all` means no filter, `network` means a recursive CTE over `parent_user_id`, and `own`
means only the caller's own record.

**CSRF.** Better Auth rejects auth requests whose `Origin` isn't in `trustedOrigins`.
App mutations will use server actions, which Next.js protects with the same Origin check.

**Account safety.** Sign-in errors never reveal whether an email exists, and the reset
request always shows the same confirmation. Reset tokens expire in 1 hour, work once,
and revoke all other sessions. The sign-in, sign-up and reset endpoints are rate limited.

**Data scripts**

| Script | Safe in production | Purpose |
|---|---|---|
| `npm run db:migrate` | yes | Apply SQL migrations in `drizzle/` |
| `npm run db:bootstrap` | yes, idempotent | Roles, permissions, default grants (`--reset-grants` to restore defaults) |
| `npm run db:create-admin` | yes | First admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars |
| `npm run db:seed` | refuses | Demo users on `@demo.labelnova.dev` (requires `ALLOW_SEED=true`) |
