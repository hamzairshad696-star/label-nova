import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { execSync } from "child_process";
import fs from "fs";
const axe = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const B = "http://localhost:3000"; const exe = await chromium.executablePath();
const q = (s) => execSync(`psql postgres://ln:ln@localhost:5432/labelnova -tAc "${s}"`).toString().trim();
const custId = q("select id from users where email='amara@customer.test'");
const rows = []; const detail = [];
async function audit(p, path, who) {
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const res = await p.goto(B + path, { waitUntil: "load" }); await p.waitForTimeout(400);
  await p.addScriptTag({ content: axe });
  const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] })).violations.map((x) => ({ id: x.id, n: x.nodes.length, t: x.nodes.slice(0, 2).map((n) => n.target.join(" ") + " :: " + (n.any[0]?.message ?? "").slice(0, 90)) })));
  const h1 = await p.locator("h1").count();
  rows.push({ who, path, status: res.status(), h1, jsErrors: errs.length, axe: v.map((x) => `${x.id}(${x.n})`).join(",") || "none" });
  v.forEach((x) => detail.push(`${path} ${x.id}: ${x.t.join(" | ")}`));
}
async function as(email, pwd, paths, who) {
  const br = await pw.launch({ executablePath: exe, args: chromium.args });
  const p = await (await br.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" })).newPage();
  if (email) {
    q("delete from rate_limits");
    await p.goto(B + "/login"); await p.getByLabel("Email").fill(email); await p.getByLabel("Password", { exact: true }).fill(pwd);
    await p.getByRole("button", { name: "Sign in" }).click(); await p.waitForURL((u) => !/login|welcome/.test(u.pathname), { timeout: 10000 });
  }
  for (const path of paths) await audit(p, path, who);
  await br.close();
}
await as(null, null, ["/login", "/request-access", "/forgot-password", "/reset-password?token=x"], "public");
await as("hm621496@gmail.com", "LocalOnlyTestPw-123", ["/welcome", "/admin", "/admin/users", "/admin/users/new", `/admin/users/${custId}`, "/app"], "admin");
await as("dana@dealer.test", "DealerPass-2026", ["/app", "/admin"], "dealer");
await as("amara@customer.test", "BrandNewPass-2026", ["/app"], "customer");
console.table(rows); if (detail.length) console.log(detail.join("\n"));
