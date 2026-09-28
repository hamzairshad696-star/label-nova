"""Replay genuine server-action requests as lower-privileged users. LOCAL test DB only."""
import json, subprocess, urllib.request, http.cookiejar
B="http://localhost:3000"; DB="postgres://ln:ln@localhost:5432/labelnova"
A=json.load(open("/tmp/actions.json")); CAP=json.load(open("/tmp/captured-action.json"))
q=lambda s: subprocess.run(["psql",DB,"-tAc",s],capture_output=True,text=True).stdout.strip()
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
def session(email,pw):
    q("delete from rate_limits")
    cj=http.cookiejar.CookieJar(); op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.open(urllib.request.Request(B+"/api/auth/sign-in/email",data=json.dumps({"email":email,"password":pw}).encode(),headers={"Content-Type":"application/json","Origin":B}))
    return "; ".join(f"{c.name}={c.value}" for c in cj)
def call(cookie,name,*args,path="/admin/users/new"):
    h={k:v for k,v in CAP["headers"].items() if k in ("next-router-state-tree","accept","content-type","user-agent")}
    h["next-action"]=A[name]; h["origin"]=B; h["referer"]=B+path
    if cookie: h["cookie"]=cookie
    r=urllib.request.Request(B+path,data=json.dumps(list(args)).encode(),headers=h,method="POST")
    try: resp=urllib.request.build_opener(NoRedir).open(r); body=resp.read().decode()
    except urllib.error.HTTPError as e: return {"blocked":f"HTTP {e.code} → {e.headers.get('location')}"}
    for line in body.splitlines():
        if line.startswith("1:"): return json.loads(line[2:])
    return {"raw":body[:100]}
uid=lambda e: q(f"select id from users where email='{e}'")
admin,dealer,reseller,cust=uid("hm621496@gmail.com"),uid("dana@dealer.test"),uid("ravi@reseller.test"),uid("amara@customer.test")
q(f"update user_roles set role_id=(select id from roles where key='RESELLER') where user_id='{reseller}'")  # e2e demoted him; restore
q("delete from users where email like '%@x.test'")
aS=session("hm621496@gmail.com","LocalOnlyTestPw-123"); cS=session("amara@customer.test","BrandNewPass-2026")
dS=session("dana@dealer.test","DealerPass-2026"); rS=session("ravi@reseller.test","ResellerPass-2026")
admin_hash=q(f"select md5(password) from auth_accounts where user_id='{admin}'")
res=[]
def expect(label,out,ok): res.append(bool(ok)); print(("PASS " if ok else "FAIL ")+label+"  → "+json.dumps(out)[:120])
refused=lambda o: o.get("ok") is False or "blocked" in o
new=lambda e,role,**k: {"name":"X","email":e,"role":role,"password":"AttackPass-2026",**k}

o=call(aS,"createAccountAction",new("control@x.test","CLIENT")); expect("CONTROL: replay as admin really executes",o,o.get("ok") is True and q("select count(*) from users where email='control@x.test'")=="1")
for path in ["/admin/users/new","/login","/request-access"]:
    e=f"anon{len(path)}@x.test"
    o=call(None,"createAccountAction",new(e,"DEALER"),path=path)
    expect(f"signed-out create via {path} creates nothing",o,q(f"select count(*) from users where email='{e}'")=="0")
for ck in ["__Secure-labelnova.session_token=forged.token","labelnova.session_token=forged.token"]:
    o=call(ck,"createAccountAction",new("forged@x.test","DEALER"))
    expect(f"forged cookie ({ck.split('.')[0]}) passes proxy but action refuses",o,o.get("ok") is False and q("select count(*) from users where email='forged@x.test'")=="0")
o=call(cS,"createAccountAction",new("c1@x.test","DEALER"),path="/app"); expect("customer cannot create a dealer",o,refused(o))
o=call(cS,"createAccountAction",new("c2@x.test","CLIENT"),path="/app"); expect("customer cannot create a customer",o,refused(o))
o=call(dS,"createAccountAction",new("d1@x.test","DEALER"),path="/app"); expect("dealer cannot create a dealer",o,refused(o))
o=call(dS,"createAccountAction",new("d0@x.test","RESELLER"),path="/app"); expect("dealer cannot create a reseller",o,refused(o))
o=call(dS,"createAccountAction",{**new("d3@x.test","CLIENT"),"role":"ADMIN"},path="/app"); expect("dealer cannot create an ADMIN (tampered role)",o,refused(o))
o=call(aS,"createAccountAction",{**new("a1@x.test","CLIENT"),"role":"ADMIN"}); expect("even admin cannot create ADMIN via action",o,refused(o))
o=call(dS,"createAccountAction",new("d2@x.test","CLIENT",parentUserId=reseller),path="/app")
expect("dealer's customer forced under dealer (parent spoof ignored)",o,o.get("ok") is True and q("select parent_user_id from users where email='d2@x.test'")==dealer)
o=call(dS,"changeRoleAction",cust,"DEALER",path="/app"); expect("dealer cannot change roles",o,refused(o))
o=call(dS,"setStatusAction",admin,"disabled",path="/app"); expect("dealer cannot disable the admin",o,refused(o))
o=call(dS,"resetPasswordAction",admin,"Hijacked-Pass-1",path="/app"); expect("dealer cannot set the admin's password",o,refused(o))
o=call(dS,"resetPasswordAction",cust,"Hijacked-Pass-1",path="/app"); expect("dealer cannot set own customer's password (not granted)",o,refused(o))
o=call(rS,"setStatusAction",cust,"disabled",path="/app"); expect("reseller cannot disable another network's customer",o,refused(o))
o=call(cS,"setStatusAction",cust,"disabled",path="/app"); expect("customer cannot disable own account",o,refused(o))
o=call(aS,"setStatusAction",admin,"disabled"); expect("admin cannot disable itself",o,refused(o))
o=call(aS,"changeRoleAction",admin,"CLIENT"); expect("admin cannot demote itself",o,refused(o))
o=call(aS,"changeRoleAction","not-a-uuid","DEALER"); expect("malformed id rejected cleanly",o,o.get("ok") is False)
o=call(aS,"createAccountAction",{"name":"<script>alert(1)</script>","email":"xss@x.test","role":"CLIENT","password":"AttackPass-2026"})
html=urllib.request.urlopen(urllib.request.Request(B+"/admin/users",headers={"cookie":aS})).read().decode()
expect("script-like names are escaped, never executable",o,o.get("ok") is True and "<script>alert(1)</script>" not in html and "&lt;script&gt;alert(1)" in html)
expect("admin still active, password hash unchanged",None,q(f"select status from users where id='{admin}'")=="active" and q(f"select md5(password) from auth_accounts where user_id='{admin}'")==admin_hash)
expect("admin still ADMIN",None,q(f"select r.key from user_roles ur join roles r on r.id=ur.role_id where ur.user_id='{admin}'")=="ADMIN")
expect("customer still active",None,q(f"select status from users where id='{cust}'")=="active")
expect("no privileged accounts created",None,q("select count(*) from users u join user_roles ur on ur.user_id=u.id join roles r on r.id=ur.role_id where u.email like '%@x.test' and r.key<>'CLIENT'")=="0")
print(f"---- {sum(res)} passed, {len(res)-sum(res)} failed")
