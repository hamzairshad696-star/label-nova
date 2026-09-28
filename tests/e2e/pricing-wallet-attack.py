"""Direct server-action attacks and race conditions for pricing + wallet. LOCAL test DB only."""
import json, subprocess, urllib.request, http.cookiejar, uuid, concurrent.futures as cf
B="http://localhost:3000"; DB="postgres://ln:ln@localhost:5432/labelnova"
A=json.load(open("/tmp/actions.json")); CAP=json.load(open("/tmp/captured-action.json"))
q=lambda s: subprocess.run(["psql",DB,"-tAc",s],capture_output=True,text=True).stdout.strip()
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
def session(email,pw):
    q("delete from rate_limits"); cj=http.cookiejar.CookieJar(); op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.open(urllib.request.Request(B+"/api/auth/sign-in/email",data=json.dumps({"email":email,"password":pw}).encode(),headers={"Content-Type":"application/json","Origin":B}))
    return "; ".join(f"{c.name}={c.value}" for c in cj)
def call(cookie,name,*args,path="/admin/pricing"):
    h={k:v for k,v in CAP["headers"].items() if k in ("next-router-state-tree","accept","content-type","user-agent")}
    h.update({"next-action":A[name],"origin":B,"referer":B+path}); 
    if cookie: h["cookie"]=cookie
    try: body=urllib.request.build_opener(NoRedir).open(urllib.request.Request(B+path,data=json.dumps(list(args)).encode(),headers=h,method="POST")).read().decode()
    except urllib.error.HTTPError as e: return {"blocked":e.code}
    for line in body.splitlines():
        if line.startswith("1:"): return json.loads(line[2:])
    return {"raw":body[:80]}
res=[]
def expect(label,out,okv): res.append(bool(okv)); print(("PASS " if okv else "FAIL ")+label+("  → "+json.dumps(out)[:110] if out is not None else ""))
refused=lambda o: o.get("ok") is False or "blocked" in o
aS=session("hm621496@gmail.com","LocalOnlyTestPw-123")
if not q("select id from users where email='dana@dealer.test'"):
    call(aS,"createAccountAction",{"name":"Dana Mercer","email":"dana@dealer.test","role":"DEALER","password":"DealerPass-2026"},path="/admin/users/new")
cS=session("nia@p4.test","NiaNewPassword-2026"); dS=session("dana@dealer.test","DealerPass-2026")
nia=q("select id from users where email='nia@p4.test'"); dana=q("select id from users where email='dana@dealer.test'")
svc=q("select id from carrier_services where key='standard'"); rule=q("select r.id from pricing_rules r join carrier_services s on s.id=r.service_id where s.key='standard' and r.weight_min_oz=17")
rules_before=q("select md5(string_agg(row_to_json(r)::text,'' order by id)) from pricing_rules r")
entry=lambda amt,typ="top_up",key=None,uid=nia: {"userId":uid,"type":typ,"amount":amt,"note":"attack test","idempotencyKey":key or str(uuid.uuid4())}
rule_in=lambda mn,mx,cu="1.00": {"serviceId":svc,"weightMinOz":str(mn),"weightMaxOz":str(mx),"customer":cu,"dealer":"1.00","reseller":"1.00"}

# ---- positive control
o=call(aS,"walletEntryAction",entry("1.00"),path="/admin/users"); expect("CONTROL: admin replay records an entry",o,o.get("ok") is True)
# ---- privilege attacks
for who,ck in [("customer",cS),("dealer",dS),("signed-out",None),("forged cookie","__Secure-labelnova.session_token=forged")]:
    o=call(ck,"walletEntryAction",entry("500.00"),path="/app"); expect(f"{who} cannot credit a wallet",o,refused(o))
    o=call(ck,"createRuleAction",rule_in(900,910,"0.01"),path="/app"); expect(f"{who} cannot create price rules",o,refused(o))
    o=call(ck,"updateRuleAction",rule,rule_in(17,32,"0.01"),path="/app"); expect(f"{who} cannot change a price",o,refused(o))
o=call(cS,"walletEntryAction",entry("500.00",uid=nia),path="/app"); expect("customer cannot credit their OWN wallet",o,refused(o))
expect("prices unchanged after attacks",None,q("select md5(string_agg(row_to_json(r)::text,'' order by id)) from pricing_rules r")==rules_before)
# ---- tampering (as admin)
o=call(aS,"createRuleAction",{**rule_in(900,910),"customer":"-5"}); expect("negative price rejected",o,refused(o))
o=call(aS,"createRuleAction",{**rule_in(900,910),"customer":"1e5"}); expect("scientific-notation price rejected",o,refused(o))
o=call(aS,"updateRuleAction",rule,{**rule_in(17,32),"serviceId":q("select id from carrier_services where key='ground_advantage'")}); expect("rule can't be moved to another service",o,refused(o))
o=call(aS,"walletEntryAction",entry("-50.00"),path="/admin/users"); expect("negative top-up rejected",o,refused(o))
o=call(aS,"walletEntryAction",entry("60000.00"),path="/admin/users"); expect("over-limit amount rejected",o,refused(o))
o=call(aS,"walletEntryAction",entry("5.00",uid=q("select id from users where email='hm621496@gmail.com'")),path="/admin/users"); expect("admin account has no wallet",o,refused(o))
o=call(aS,"walletEntryAction",{**entry("5.00"),"idempotencyKey":"not-a-uuid"},path="/admin/users"); expect("missing/invalid idempotency key rejected",o,refused(o))
# ---- idempotency
k=str(uuid.uuid4()); o1=call(aS,"walletEntryAction",entry("7.00",key=k),path="/admin/users"); o2=call(aS,"walletEntryAction",entry("7.00",key=k),path="/admin/users")
expect("same key twice → one entry, second reported as duplicate",o2,o1.get("ok") and "already recorded" in o2.get("message","") and q(f"select count(*) from wallet_ledger where idempotency_key='manual:{k}'")=="1")
o3=call(aS,"walletEntryAction",entry("7.00",key=k,uid=dana),path="/admin/users"); expect("reusing a key for another account refused",o3,refused(o3))
# ---- race: 10 parallel debits of $30 on a $100 wallet (fresh test customer)
q("delete from rate_limits")
cid=json.loads(json.dumps(call(aS,"createAccountAction",{"name":"Race Test","email":"race@p5.test","role":"CLIENT","password":"RacePassword-2026"},path="/admin/users/new")))["id"]
call(aS,"walletEntryAction",entry("100.00",uid=cid),path="/admin/users")
with cf.ThreadPoolExecutor(10) as ex: outs=list(ex.map(lambda _: call(aS,"walletEntryAction",entry("30.00","adjustment_debit",uid=cid),path="/admin/users"),range(10)))
okn=sum(1 for o in outs if o.get("ok")); bal=int(q(f"select sum(amount_cents) from wallet_ledger where user_id='{cid}'"))
expect(f"10 concurrent $30 debits on $100 → exactly 3 succeed, balance $10.00",{"succeeded":okn,"balance":bal},okn==3 and bal==1000)
k=str(uuid.uuid4())
with cf.ThreadPoolExecutor(10) as ex: list(ex.map(lambda _: call(aS,"walletEntryAction",entry("1.00",key=k,uid=cid),path="/admin/users"),range(10)))
expect("10 concurrent requests with one key → exactly 1 entry",None,q(f"select count(*) from wallet_ledger where idempotency_key='manual:{k}'")=="1")
# ---- race: 5 parallel overlapping rule creations
with cf.ThreadPoolExecutor(5) as ex: outs=list(ex.map(lambda i: call(aS,"createRuleAction",rule_in(500,520+i)),range(5)))
expect("5 concurrent overlapping rules → exactly 1 created",{"created":sum(1 for o in outs if o.get("ok"))},sum(1 for o in outs if o.get("ok"))==1 and q("select count(*) from pricing_rules where weight_min_oz=500")=="1")
expect("no wallet anywhere is negative",None,q("select count(*) from (select user_id from wallet_ledger group by user_id having sum(amount_cents)<0) x")=="0")
print(f"---- {sum(res)} passed, {len(res)-sum(res)} failed")
