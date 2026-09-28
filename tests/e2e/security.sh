#!/bin/bash
# Security regression suite. Prints PASS/FAIL per check.
B=http://localhost:3000; DB=postgres://ln:ln@localhost:5432/labelnova
H=(-H "Content-Type: application/json" -H "Origin: http://localhost:3000")
pass=0; fail=0
check(){ if [ "$2" = "$3" ]; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1 (got '$2', want '$3')"; fail=$((fail+1)); fi; }
check "public sign-up API rejected" "$(curl -s -o /dev/null -w %{http_code} "${H[@]}" -d '{"name":"X","email":"attacker@example.com","password":"SomePassword123"}' $B/api/auth/sign-up/email)" 400
check "no user row created by sign-up" "$(psql $DB -tAc "select count(*) from users where email='attacker@example.com'")" 0
check "/register redirects to /request-access" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' $B/register)" "308 $B/request-access"
check "wrong password rejected" "$(curl -s -o /dev/null -w %{http_code} "${H[@]}" -d '{"email":"hm621496@gmail.com","password":"wrong-password-1"}' $B/api/auth/sign-in/email)" 401
check "admin sign-in works" "$(curl -s -o /dev/null -w %{http_code} "${H[@]}" -c /tmp/cj -d '{"email":"hm621496@gmail.com","password":"LocalOnlyTestPw-123"}' $B/api/auth/sign-in/email)" 200
check "admin role from /api/me" "$(curl -s -b /tmp/cj $B/api/me | python3 -c 'import sys,json;print(json.load(sys.stdin)["role"])')" ADMIN
check "admin can open /admin" "$(curl -s -b /tmp/cj -o /dev/null -w %{http_code} $B/admin)" 200
check "signed-out /admin redirects to login" "$(curl -s -o /dev/null -w '%{http_code}' $B/admin)" 307
check "signed-out /api/users is 401" "$(curl -s -o /dev/null -w %{http_code} $B/api/users)" 401
check "open redirect blocked (next=//evil.com)" "$(curl -s -b /tmp/cj -o /dev/null -w '%{redirect_url}' "$B/login?next=//evil.com" | grep -c evil)" 0
[ -x /tmp/security-extra.sh ] && . /tmp/security-extra.sh
echo "---- $pass passed, $fail failed"
