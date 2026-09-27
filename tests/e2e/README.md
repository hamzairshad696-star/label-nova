# Auth end-to-end suite

29 checks covering registration, login, logout, password reset, open-redirect
protection, role and network scoping, disabled accounts and rate limiting.
It runs against a real server and a local Postgres whose demo data it resets.
Never point it at production.

```bash
pip install playwright && playwright install chromium
# .env.local must contain EMAIL_TRANSPORT=console so reset links reach the log
npm run build && node --env-file=.env.local node_modules/next/dist/bin/next start > /tmp/app.log 2>&1 &
BASE_URL=http://localhost:3000 SERVER_LOG=/tmp/app.log python3 tests/e2e/auth_flow.py
```

The script uses `su postgres -c psql` for its setup steps; adjust those lines if
your local Postgres runs differently.
