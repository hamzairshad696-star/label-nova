import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import fs from "fs";
const axe = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const BASE = "http://localhost:3000";
const pages = ["/", "/platform", "/solutions", "/how-it-works", "/carriers", "/bulk-shipping", "/tracking", "/pricing", "/developers", "/resources", "/about", "/contact", "/request-access", "/login"];
const b = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const links = new Set(); const report = [];
for (const path of pages) {
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  const res = await p.goto(BASE + path, { waitUntil: "load" }); await p.waitForTimeout(300);
  const info = await p.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    links: [...document.querySelectorAll("a[href]")].map(a => a.getAttribute("href")),
    wa: document.querySelector('a.fixed[href^="https://wa.me"]')?.getAttribute("href") ?? null,
  }));
  info.links.forEach(l => links.add(l));
  await p.addScriptTag({ content: axe });
  const ax = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] })).violations.map(v => `${v.id}(${v.nodes.length})`));
  report.push({ path, status: res.status(), h1: info.h1, consoleErrors: errs.length, axe: ax.join(",") || "none", whatsapp: info.wa ? decodeURIComponent(info.wa.split("text=")[1]).slice(0, 45) : "-" });
  await p.close();
}
console.table(report);
const internal = [...links].filter(l => l.startsWith("/") && !l.startsWith("//"));
const broken = [];
for (const l of internal) { const r = await fetch(BASE + l.split("#")[0], { redirect: "manual" }); if (r.status >= 400) broken.push(`${l} ${r.status}`); }
console.log(`Internal links checked: ${internal.length}. Broken: ${broken.length ? broken.join(", ") : "none"}`);
console.log("External links:", [...links].filter(l => /^https?:/.test(l)).map(l => l.split("?")[0]).filter((v, i, a) => a.indexOf(v) === i).join(", "));
await b.close();
