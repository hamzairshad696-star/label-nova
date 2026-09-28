import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
// LOCAL test DB only: the sign-in limiter (5/min/IP) would otherwise block a test that signs in many times.
const clearLimiter = () => execSync(`psql postgres://ln:ln@localhost:5432/labelnova -qc "delete from rate_limits"`);
const B = "http://localhost:3000";
const exe = await chromium.executablePath();
const browsers = [];
const b = { newContext: async (o) => { const br = await pw.launch({ executablePath: exe, args: chromium.args }); browsers.push(br); return br.newContext(o); }, close: async () => Promise.all(browsers.map((x) => x.close())) };
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };
const ctx = async (reduce = true) => b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduce ? "reduce" : "no-preference" });

async function signIn(page, email, password, { expectFail = false } = {}) {
  clearLimiter();
  await page.goto(B + "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (expectFail) { await page.getByText(/disabled|incorrect|invalid|wrong/i).first().waitFor({ timeout: 8000 }).catch(() => {}); return; }
  await page.waitForURL(/\/welcome/, { timeout: 10000 });
  const tw = Date.now();
  const title = await page.locator("h1").innerText();
  const line = await page.locator('[role="status"]').innerText();
  const mode = await page.locator(".ln-welcome").getAttribute("data-mode");
  await page.waitForURL(u => !u.pathname.startsWith("/welcome"), { timeout: 10000 });
  return { title, line, mode, landed: new URL(page.url()).pathname, welcomeMs: Date.now() - tw };
}

// ---- Admin
const admin = await (await ctx()).newPage();
let w = await signIn(admin, "hm621496@gmail.com", "LocalOnlyTestPw-123");
ok("admin sees returning welcome", w.mode === "quick" && w.title.startsWith("Welcome back"), `${w.title} / ${w.line}`);
ok("admin lands on /admin", w.landed === "/admin", w.landed);

async function create(fields) {
  await admin.goto(B + "/admin/users/new");
  await admin.getByLabel("Full name").fill(fields.name);
  await admin.getByLabel("Email").fill(fields.email);
  if (fields.company) await admin.getByLabel("Company").fill(fields.company);
  await admin.getByLabel("Role").selectOption(fields.role);
  if (fields.parent) {
    const value = await admin.getByLabel("Belongs to").locator("option", { hasText: fields.parent }).getAttribute("value");
    await admin.getByLabel("Belongs to").selectOption(value);
  }
  await admin.getByLabel("Password").fill(fields.password);
  await admin.getByRole("button", { name: "Create account" }).click();
  await admin.waitForTimeout(1500);
  return admin.url();
}
let url = await create({ name: "Dana Mercer", email: "dana@dealer.test", company: "Mercer Logistics", role: "DEALER", password: "DealerPass-2026" });
ok("admin creates dealer", /\/admin\/users\/[0-9a-f-]{36}\?created=1/.test(url));
url = await create({ name: "Ravi Shah", email: "ravi@reseller.test", role: "RESELLER", password: "ResellerPass-2026" });
ok("admin creates reseller", /created=1/.test(url));
url = await create({ name: "Amara Okafor", email: "amara@customer.test", company: "Harbor & Pine", role: "CLIENT", parent: "Dana Mercer", password: "CustomerPass-2026" });
ok("admin creates customer under dealer", /created=1/.test(url));
const detail = await admin.locator("dl").innerText();
ok("customer detail shows parent dealer", detail.includes("Dana Mercer"));

url = await create({ name: "Dup", email: "dana@dealer.test", role: "CLIENT", password: "SomePassword-1" });
ok("duplicate email rejected", !/created=1/.test(url) && (await admin.getByText("An account with this email already exists.").count()) > 0);
url = await create({ name: "Shorty", email: "short@test.test", role: "CLIENT", password: "short" });
ok("short password rejected", !/created=1/.test(url) && (await admin.getByText(/at least 10 characters/).count()) > 0);
await admin.goto(B + "/admin/users/new");
await admin.getByRole("button", { name: "Generate" }).click();
const gen = await admin.getByLabel("Password").inputValue();
ok("password generator gives 16 chars", gen.length === 16, gen.replace(/./g, "•"));
const roleOptions = await admin.getByLabel("Role").locator("option").allInnerTexts();
ok("Admin role not offered in create form", !roleOptions.some(o => /admin/i.test(o)), roleOptions.join(","));

await admin.goto(B + "/admin/users?role=DEALER");
ok("role filter shows only dealers", (await admin.locator("tbody tr").count()) === 1);

// ---- Dealer first sign-in (full animation, motion on)
const dealer = await (await ctx(false)).newPage();
w = await signIn(dealer, "dana@dealer.test", "DealerPass-2026");
const dt = w.welcomeMs;
ok("dealer first sign-in shows full welcome", w.mode === "full" && w.title === "Welcome to Label Nova", `${w.title} / ${w.line}`);
ok("dealer line is role-specific", w.line === "Your dealer network is ready.");
ok("dealer lands on /app", w.landed === "/app");
ok("first-login welcome takes 2.3–3.2s", dt > 2300 && dt < 3200, `${dt}ms`);
ok("dealer dashboard lists their customer", (await dealer.getByText("Amara Okafor").count()) > 0);
ok("dealer does not see reseller's data", (await dealer.getByText("Ravi Shah").count()) === 0);
await dealer.goto(B + "/admin/users");

ok("dealer blocked from /admin/users", (await dealer.getByText("You don't have access to this page.").count()) > 0);
ok("dealer cannot see admin user list", (await dealer.getByText("hm621496@gmail.com").count()) === 0);

// Dealer signs out and in again → quick mode
await dealer.context().clearCookies();
w = await signIn(dealer, "dana@dealer.test", "DealerPass-2026");
ok("second sign-in uses quick welcome", w.mode === "quick" && w.title === "Welcome back, Dana");
ok("quick welcome takes under 1.3s", w.welcomeMs < 1300, `${w.welcomeMs}ms`);

// ---- Customer
const cust = await (await ctx()).newPage();
clearLimiter();
await cust.goto(B + "/login?next=/admin");
await cust.getByLabel("Email").fill("amara@customer.test");
await cust.getByLabel("Password", { exact: true }).fill("CustomerPass-2026");
await cust.getByRole("button", { name: "Sign in" }).click();
await cust.waitForURL(u => u.pathname === "/app", { timeout: 10000 }).catch(() => {});
ok("customer asking for /admin is routed to /app", new URL(cust.url()).pathname === "/app", cust.url());
ok("customer sees command center", (await cust.getByRole("heading", { name: "Shipping command center" }).count()) === 1);
await cust.goto(B + "/login?next=//evil.com");

ok("signed-in user at /login with evil next stays on site", new URL(cust.url()).host === "localhost:3000", cust.url());

// ---- Admin disables customer → customer is signed out immediately
await admin.goto(B + "/admin/users?role=CLIENT");

await admin.getByRole("link", { name: "Amara Okafor" }).click();
await admin.waitForURL(/\/admin\/users\/[0-9a-f-]{36}/);
admin.once("dialog", d => d.accept());
await admin.getByRole("button", { name: "Disable account" }).click();
await admin.getByText("Account disabled.").waitFor({ timeout: 8000 });
ok("admin disables customer", true);
await cust.goto(B + "/app");
ok("disabled customer's session ends immediately", new URL(cust.url()).pathname === "/login");
const c2 = await (await ctx()).newPage();
await signIn(c2, "amara@customer.test", "CustomerPass-2026", { expectFail: true });
ok("disabled customer cannot sign in", (await c2.getByText(/disabled/i).count()) > 0 && new URL(c2.url()).pathname === "/login");
await admin.getByRole("button", { name: "Enable account" }).click();
await admin.getByText("Account enabled.").waitFor({ timeout: 8000 });

// ---- Admin sets a new password
await admin.getByRole("textbox", { name: "New password" }).fill("BrandNewPass-2026");
await admin.getByRole("button", { name: "Set password" }).click();
await admin.getByText(/Password updated/).waitFor({ timeout: 8000 });
const c3 = await (await ctx()).newPage();
await signIn(c3, "amara@customer.test", "CustomerPass-2026", { expectFail: true });
ok("old password stops working", new URL(c3.url()).pathname === "/login");
w = await signIn(c3, "amara@customer.test", "BrandNewPass-2026");
ok("new password works", w.landed === "/app");

// ---- Role change: reseller → customer, history recorded
await admin.goto(B + "/admin/users?role=RESELLER");
await admin.getByRole("link", { name: "Ravi Shah" }).click();
await admin.waitForURL(/\/admin\/users\/[0-9a-f-]{36}/);
await admin.getByRole("combobox", { name: "New role" }).selectOption("CLIENT");
await admin.getByRole("button", { name: "Change role" }).click();
await admin.getByText("Role updated.").waitFor({ timeout: 8000 });
await admin.reload();
ok("role change recorded in history", (await admin.getByText("Role changed").count()) > 0);

// ---- Admin can't manage itself
await admin.goto(B + "/admin/users?role=ADMIN");
await admin.getByRole("link", { name: "Administrator" }).click();
await admin.waitForURL(/\/admin\/users\/[0-9a-f-]{36}/);
ok("admin account can't be changed from console", (await admin.getByText(/can't change your own/).count()) > 0);

console.log(`---- ${pass} passed, ${fail} failed`);
await b.close();
