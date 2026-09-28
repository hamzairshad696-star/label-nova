#!/bin/bash
# Rehearse production's migration path LOCALLY: DB at 0000 + data → deploy-db applies the rest. Never touches production.
set -e
cd /home/claude/label-nova
P=postgres://ln:ln@localhost:5432; R=$P/ln_rehearsal
psql $P/postgres -qc "drop database if exists ln_rehearsal" -c "create database ln_rehearsal owner ln" 2>&1 | grep -v NOTICE || true
# 1) Bring it to exactly production's current state: migration 0000 only.
rm -rf /tmp/mig0 && mkdir -p /tmp/mig0/meta && cp drizzle/0000_*.sql /tmp/mig0/ && cp drizzle/meta/0000_snapshot.json /tmp/mig0/meta/
python3 -c "import json;j=json.load(open('drizzle/meta/_journal.json'));j['entries']=j['entries'][:1];json.dump(j,open('/tmp/mig0/meta/_journal.json','w'))"
cat > /home/claude/label-nova/scripts/.rehearse-mig0.ts <<'TS'
import { drizzle } from "drizzle-orm/node-postgres"; import { migrate } from "drizzle-orm/node-postgres/migrator"; import { Pool } from "pg";
(async () => { const pool = new Pool({ connectionString: process.env.R }); await migrate(drizzle(pool), { migrationsFolder: "/tmp/mig0" }); await pool.end(); })();
TS
R=$R npx tsx scripts/.rehearse-mig0.ts; rm -f scripts/.rehearse-mig0.ts
# 2) Production-shaped data in every 0000 table (copied from the local test DB).
pg_dump --data-only --disable-triggers -t users -t auth_accounts -t sessions -t verifications -t roles -t permissions -t role_permissions -t user_roles -t audit_logs -t rate_limits $P/labelnova | psql -q $R >/dev/null
# Match production exactly: it predates the users.reset_password permission (added in Phase 2).
psql $R -qc "delete from role_permissions where permission_id=(select id from permissions where key='users.reset_password'); delete from permissions where key='users.reset_password';"
echo "production-like permissions before deploy: $(psql $R -tAc 'select count(*) from permissions')"
rows(){ psql $R -tAc "select t from (select row_to_json(x)::text t from users x union all select row_to_json(x)::text from auth_accounts x union all select row_to_json(x)::text from sessions x union all select row_to_json(x)::text from roles x union all select row_to_json(x)::text from permissions x union all select row_to_json(x)::text from role_permissions x union all select row_to_json(x)::text from user_roles x union all select row_to_json(x)::text from audit_logs x) s order by t"; }
echo "before: migrations=$(psql $R -tAc 'select count(*) from drizzle.__drizzle_migrations') users=$(psql $R -tAc 'select count(*) from users') audit=$(psql $R -tAc 'select count(*) from audit_logs')"
rows > /tmp/rows-before.txt; H=$(psql $R -tAc "select md5(password) from auth_accounts a join users u on u.id=a.user_id where u.email='hm621496@gmail.com'")
# 3) The real deploy step, twice.
VERCEL_ENV=production DATABASE_URL=$R ADMIN_EMAIL=hm621496@gmail.com npx tsx scripts/deploy-db.ts
VERCEL_ENV=production DATABASE_URL=$R ADMIN_EMAIL=hm621496@gmail.com npx tsx scripts/deploy-db.ts | grep -E "Access|Admin"
echo "after:  migrations=$(psql $R -tAc 'select count(*) from drizzle.__drizzle_migrations') new tables=$(psql $R -tAc "select count(*) from information_schema.tables where table_schema='public' and table_name in ('shipments','shipment_events','wallet_ledger','carriers','carrier_services','pricing_rules','pricing_rule_changes')")/7"
rows > /tmp/rows-after.txt
MISSING=$(comm -23 /tmp/rows-before.txt /tmp/rows-after.txt | wc -l); ADDED=$(comm -13 /tmp/rows-before.txt /tmp/rows-after.txt)
[ "$MISSING" = "0" ] && echo "PASS  all $(wc -l < /tmp/rows-before.txt) pre-existing rows present and byte-identical" || echo "FAIL  $MISSING pre-existing rows changed or removed"
echo "rows added to existing tables: $(echo "$ADDED" | grep -c .)"; echo "$ADDED" | grep . | sed -E 's/"(id|role_id|permission_id|created_at)":"[^"]*",?//g' | cut -c1-150 | sed 's/^/   + /'
[ "$(psql $R -tAc "select md5(password) from auth_accounts a join users u on u.id=a.user_id where u.email='hm621496@gmail.com'")" = "$H" ] && echo "PASS  admin password hash unchanged"
echo "applied: $(psql $R -tAc "select string_agg(hash,'' order by id) is not null from drizzle.__drizzle_migrations") · tags on disk: $(ls drizzle/*.sql | xargs -n1 basename | tr '\n' ' ')"
[ "$(psql $R -tAc "select r.key||':'||rp.scope from role_permissions rp join roles r on r.id=rp.role_id join permissions p on p.id=rp.permission_id where p.key='users.reset_password'")" = "ADMIN:all" ] && echo "PASS  users.reset_password added for ADMIN only"
[ "$(psql $R -tAc "select nextval('label_number_seq')")" = "1" ] && echo "PASS  label_number_seq starts at 1"
for c in shipments_label_number_idx shipments_idempotency_idx; do [ "$(psql $R -tAc "select count(*) from pg_indexes where indexname='$c'")" = "1" ] && echo "PASS  unique index $c exists"; done
for t in wallet_ledger_no_update_delete pricing_rule_changes_no_update_delete pricing_rules_no_delete; do [ "$(psql $R -tAc "select count(*) from pg_trigger where tgname='$t'")" = "1" ] && echo "PASS  trigger $t exists"; done
[ "$(psql $R -tAc "select count(*) from shipments")" = "0" ] && [ "$(psql $R -tAc "select count(*) from wallet_ledger")" = "0" ] && [ "$(psql $R -tAc "select count(*) from pricing_rules")" = "0" ] && echo "PASS  new tables start empty — no demo data inserted"
psql $P/postgres -qc "drop database ln_rehearsal"
