import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
import fs from "fs";
const B = "http://localhost:3000"; const exe = await chromium.executablePath();
const DB = "postgres://ln:ln@localhost:5432/labelnova";
const q = (s) => execSync(`psql ${DB} -tAc "${s.replace(/"/g, '\\"')}"`).toString().trim();
const ids = JSON.parse(fs.readFileSync("/tmp/p5ids.json"));
let pass = 0, fail = 0; const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const browsers = [];
async function signedIn(email, pwd = "Phase5Pass-2026", vp = { width: 1280, height: 950 }) {
  const br = await pw.launch({ executablePath: exe, args: chromium.args }); browsers.push(br);
  const p = await (await br.newContext({ viewport: vp, reducedMotion: "reduce", acceptDownloads: true })).newPage();
  q("delete from rate_limits");
  await p.goto(B + "/login"); await p.getByLabel("Email").fill(email); await p.getByLabel("Password", { exact: true }).fill(pwd);
  await p.getByRole("button", { name: "Sign in" }).click(); await p.waitForURL((u) => !/login|welcome/.test(u.pathname), { timeout: 10000 });
  return p;
}
const bal = (id) => Number(q(`select coalesce(sum(amount_cents),0) from wallet_ledger where user_id='${id}'`));
async function fillAddr(p, legend, a) {
  const fs_ = p.locator("fieldset", { has: p.locator("legend", { hasText: legend }) });
  for (const [label, v] of Object.entries(a)) await fs_.getByLabel(label, { exact: true }).fill(v);
}
const TO = { "Full name": "José Müller", "Street address": "2210 Alder Avenue", City: "Austin", State: "TX", "ZIP code": "78704" };
const FROM = { "Full name": "Harbor & Pine", "Street address": "418 Wharf Street", City: "Portland", State: "ME", "ZIP code": "04101" };
const cont = (p) => p.getByRole("button", { name: "Continue" }).click();
const shows = (p, t) => p.getByText(t).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
const heading = (p, t) => p.getByRole("heading", { name: t }).waitFor({ timeout: 8000 }).then(() => true).catch(() => false);

const lena = await signedIn("lena@p5.test");
await lena.goto(B + "/app");
ok("dashboard Create label is now a working link", await lena.getByRole("link", { name: "Create label" }).first().isVisible());
await lena.goto(B + "/app/create-label");
await cont(lena);
ok("step 1: empty addresses rejected with field messages", await shows(lena, "Enter the street address."));
await fillAddr(lena, "Ship to", { ...TO, "ZIP code": "787" }); await fillAddr(lena, "Ship from", FROM);
await cont(lena);
ok("step 1: invalid ZIP rejected with guidance", await shows(lena, "Use a 5-digit ZIP, like 78704, or ZIP+4."));
await fillAddr(lena, "Ship to", TO); await cont(lena);
ok("step 2 reached", await heading(lena, "What are you sending?"));
await cont(lena);
ok("step 2: zero weight rejected", await shows(lena, "Enter a weight of at least 1 oz."));
await lena.getByLabel("Pounds").fill("1"); await lena.getByLabel("Ounces").fill("6"); await lena.getByLabel("Your reference").fill("ORD-5001");
await lena.getByLabel("Length").fill("12"); await cont(lena);
ok("step 2: partial dimensions rejected", await shows(lena, "Enter all three dimensions, or none."));
await lena.getByLabel("Width").fill("9"); await lena.getByLabel("Height").fill("4"); await cont(lena);
ok("step 3 reached", await heading(lena, "Choose a service"));
const opts = await lena.getByRole("radiogroup").innerText();
ok("22 oz Standard shows customer price $6.99 (17–48 oz rule)", /Standard label[\s\S]*\$6\.99/.test(opts));
ok("Express shows $9.99", opts.includes("$9.99"));
ok("dealer/reseller/cost prices never shown to customer", !/\$5\.49|\$6\.29|\$3\.10|\$8\.49/.test(opts));
ok("carrier postage listed but not selectable", opts.includes("Needs a carrier partner connection.") && await lena.locator('input[type=radio]:disabled').count() === 1);
ok("postage shows no price", !opts.includes("$6.49"));
ok("Best value = Standard, Fastest = Express", /Standard label\s*Best value/.test(opts) && /Express label[\s\S]*Fastest/.test(opts));
await lena.getByRole("radio", { name: /Standard label/ }).check(); await cont(lena);
ok("step 4 review reached", await heading(lena, "Review and create"));
const rv = await lena.locator("section").innerText();
ok("review: price $6.99, balance $20.00, after $13.01", rv.includes("$6.99") && rv.includes("$20.00") && rv.includes("$13.01"));
ok("review says label only, no carrier postage", rv.includes("label only, no carrier postage"));
await lena.getByRole("button", { name: /Create label · \$6\.99/ }).click();
ok("label created", await heading(lena, "Your label is ready"));
const sid = q(`select id from shipments where owner_user_id='${ids.lena}' order by created_at desc limit 1`);
const row = q(`select price_cents||'|'||status||'|'||coalesce(carrier,'∅')||'|'||coalesce(tracking_number,'∅')||'|'||label_number||'|'||weight_oz||'|'||(price_snapshot->>'customerCents')||'|'||(price_snapshot->>'tier') from shipments where id='${sid}'`).split("|");
ok("shipment: 699 cents, label_created", row[0] === "699" && row[1] === "label_created", row.slice(0, 2).join(","));
ok("carrier and tracking fields left empty (no fake carrier data)", row[2] === "∅" && row[3] === "∅");
ok("label number is LN + 10 digits with valid check digit", /^LN\d{10}$/.test(row[4]), row[4]);
ok("weight stored as 22 oz; snapshot tier customer @ 699", row[5] === "22" && row[6] === "699" && row[7] === "customer");
ok("wallet charged exactly once: −699, linked to shipment", q(`select string_agg(amount_cents::text,',') from wallet_ledger where shipment_id='${sid}'`) === "-699");
ok("balance now $13.01", bal(ids.lena) === 1301);
ok("label_created event + audit recorded", q(`select count(*) from shipment_events where shipment_id='${sid}'`) === "1" && q(`select count(*) from audit_logs where action='label.created' and target_id='${sid}'`) === "1");

// PDF: download, then decode the barcode with an independent reader
const [dl] = await Promise.all([lena.waitForEvent("popup"), lena.getByRole("link", { name: "Download 4 × 6 label (PDF)" }).click()]);
await dl.waitForLoadState().catch(() => {});
const res = await lena.request.get(`${B}/api/labels/${sid}?format=4x6`);
ok("PDF served as application/pdf, private, no-store", res.status() === 200 && res.headers()["content-type"] === "application/pdf" && /no-store/.test(res.headers()["cache-control"]));
fs.writeFileSync("/tmp/p5.pdf", await res.body());
execSync("pdftoppm -r 203 -png -singlefile /tmp/p5.pdf /tmp/p5");
const decoded = execSync("zbarimg -q --raw /tmp/p5.png 2>/dev/null || true").toString().trim().split("\n").pop();
ok("barcode on the PDF decodes to the stored label number", decoded === row[4], decoded);
const pdfText = execSync("pdftotext /tmp/p5.pdf - 2>/dev/null").toString();
ok("PDF shows recipient with accents, reference and no-postage notice", pdfText.includes("José Müller") && pdfText.includes("ORD-5001") && pdfText.includes("no carrier postage"));
for (const f of ["4x4", "letter", "a4", "2x1"]) { const r = await lena.request.get(`${B}/api/labels/${sid}?format=${f}`); ok(`format ${f} renders`, r.status() === 200 && (await r.body()).subarray(0, 4).toString() === "%PDF"); }
ok("unknown format → 400", (await lena.request.get(`${B}/api/labels/${sid}?format=10x10`)).status() === 400);

// Shipment page + lists
await lena.goto(`${B}/app/shipments/${sid}`); const sp = await lena.locator("main").innerText();
ok("shipment page: label no., label-only badge, honest tracking note", sp.includes(row[4]) && sp.includes("Label only · no postage") && sp.includes("label-only labels have no carrier tracking number"));
await lena.goto(`${B}/app/shipments`); ok("shipments list shows label number and service", (await lena.locator("main").innerText()).includes(row[4]) && (await lena.locator("main").innerText()).includes("Label Nova Standard label"));

// Isolation
const omar = await signedIn("omar@p5.test");
ok("another customer's label PDF → 404", (await omar.request.get(`${B}/api/labels/${sid}?format=4x6`)).status() === 404);
await omar.goto(`${B}/app/shipments/${sid}`); ok("another customer's shipment page → not found", /not found|404/i.test(await omar.locator("body").innerText()));
const anon = await (await (await pw.launch({ executablePath: exe, args: chromium.args }).then((b) => (browsers.push(b), b))).newContext()).newPage();
ok("signed-out PDF request → 401", (await anon.request.get(`${B}/api/labels/${sid}?format=4x6`)).status() === 401);

// Price changes while the customer is on the review step
await lena.goto(B + "/app/create-label");
ok("ship-from pre-filled from last shipment", (await lena.locator("fieldset", { has: lena.locator("legend", { hasText: "Ship from" }) }).getByLabel("Full name", { exact: true }).inputValue()) === "Harbor & Pine");
await fillAddr(lena, "Ship to", TO); await cont(lena); await heading(lena, "What are you sending?");
await lena.getByLabel("Ounces").fill("8"); await cont(lena); await heading(lena, "Choose a service");
await lena.getByRole("radio", { name: /Standard label/ }).check(); await cont(lena); await heading(lena, "Review and create");
ok("review shows $4.99 for 8 oz", (await lena.locator("section").innerText()).includes("$4.99"));
q(`update pricing_rules set customer_cents=529 where service_id='${ids.std}' and weight_min_oz=1`); // admin raises price meanwhile (direct write to simulate a concurrent admin edit)
await lena.getByRole("button", { name: /Create label/ }).click();
ok("purchase refused: price changed since review", await shows(lena, /price for this service changed/));
ok("nothing charged at old or new price", bal(ids.lena) === 1301);
ok("button now shows the new price $5.29", await lena.getByRole("button", { name: /Create label · \$5\.29/ }).isVisible());
await lena.getByRole("button", { name: /Create label · \$5\.29/ }).click();
ok("confirmed at the new price", await heading(lena, "Your label is ready"));
ok("charged 529 and balance $7.72", bal(ids.lena) === 772);
q(`update pricing_rules set customer_cents=499 where service_id='${ids.std}' and weight_min_oz=1`);
ok("earlier label's snapshot unaffected by later rule edits", q(`select price_snapshot->>'customerCents' from shipments where id='${sid}'`) === "699");

// Insufficient funds: $7.72 left, Express is $9.99
await lena.getByRole("button", { name: "Create another label" }).click();
await fillAddr(lena, "Ship to", TO); await cont(lena); await heading(lena, "What are you sending?");
await lena.getByLabel("Ounces").fill("8"); await cont(lena); await heading(lena, "Choose a service");
await lena.getByRole("radio", { name: /Express label/ }).check(); await cont(lena); await heading(lena, "Review and create");
ok("insufficient funds explained with top-up route", (await lena.locator("section").innerText()).includes("Your balance isn't enough for this label."));
ok("create button disabled when balance too low", await lena.getByRole("button", { name: /Create label/ }).isDisabled());

// Mobile wizard
const m = await signedIn("omar@p5.test", "Phase5Pass-2026", { width: 390, height: 844 });
await m.goto(B + "/app/create-label");
ok("wizard: no sideways scroll on phone", (await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
await m.goto(`${B}/app/shipments`); ok("shipments: no sideways scroll on phone", (await m.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
await lena.setViewportSize({ width: 1280, height: 950 }); await lena.goto(`${B}/app/shipments/${sid}`); await lena.screenshot({ path: "/tmp/p5-shipment.png" });
console.log(`---- ${pass} passed, ${fail} failed`);
await Promise.all(browsers.map((b) => b.close()));
