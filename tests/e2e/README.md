# End-to-end suites

**Local only.** These suites create, disable and delete accounts, clear the sign-in rate limiter
and edit roles directly in the database. Never point them at production or a shared database.
They expect `postgres://ln:ln@localhost:5432/labelnova` and a server on `http://localhost:3000`.

| Suite | What it proves |
|---|---|
| `security.sh` | Public sign-up blocked, `/register` redirect, wrong password rejected, admin access, signed-out API 401, open-redirect blocked |
| `accounts-and-welcome.mjs` | Admin creates each role through the UI; validation; each role's welcome screen, timing and landing page; network isolation; disable/enable, password reset, role change; admin self-protection |
| `authz-attack.py` | Replays genuine server-action requests (captured by `capture-action.mjs`) as signed-out, forged-cookie, customer, dealer and reseller callers. Includes a positive control proving replays execute |
| `a11y-public.mjs`, `a11y-signed-in.mjs` | axe-core WCAG 2 A/AA + best practice on every public, auth and signed-in page, per role |
| `customer-dashboard.mjs` | Honest empty states; balance, month spend and counts computed from real ledger/shipment rows; per-customer isolation; profile and password change with audit (failed attempts not logged); other devices signed out; `/update-user` cannot touch status, parent, email, verification or role; 390px layouts |
| `reset-local-test-users.sh` | Removes `*.test` accounts from the LOCAL database (bypasses the ledger's append-only trigger for that one transaction) |
| `mobile-keyboard.mjs` | 390px layouts without sideways scroll, keyboard-only sign-in order, drawer open/Escape/focus return |

Browser suites use a separate browser instance per person: the headless Chromium used here runs
`--single-process`, which does not isolate cookies between contexts.
