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
| `pricing-and-wallet.mjs` | Carriers/services (label-only vs carrier postage), rule validation, live margin hints, overlap rejection, edit history before→after, deactivate/reactivate, DB-level no-delete/append-only; admin top-up and adjustments, below-zero refusal, customer sees entries |
| `pricing-wallet-attack.py` | Customers, dealers, signed-out and forged callers can't touch prices or wallets; tampering rejected; idempotent replays; 10 concurrent debits can't overspend; 5 concurrent overlapping rules → 1 |
| `label-test-setup.py` + `p5lib.py` | Creates the Phase 5 test accounts, funds and price catalog through the real server actions |
| `label-creation.mjs` | Wizard end to end: validation, tier price, postage refused, review maths, purchase checked in the DB (price, snapshot, one charge, empty carrier fields, valid label number), PDF decoded with zbar, all formats, isolation, price change mid-checkout, insufficient funds, phone layout |
| `label-purchase-attack.py` | Postage purchase, tampered prices, fake service, unprintable text, admin/signed-out/forged buyers refused; dealer tier price; quotes leak no internals; idempotent and concurrent purchases never overspend or double-charge |
| `a11y-create-label-wizard.mjs` | axe on every wizard step incl. error state; error linking, focus to step heading, arrow keys skip disabled postage, live-region success |
| `rehearse-migrations-local.sh` | Rebuilds production's state (migration 0000 + production-shaped data, without later permissions), runs the real deploy step twice, proves every pre-existing row is byte-identical and lists exactly what was added |
| `reset-local-domain.sh` | Removes LOCAL test accounts for one email domain (e.g. `p5.test`) |
| `reset-local-pricing.sh` | Clears the LOCAL pricing catalog |
| `run-all-local.sh` | Every suite, in order, from a clean local state |
| `reset-local-test-users.sh` | Removes `*.test` accounts from the LOCAL database (bypasses the ledger's append-only trigger for that one transaction) |
| `mobile-keyboard.mjs` | 390px layouts without sideways scroll, keyboard-only sign-in order, drawer open/Escape/focus return |

Browser suites use a separate browser instance per person: the headless Chromium used here runs
`--single-process`, which does not isolate cookies between contexts.
