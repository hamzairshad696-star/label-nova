import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
const B = "http://localhost:3000"; const exe = await chromium.executablePath();
const q = (s) => execSync(`psql postgres://ln:ln@localhost:5432/labelnova -tAc "${s}"`).toString().trim();
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const custId = q("select id from users where email='amara@customer.test'");
async function phone(motion = "reduce") {
  const br = await pw.launch({ executablePath: exe, args: chromium.args });
  const p = await (await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: motion })).newPage();
  return { br, p };
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

// Keyboard-only sign-in (admin) on a phone-sized screen
q("delete from rate_limits");
let { br, p } = await phone();
await p.goto(B + "/login"); await p.screenshot({ path: "/tmp/m-login.png" });
ok("login page: no sideways scroll", (await overflow(p)) === 0);
const f0 = await p.evaluate(() => document.activeElement?.getAttribute("autocomplete"));
ok("email field focused on load", f0 === "email", f0);
await p.keyboard.type("hm621496@gmail.com");
await p.keyboard.press("Tab"); const f2 = await p.evaluate(() => document.activeElement?.getAttribute("autocomplete"));
ok("Tab: email → password", f2 === "current-password", f2);
await p.keyboard.type("LocalOnlyTestPw-123");
await p.keyboard.press("Tab"); const f3 = await p.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim());
ok("Tab: password → show/hide toggle", /show password/i.test(f3 ?? ""), f3);
await p.keyboard.press("Tab"); const f4 = await p.evaluate(() => document.activeElement?.textContent?.trim());
ok("Tab: → Sign in button", f4 === "Sign in", f4);
await p.keyboard.press("Enter");
await p.waitForURL((u) => u.pathname === "/admin", { timeout: 10000 });
ok("keyboard-only sign-in lands admin on /admin", new URL(p.url()).pathname === "/admin");
for (const path of ["/admin", "/admin/users", "/admin/users/new", `/admin/users/${custId}`, "/app"]) {
  await p.goto(B + path); await p.waitForTimeout(250);
  ok(`${path.replace(custId, ":id")}: no sideways scroll`, (await overflow(p)) === 0, `${await overflow(p)}px`);
}
await p.goto(B + "/admin/users"); await p.screenshot({ path: "/tmp/m-users.png" });
const tableScrolls = await p.evaluate(() => { const d = document.querySelector("table")?.parentElement; return d ? d.scrollWidth > d.clientWidth && getComputedStyle(d).overflowX === "auto" : false; });
ok("users table scrolls inside its own container", tableScrolls);
await p.goto(B + "/admin/users/new"); await p.screenshot({ path: "/tmp/m-new.png", fullPage: true });
await p.goto(B + "/admin");
await p.getByRole("button", { name: "Open navigation" }).click(); await p.waitForTimeout(200);
await p.screenshot({ path: "/tmp/m-drawer.png" });
ok("drawer shows navigation", await p.locator("#app-drawer").getByRole("link", { name: "Users" }).isVisible());
await p.keyboard.press("Escape"); await p.waitForTimeout(150);
ok("Escape closes drawer", await p.locator("#app-drawer").isHidden());
ok("focus returns to menu button", (await p.evaluate(() => document.activeElement?.getAttribute("aria-controls"))) === "app-drawer");
await p.locator('#app-drawer, header').first(); 
await p.getByRole("button", { name: "Open navigation" }).click();
await p.locator("#app-drawer").getByRole("link", { name: "Users" }).click();
await p.waitForURL(/\/admin\/users$/); await p.waitForTimeout(400); console.log("   drawer hidden after 400ms:", await p.locator("#app-drawer").isHidden(), "| expanded:", await p.getByRole("button", { name: /navigation/ }).getAttribute("aria-expanded"));
ok("drawer link navigates and drawer closes", await p.locator("#app-drawer").isHidden());
await br.close();

// First-sign-in welcome on a phone (motion on), mid-animation
const e = "mobile.probe@first.test";
q(`delete from users where email='${e}'`);
({ br, p } = await phone("no-preference"));
q("delete from rate_limits");
// create via admin session over the real UI is covered elsewhere; here reuse dealer but reset first-login state
q("delete from audit_logs where action='user.signed_in' and actor_user_id=(select id from users where email='ravi@reseller.test')");
await p.goto(B + "/login"); await p.getByLabel("Email").fill("ravi@reseller.test"); await p.getByLabel("Password", { exact: true }).fill("ResellerPass-2026");
await p.getByRole("button", { name: "Sign in" }).click(); await p.waitForURL(/welcome/); await p.waitForTimeout(1700);
await p.screenshot({ path: "/tmp/m-welcome.png" });
ok("welcome: no sideways scroll on phone", (await overflow(p)) === 0);
await p.waitForURL((u) => u.pathname === "/app", { timeout: 8000 });
await p.waitForTimeout(300); await p.screenshot({ path: "/tmp/m-app.png" });
ok("reseller lands on /app on phone", new URL(p.url()).pathname === "/app");
ok("/app: no sideways scroll", (await overflow(p)) === 0);
await br.close();
console.log(`---- ${pass} passed, ${fail} failed`);
