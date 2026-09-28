import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
const B = "http://localhost:3000"; const exe = await chromium.executablePath();
const DB = "postgres://ln:ln@localhost:5432/labelnova";
const q = (s) => execSync(`psql ${DB} -tAc "${s.replace(/"/g, '\\"')}"`).toString().trim();
const qerr = (s) => { try { execSync(`psql ${DB} -tAc "${s.replace(/"/g, '\\"')}" 2>&1`); return ""; } catch (e) { return e.stdout.toString() + e.stderr?.toString(); } };
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const browsers = [];
async function signedIn(email, pwd) {
  const br = await pw.launch({ executablePath: exe, args: chromium.args }); browsers.push(br);
  const p = await (await br.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion: "reduce" })).newPage();
  q("delete from rate_limits");
  await p.goto(B + "/login"); await p.getByLabel("Email").fill(email); await p.getByLabel("Password", { exact: true }).fill(pwd);
  await p.getByRole("button", { name: "Sign in" }).click(); await p.waitForURL((u) => !/login|welcome/.test(u.pathname), { timeout: 10000 });
  return p;
}
const a = await signedIn("hm621496@gmail.com", "LocalOnlyTestPw-123");
const notice = async (re) => { try { await a.getByText(re).first().waitFor({ timeout: 6000 }); return true; } catch { return false; } };
const section = (h) => a.locator("section", { has: a.getByRole("heading", { name: h }) });

await a.goto(B + "/admin/pricing");
ok("empty pricing explains that nothing can be bought yet", await a.getByText("No services are priced yet.").isVisible());
const addCarrier = async (name, key) => { const s = section("Add a carrier"); await s.getByLabel("Carrier name").fill(name); await s.getByLabel("Key").fill(key); await s.getByRole("button", { name: "Add carrier" }).click(); };
await addCarrier("Label Nova", "label_nova"); ok("add carrier", await notice("Carrier added."));
await addCarrier("Label Nova Again", "label_nova"); ok("duplicate carrier key rejected", await notice("A carrier with this key already exists."));
await addCarrier("USPS", "usps"); await notice("Carrier added.");
const addService = async (carrier, name, key, kind, min, max) => {
  const s = section("Add a service");
  await s.getByLabel("Carrier").selectOption({ label: carrier }); await s.getByLabel("Service type").selectOption(kind);
  await s.getByLabel("Service name").fill(name); await s.getByLabel("Key").fill(key);
  if (min !== undefined) { await s.getByLabel("Delivery days, from").fill(String(min)); await s.getByLabel("Delivery days, to").fill(String(max)); }
  await s.getByRole("button", { name: "Add service" }).click();
};
await a.reload(); await addService("Label Nova", "Standard label", "standard", "label_only", 1, 3); ok("add label-only service", await notice("Service added."));
await a.reload(); await addService("USPS", "Ground Advantage", "ground_advantage", "carrier_postage", 5, 2); ok("transit max < min rejected", await notice("Maximum days can't be less than minimum days."));
await a.reload(); await addService("USPS", "Ground Advantage", "ground_advantage", "carrier_postage", 2, 5); ok("add carrier-postage service", await notice("Service added."));
await a.reload();
ok("postage service labelled as needing partner", await a.getByText("Carrier postage · needs partner").isVisible());

const svcBlock = (name) => a.locator("div.border-b", { has: a.getByRole("heading", { name, level: 3 }) }).first();
async function addRule(svc, r) {
  await a.reload(); const blk = svcBlock(svc);
  await blk.getByText("Add a price rule").click();
  for (const [label, v] of Object.entries(r)) await blk.getByLabel(label, { exact: true }).fill(String(v));
  await blk.getByRole("button", { name: "Add rule" }).click();
}
const R = (min, max, cost, cu, de, re, zone = "") => ({ "Weight from (oz)": min, "Weight to (oz)": max, Zone: zone, "Carrier cost ($)": cost, "Customer price ($)": cu, "Dealer price ($)": de, "Reseller price ($)": re });

// margin hint (live, before saving)
await a.reload(); { const blk = svcBlock("Standard label"); await blk.getByText("Add a price rule").click();
  await blk.getByLabel("Carrier cost ($)", { exact: true }).fill("2.00"); await blk.getByLabel("Customer price ($)", { exact: true }).fill("4.99"); await blk.getByLabel("Dealer price ($)", { exact: true }).fill("1.50");
  ok("margin hint over cost", await blk.getByText("$2.99 over cost").isVisible());
  ok("below-cost warning", await blk.getByText("$0.50 below cost").isVisible()); }

await addRule("Standard label", R(1, 16, "2.00", "4.99", "3.99", "4.49")); ok("add rule 1–16 oz", await notice("Rule added."));
await addRule("Standard label", R(10, 32, "", "6.99", "5.99", "6.49")); ok("overlapping rule rejected", await notice(/overlaps an active rule for 1–16 oz/));
await addRule("Standard label", R(17, 32, "", "6.99", "5.99", "6.49")); ok("adjacent rule 17–32 accepted", await notice("Rule added."));
await addRule("Standard label", R(40, 33, "", "6.99", "5.99", "6.49")); ok("max < min weight rejected", await notice("Maximum weight can't be less than minimum weight."));
await addRule("Standard label", R(33, 48, "", "abc", "5.99", "6.49")); ok("non-numeric price rejected", await notice("Enter the customer price as an amount like 8.49."));
await addRule("Standard label", R(33, 48, "", "0", "5.99", "6.49")); ok("zero price rejected", await notice("The customer price must be more than $0.00."));
await addRule("Standard label", R(33, 48, "", "6.999", "5.99", "6.49")); ok("3-decimal price rejected", await notice("Enter the customer price as an amount like 8.49."));
await addRule("Standard label", R(1, 16, "", "5.25", "4.25", "4.75", "4")); ok("zone-specific rule may coexist with any-zone rule", await notice("Rule added."));
await addRule("Ground Advantage", R(1, 16, "4.10", "6.49", "5.49", "5.99")); ok("postage service can be priced ahead of partner", await notice("Rule added."));

const ruleId = q("select r.id from pricing_rules r join carrier_services s on s.id=r.service_id where s.key='standard' and r.weight_min_oz=1 and r.zone is null");
await a.goto(`${B}/admin/pricing/rules/${ruleId}`);
await a.getByLabel("Customer price ($)", { exact: true }).fill("5.49"); await a.getByRole("button", { name: "Save changes" }).click();
ok("edit rule", await notice("Rule updated. New labels use this price."));
await a.reload();
ok("rule history shows before → after", await a.getByText("Customer: $4.99 → $5.49").isVisible());
ok("DB has created + updated changes", q(`select string_agg(action,',' order by created_at) from pricing_rule_changes where rule_id='${ruleId}'`) === "created,updated");
await a.getByRole("button", { name: "Save changes" }).click(); await notice("Rule updated.");
ok("saving without changes adds no history", q(`select count(*) from pricing_rule_changes where rule_id='${ruleId}'`) === "2");

await a.goto(B + "/admin/pricing");
const row = a.locator("tr", { hasText: "1–16 oz" }).filter({ hasText: "Any" }).first();
await row.getByRole("button", { name: "Deactivate" }).click(); await a.waitForTimeout(800);
ok("deactivate rule", q(`select active from pricing_rules where id='${ruleId}'`) === "f");
await addRule("Standard label", R(1, 20, "", "5.99", "4.99", "5.49")); ok("new 1–20 allowed once old rule inactive… but overlaps 17–32", await notice(/overlaps an active rule for 17–32 oz/));
await addRule("Standard label", R(1, 12, "", "5.99", "4.99", "5.49")); await notice("Rule added.");
await a.reload(); await a.locator("tr", { hasText: "1–16 oz" }).filter({ hasText: "Any" }).first().getByRole("button", { name: "Activate" }).click();
ok("reactivating an overlapping rule is refused", await notice(/overlaps an active rule for 1–12 oz/));

ok("DB: pricing rules cannot be deleted", /append-only/.test(qerr(`delete from pricing_rules where id='${ruleId}'`)));
ok("DB: pricing history cannot be edited", /append-only/.test(qerr(`update pricing_rule_changes set action='x'`)));
ok("DB: negative price rejected by constraint", /prices_positive/.test(qerr(`update pricing_rules set customer_cents=-1 where id='${ruleId}'`)));
await a.goto(B + "/admin/pricing/history");
const dbChanges = Number(q("select count(*) from pricing_rule_changes"));
ok("global history lists every change with its service", (await a.locator("main li").count()) === dbChanges && await a.getByText("Label Nova Standard label").first().isVisible(), `${dbChanges} changes`);

// ---- Wallet credit
const custId = q("select id from users where email='nia@p4.test'");
const niaStart = Number(q(`select coalesce(sum(amount_cents),0) from wallet_ledger where user_id='${custId}'`));
await a.goto(`${B}/admin/users/${custId}`);
const w = section("Wallet");
const entry = async (type, amt, note) => { await w.getByLabel("Type").selectOption(type); await w.getByLabel("Amount ($)").fill(amt); await w.getByLabel("Note").fill(note); await w.getByRole("button", { name: "Record entry" }).click(); };
await entry("top_up", "100.00", "Bank transfer 28 Sep"); ok("admin top-up recorded", await notice("Entry recorded."));
ok("balance increased by exactly $100.00", Number(q(`select sum(amount_cents) from wallet_ledger where user_id='${custId}'`)) === niaStart + 10000);
const bal = Number(q(`select sum(amount_cents) from wallet_ledger where user_id='${custId}'`));
await a.reload(); await entry("adjustment_debit", ((bal + 100) / 100).toFixed(2), "Too much"); ok("debit below $0 refused", await notice(/below \$0\.00/));
await a.reload(); await entry("adjustment_debit", "10.00", "Correction"); ok("debit adjustment recorded", await notice("Entry recorded."));
ok("ledger: top_up +10000 and adjustment −1000 with admin as creator", q(`select string_agg(kind||':'||amount_cents,',' order by created_at) from wallet_ledger where user_id='${custId}' and created_by_user_id is not null and note in ('Bank transfer 28 Sep','Correction')`) === "top_up:10000,adjustment:-1000");
await a.reload(); await entry("top_up", "", "x"); ok("empty amount + short note rejected", await notice("Check the highlighted fields.") && await w.getByText("Add a short note explaining this entry.").isVisible());
ok("wallet entry audited", Number(q(`select count(*) from audit_logs where action='wallet.entry_created' and target_id='${custId}'`)) >= 2);
await a.goto(`${B}/admin/users/${q("select id from users where email='hm621496@gmail.com'")}`);
ok("admin account has no wallet panel", (await a.getByRole("heading", { name: "Wallet" }).count()) === 0);

const nia = await signedIn("nia@p4.test", "NiaNewPassword-2026");
await nia.goto(B + "/app/transactions"); const t = await nia.locator("main").innerText();
ok("customer sees admin entries with notes", t.includes("Bank transfer 28 Sep") && t.includes("Correction") && t.includes("+$100.00") && t.includes("−$10.00"));
await nia.goto(B + "/admin/pricing");
ok("customer cannot open pricing admin", await nia.getByText("You don't have access to this page.").isVisible());
console.log(`---- ${pass} passed, ${fail} failed`);
await Promise.all(browsers.map((b) => b.close()));
