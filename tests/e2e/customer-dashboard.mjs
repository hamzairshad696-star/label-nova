import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
const B = "http://localhost:3000"; const exe = await chromium.executablePath();
const DB = "postgres://ln:ln@localhost:5432/labelnova";
const q = (s) => execSync(`psql ${DB} -tAc "${s.replace(/"/g, '\\"')}"`).toString().trim();
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const browsers = [];
async function signedIn(email, pwd, vp = { width: 1280, height: 900 }) {
  const br = await pw.launch({ executablePath: exe, args: chromium.args }); browsers.push(br);
  const p = await (await br.newContext({ viewport: vp, reducedMotion: "reduce" })).newPage();
  q("delete from rate_limits");
  await p.goto(B + "/login"); await p.getByLabel("Email").fill(email); await p.getByLabel("Password", { exact: true }).fill(pwd);
  await p.getByRole("button", { name: "Sign in" }).click(); await p.waitForURL((u) => !/login|welcome/.test(u.pathname), { timeout: 10000 });
  return p;
}
async function adminCreate(p, name, email, role, password) {
  await p.goto(B + "/admin/users/new");
  await p.getByLabel("Full name").fill(name); await p.getByLabel("Email").fill(email);
  await p.getByLabel("Role").selectOption(role); await p.getByLabel("Password").fill(password);
  await p.getByRole("button", { name: "Create account" }).click(); await p.waitForURL(/created=1/, { timeout: 10000 });
}
const admin = await signedIn("hm621496@gmail.com", "LocalOnlyTestPw-123");
await adminCreate(admin, "Nia Brooks", "nia@p4.test", "CLIENT", "NiaPassword-2026");
await adminCreate(admin, "Omar Diaz", "omar@p4.test", "CLIENT", "OmarPassword-2026");

// ---- Fresh customer: honest zeros and empty states
const nia = await signedIn("nia@p4.test", "NiaPassword-2026");
let body = await nia.locator("main").innerText();
ok("fresh customer lands on command center", body.includes("Shipping command center"));
ok("fresh balance is $0.00 (real, from empty ledger)", body.includes("Wallet balance") && body.includes("$0.00"));
ok("empty shipments state shown", body.includes("No shipments yet."));
ok("Create label is a working link (Phase 5)", (await nia.getByRole("link", { name: "Create label" }).first().getAttribute("href")) === "/app/create-label");
const soon = await nia.locator("aside nav [aria-disabled=true]").allInnerTexts();
ok("unbuilt features shown as non-links marked Soon", soon.length === 4 && soon.every((t) => /Soon/.test(t)), soon.map((t) => t.split("\n")[0]).join(", "));
ok("Soon items are not links", (await nia.locator("aside nav a", { hasText: "Bulk shipping" }).count()) === 0);

// ---- Real-shaped data inserted as later phases will write it (LOCAL test DB only)
const niaId = q("select id from users where email='nia@p4.test'"), omarId = q("select id from users where email='omar@p4.test'");
const adminId = q("select id from users where email='hm621496@gmail.com'");
q(`insert into wallet_ledger(user_id,kind,amount_cents,note,created_by_user_id,created_at) values ('${niaId}','top_up',5000,'Opening credit','${adminId}', now() - interval '2 minutes')`);
const sh = q(`insert into shipments(owner_user_id,reference,status,to_address,weight_oz,carrier,service,tracking_number,price_cents,label_created_at) values ('${niaId}','ORD-1001','in_transit','{"name":"Ada Lovelace","line1":"1 Main St","city":"Austin","state":"TX","postalCode":"78701","country":"US"}',32,'USPS','Ground Advantage','9400100000000000000001',849, now()) returning id`).split("\n")[0];
q(`insert into wallet_ledger(user_id,kind,amount_cents,shipment_id,note,created_at) values ('${niaId}','label_charge',-849,'${sh}','Label ORD-1001', now() - interval '1 minute')`);
q(`insert into shipment_events(shipment_id,status,description,source,occurred_at) values ('${sh}','in_transit','Accepted at USPS origin facility','usps', now())`);
q(`insert into shipments(owner_user_id,reference,status) values ('${niaId}','ORD-1002','label_created')`);
q(`insert into wallet_ledger(user_id,kind,amount_cents,note) values ('${omarId}','top_up',99900,'Omar credit')`);
q(`insert into shipments(owner_user_id,reference,status) values ('${omarId}','OMAR-SECRET','delivered')`);

await nia.reload(); body = await nia.locator("main").innerText();
ok("balance = 50.00 − 8.49 = $41.51", body.includes("$41.51"));
ok("spent this month = $8.49", /Spent in \w+\s+\$8\.49/.test(body));
ok("shipment count 2, pending 1", /Shipments\s+2/.test(body) && /Pending\s+1/.test(body));
ok("dashboard row shows recipient, reference, service, cost", body.includes("Ada Lovelace") && body.includes("ORD-1001 · USPS Ground Advantage") && body.includes("$8.49"));
ok("activity feed shows tracking event and charge", body.includes("Accepted at USPS origin facility") && body.includes("Label charge"));
ok("isolation: Omar's data not on Nia's dashboard", !body.includes("OMAR-SECRET") && !body.includes("$999.00"));

await nia.goto(B + "/app/transactions"); body = await nia.locator("main").innerText();
ok("transactions show running balance 50.00 → 41.51", body.includes("$50.00") && body.includes("$41.51") && body.includes("−$8.49"));
ok("transactions isolated from Omar", !body.includes("Omar credit"));
await nia.goto(B + "/app/shipments?status=label_created"); body = await nia.locator("main").innerText();
ok("status filter: only ORD-1002", body.includes("ORD-1002") && !body.includes("ORD-1001"));
await nia.goto(B + "/app/shipments"); body = await nia.locator("main").innerText();
ok("shipments list isolated from Omar", body.includes("ORD-1001") && !body.includes("OMAR-SECRET"));
ok("shipments page shows tracking number", body.includes("9400100000000000000001"));
await nia.goto(B + "/app/wallet"); body = await nia.locator("main").innerText();
ok("wallet page shows balance and manual top-up route", body.includes("$41.51") && body.includes("Request a top-up on WhatsApp"));

// ---- Settings
await nia.goto(B + "/app/settings");
await nia.getByLabel("Company").fill("Brooks Botanicals"); await nia.getByRole("button", { name: "Save profile" }).click();
await nia.getByText("Profile saved.").waitFor({ timeout: 8000 });
ok("profile saved to database", q(`select company from users where id='${niaId}'`) === "Brooks Botanicals");
ok("profile change audited", q(`select count(*) from audit_logs where action='user.profile_updated' and target_id='${niaId}'`) === "1");
const other = await signedIn("nia@p4.test", "NiaPassword-2026"); // a second device
await nia.goto(B + "/app/settings");
await nia.getByLabel("Current password", { exact: true }).fill("WrongPassword-1");
await nia.getByLabel("New password", { exact: true }).fill("NiaNewPassword-2026"); await nia.getByLabel("Confirm new password").fill("NiaNewPassword-2026");
await nia.getByRole("button", { name: "Change password" }).click();
await nia.getByText("Your current password is incorrect.").waitFor({ timeout: 8000 });
ok("wrong current password rejected with clear message", true);
ok("failed change NOT audited", q(`select count(*) from audit_logs where action='user.password_changed' and target_id='${niaId}'`) === "0");
await nia.getByLabel("Current password", { exact: true }).fill("NiaPassword-2026");
await nia.getByRole("button", { name: "Change password" }).click();
await nia.getByText(/Password changed/).waitFor({ timeout: 8000 });
ok("successful change audited once", q(`select count(*) from audit_logs where action='user.password_changed' and target_id='${niaId}'`) === "1");
await other.goto(B + "/app");
ok("other device signed out after password change", new URL(other.url()).pathname === "/login");
await nia.goto(B + "/app"); ok("current device stays signed in", new URL(nia.url()).pathname === "/app");

// ---- /update-user attack: protected fields must not change
const cookies = (await nia.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
const before = q(`select status||'|'||coalesce(parent_user_id::text,'-')||'|'||email||'|'||email_verified from users where id='${niaId}'`);
for (const payload of [{ status: "disabled" }, { parentUserId: adminId }, { email: "hijack@evil.test" }, { emailVerified: false }, { role: "ADMIN" }, { lastLoginAt: "2000-01-01" }]) {
  execSync(`curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -H 'Origin: ${B}' -H 'Cookie: ${cookies}' -d '${JSON.stringify({ name: "Nia Brooks", ...payload })}' ${B}/api/auth/update-user`);
}
ok("/update-user cannot change status, parent, email or verification", q(`select status||'|'||coalesce(parent_user_id::text,'-')||'|'||email||'|'||email_verified from users where id='${niaId}'`) === before, before);
ok("/update-user cannot grant ADMIN", q(`select r.key from user_roles ur join roles r on r.id=ur.role_id where ur.user_id='${niaId}'`) === "CLIENT");

// ---- Mobile
const m = await signedIn("omar@p4.test", "OmarPassword-2026", { width: 390, height: 844 });
for (const path of ["/app", "/app/shipments", "/app/wallet", "/app/transactions", "/app/settings", "/app/support"]) {
  await m.goto(B + path); const o = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(`mobile ${path}: no sideways scroll`, o === 0, `${o}px`);
}
await m.goto(B + "/app"); await m.screenshot({ path: "/tmp/p4-mobile.png", fullPage: true });
await nia.setViewportSize({ width: 1440, height: 900 }); await nia.goto(B + "/app"); await nia.screenshot({ path: "/tmp/p4-dash.png" });
await nia.goto(B + "/app/transactions"); await nia.screenshot({ path: "/tmp/p4-tx.png" });
console.log(`---- ${pass} passed, ${fail} failed`);
await Promise.all(browsers.map((b) => b.close()));
