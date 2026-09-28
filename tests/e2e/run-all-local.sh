#!/bin/bash
# Full LOCAL regression from a clean test state.
cd /home/claude/label-nova
echo "== typecheck"; npx tsc --noEmit && echo OK
echo "== unit"; npm test 2>&1 | grep -E "^# (pass|fail)"
echo "== build+serve"; /tmp/serve.sh | tail -1
python3 - <<'PY'
import json; m=json.load(open('.next/server/server-reference-manifest.json'))
json.dump({(i.get('exportedName') or i.get('name')):a for a,i in m['node'].items()},open('/tmp/actions.json','w'))
PY
bash /tmp/reset-local-test-users.sh; bash /tmp/reset-local-pricing.sh; psql postgres://ln:ln@localhost:5432/labelnova -qc "delete from rate_limits"
cd /tmp/pw
echo "== security";              /tmp/security.sh | tail -1
echo "== accounts+welcome";      timeout 400 node e2e.mjs 2>&1 | grep -E "FAIL|----"
echo "== authz attack";          timeout 60 node capture.mjs >/dev/null 2>&1; python3 /tmp/attack.py | grep -E "FAIL|----"
echo "== customer dashboard";    timeout 400 node phase4.mjs 2>&1 | grep -E "FAIL|----"
echo "== pricing + wallet UI";   timeout 500 node pricing.mjs 2>&1 | grep -E "FAIL|----"
echo "== pricing + wallet attack"; python3 /tmp/pricing-attack.py | grep -E "FAIL|----"
echo "== a11y public";  timeout 240 node audit.mjs > /tmp/a11y-pub.txt 2>&1; echo "clean: $(grep -E '│ [0-9]' /tmp/a11y-pub.txt | grep -c "'none'") of $(grep -cE '│ [0-9]' /tmp/a11y-pub.txt)"
echo "== a11y signed-in"; timeout 400 node a11y.mjs > /tmp/a11y-out.txt 2>&1; echo "clean: $(grep -E '│ [0-9]' /tmp/a11y-out.txt | grep -c "'none'") of $(grep -cE '│ [0-9]' /tmp/a11y-out.txt)"; grep -E "^/" /tmp/a11y-out.txt | cut -c1-200
echo "== mobile+keyboard"; timeout 300 node mobile2.mjs 2>&1 | grep -E "FAIL|----"
