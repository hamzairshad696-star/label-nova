import json, subprocess, urllib.request, http.cookiejar, uuid
B="http://localhost:3000"; DB="postgres://ln:ln@localhost:5432/labelnova"
A=json.load(open("/tmp/actions.json")); CAP=json.load(open("/tmp/captured-action.json"))
q=lambda s: subprocess.run(["psql",DB,"-tAc",s],capture_output=True,text=True).stdout.strip()
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
def session(email,pw):
    q("delete from rate_limits"); cj=http.cookiejar.CookieJar(); op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.open(urllib.request.Request(B+"/api/auth/sign-in/email",data=json.dumps({"email":email,"password":pw}).encode(),headers={"Content-Type":"application/json","Origin":B}))
    return "; ".join(f"{c.name}={c.value}" for c in cj)
def call(cookie,name,*args,path="/app"):
    h={k:v for k,v in CAP["headers"].items() if k in ("next-router-state-tree","accept","content-type","user-agent")}
    h.update({"next-action":A[name],"origin":B,"referer":B+path})
    if cookie: h["cookie"]=cookie
    try: body=urllib.request.build_opener(NoRedir).open(urllib.request.Request(B+path,data=json.dumps(list(args)).encode(),headers=h,method="POST")).read().decode()
    except urllib.error.HTTPError as e: return {"blocked":e.code}
    for line in body.splitlines():
        if line.startswith("1:"): return json.loads(line[2:])
    return {"raw":body[:80]}
def get(cookie,path):
    h={"cookie":cookie} if cookie else {}
    try: r=urllib.request.build_opener(NoRedir).open(urllib.request.Request(B+path,headers=h)); return r.status, r.headers.get("content-type",""), r.read()
    except urllib.error.HTTPError as e: return e.code, e.headers.get("content-type",""), e.read()
