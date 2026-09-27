import asyncio, re, subprocess, itertools
from playwright.async_api import async_playwright
import os
BASE=os.environ.get("BASE_URL","http://localhost:3000"); PW="LabelNova-demo-2026"
ip = (f"10.0.0.{i}" for i in itertools.count(10))
results=[]
def check(name, ok, detail=""):
    results.append(ok); print(("PASS " if ok else "FAIL ")+name+(" — "+str(detail) if detail and not ok else ""))

async def ctx(b, w=1280, h=860):
    return await b.new_context(viewport={"width":w,"height":h}, extra_http_headers={"x-forwarded-for": next(ip)})

async def login(pg, email, pw):
    await pg.goto(BASE+"/login"); await pg.get_by_label("Email").fill(email)
    await pg.get_by_label("Password", exact=True).fill(pw); await pg.get_by_role("button", name="Log in").click()

async def main():
    subprocess.run(['su','postgres','-c','psql -d labelnova -qc "delete from users where email in (\'test.person@example.com\', \'client@demo.labelnova.dev\'); delete from rate_limits;"'])
    subprocess.run("cd . && ALLOW_SEED=true npm run db:seed >/dev/null 2>&1", shell=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()

        # 1 register
        c = await ctx(b); pg = await c.new_page()
        await pg.goto(BASE+"/app"); check("signed-out /app redirects to login with next", "/login?next=%2Fapp" in pg.url, pg.url)
        await pg.goto(BASE+"/register")
        await pg.get_by_role("button", name="Create account").click()
        check("register shows inline validation", await pg.get_by_text("Enter your full name.").is_visible())
        await pg.get_by_label("Full name").fill("Test Person"); await pg.get_by_label("Work email").fill("test.person@example.com")
        await pg.get_by_label("Password", exact=True).fill("short"); await pg.get_by_role("button", name="Create account").click()
        check("short password rejected client-side", await pg.get_by_text("Use at least 10 characters.").is_visible())
        await pg.get_by_label("Password", exact=True).fill("a-good-long-password"); await pg.get_by_role("button", name="Create account").click()
        await pg.wait_for_url(BASE+"/app", timeout=15000)
        check("register signs in and lands on /app", await pg.get_by_text("Welcome, Test.").is_visible())
        check("new user is CLIENT", await pg.get_by_text("You're signed in as client").is_visible())
        await pg.screenshot(path="/tmp/labelnova-app.png", full_page=True)
        r = await pg.request.get(BASE+"/api/users"); check("client GET /api/users is 403", r.status==403, r.status)
        r = await pg.request.get(BASE+"/api/me"); check("client GET /api/me is 200", r.status==200 and (await r.json())["role"]=="CLIENT")
        await pg.goto(BASE+"/admin"); check("client sees 403 on /admin", await pg.get_by_text("You don't have access to this page.").is_visible())
        await pg.screenshot(path="/tmp/labelnova-403.png")
        await pg.goto(BASE+"/login"); check("signed-in user skips login page", pg.url.endswith("/app"), pg.url)
        await pg.get_by_role("button", name="Log out").click(); await pg.wait_for_url(re.compile(r".*/login$"))
        await pg.goto(BASE+"/app"); check("after logout /app redirects", "/login" in pg.url)
        # duplicate registration
        await pg.goto(BASE+"/register"); await pg.get_by_label("Full name").fill("Again"); await pg.get_by_label("Work email").fill("test.person@example.com")
        await pg.get_by_label("Password", exact=True).fill("a-good-long-password"); await pg.get_by_role("button", name="Create account").click()
        await pg.wait_for_timeout(1500); t = await pg.locator("[role=alert]").first.inner_text()
        check("duplicate email gives actionable error", "already exists" in t, t)
        await c.close()

        # 2 wrong password + open redirect
        c = await ctx(b); pg = await c.new_page()
        await login(pg, "client@demo.labelnova.dev", "wrong-password-123"); await pg.wait_for_timeout(1500)
        t = await pg.locator("[role=alert]").first.inner_text(); check("wrong password message", "don't match" in t, t)
        await pg.screenshot(path="/tmp/labelnova-login-error.png")
        await pg.goto(BASE+"/login?next=https://evil.example/steal")
        await pg.get_by_label("Email").fill("client@demo.labelnova.dev"); await pg.get_by_label("Password", exact=True).fill(PW)
        await pg.get_by_role("button", name="Log in").click(); await pg.wait_for_url(re.compile(r".*/app$"), timeout=15000)
        check("open redirect blocked, lands on /app", pg.url==BASE+"/app", pg.url)
        await c.close()

        # 3 dealer network scope
        c = await ctx(b); pg = await c.new_page(); await login(pg, "dealer@demo.labelnova.dev", PW); await pg.wait_for_url(BASE+"/app")
        data = (await (await pg.request.get(BASE+"/api/users")).json())["data"]
        emails = sorted(u["email"] for u in data)
        check("dealer sees only their network", emails==["client@demo.labelnova.dev","reseller@demo.labelnova.dev"], emails)
        await pg.goto(BASE+"/admin"); check("dealer blocked from /admin", await pg.get_by_text("You don't have access").is_visible())
        await c.close()

        # 4 next param honoured + admin
        c = await ctx(b); pg = await c.new_page(); await pg.goto(BASE+"/admin")
        await pg.get_by_label("Email").fill("admin@demo.labelnova.dev"); await pg.get_by_label("Password", exact=True).fill(PW)
        await pg.get_by_role("button", name="Log in").click(); await pg.wait_for_url(BASE+"/admin", timeout=15000)
        check("login returns to requested /admin", True)
        rows = await pg.locator("tbody tr").count(); check("admin sees all 5 users", rows==5, rows)
        check("audit shows registration", await pg.get_by_text("user.registered").first.is_visible())
        await pg.screenshot(path="/tmp/labelnova-admin.png", full_page=True)
        await c.close()

        # 5 forgot + reset
        c = await ctx(b); pg = await c.new_page(); await pg.goto(BASE+"/forgot-password")
        await pg.get_by_label("Email").fill("client@demo.labelnova.dev"); await pg.get_by_role("button", name="Send reset link").click()
        await pg.get_by_text("Check your email").wait_for(timeout=10000); check("forgot shows neutral confirmation", True)
        await pg.wait_for_timeout(800)
        log = open(os.environ.get("SERVER_LOG","/tmp/app.log")).read(); urls = re.findall(r"https?://\S+/reset-password/\S+", log)
        check("reset email generated", len(urls)>0)
        await pg.goto(urls[-1]); check("reset link lands on form", "/reset-password?token=" in pg.url, pg.url)
        await pg.get_by_label("New password", exact=True).fill("brand-new-password-1"); await pg.get_by_label("Confirm new password").fill("brand-new-password-2")
        await pg.get_by_role("button", name="Save new password").click()
        check("mismatch caught", await pg.get_by_text("Passwords don't match.").is_visible())
        await pg.get_by_label("Confirm new password").fill("brand-new-password-1"); await pg.get_by_role("button", name="Save new password").click()
        await pg.wait_for_url(re.compile(r".*/login\?reset=1"), timeout=15000)
        check("reset success notice", await pg.get_by_text("Password updated").is_visible())
        await pg.goto(urls[-1])
        check("reused reset link is rejected", await pg.get_by_text("This reset link doesn't work").is_visible(), pg.url)
        await pg.screenshot(path="/tmp/labelnova-reset-used.png")
        await c.close()
        c = await ctx(b); pg = await c.new_page(); await login(pg, "client@demo.labelnova.dev", "brand-new-password-1")
        await pg.wait_for_url(BASE+"/app", timeout=15000); check("login with new password", True); await c.close()
        c = await ctx(b); pg = await c.new_page(); await login(pg, "client@demo.labelnova.dev", PW); await pg.wait_for_timeout(1500)
        check("old password rejected", "don't match" in await pg.locator("[role=alert]").first.inner_text()); await c.close()

        # 6 disabled account: live session revoked + login blocked
        c = await ctx(b); pg = await c.new_page(); await login(pg, "reseller@demo.labelnova.dev", PW); await pg.wait_for_url(BASE+"/app")
        subprocess.run(["su","postgres","-c","psql -d labelnova -qc \"update users set status='disabled' where email='reseller@demo.labelnova.dev'\""])
        await pg.goto(BASE+"/app"); check("disabled user's live session stops working", "/login" in pg.url, pg.url)
        await c.close()
        c = await ctx(b); pg = await c.new_page(); await login(pg, "reseller@demo.labelnova.dev", PW); await pg.wait_for_timeout(1500)
        t = await pg.locator("[role=alert]").first.inner_text(); check("disabled user cannot log in", "disabled" in t, t)
        subprocess.run(["su","postgres","-c","psql -d labelnova -qc \"update users set status='active' where email='reseller@demo.labelnova.dev'\""])
        await c.close()

        # 7 rate limit (same IP)
        c = await b.new_context(extra_http_headers={"x-forwarded-for":"10.9.9.9"}); pg = await c.new_page()
        for i in range(6):
            await login(pg, "admin@demo.labelnova.dev", f"bad-password-{i}"); await pg.wait_for_timeout(700)
        t = await pg.locator("[role=alert]").first.inner_text(); check("6th rapid attempt is rate limited", "Too many attempts" in t, t)
        await c.close()

        # screenshots
        c = await ctx(b, 1440, 900); pg = await c.new_page(); await pg.goto(BASE+"/login"); await pg.screenshot(path="/tmp/labelnova-login.png"); await c.close()
        c = await ctx(b, 390, 844); pg = await c.new_page(); await pg.goto(BASE+"/register"); await pg.screenshot(path="/tmp/labelnova-register-m.png"); await c.close()
        await b.close()
    print(f"\n{sum(results)}/{len(results)} passed")
asyncio.run(main())
