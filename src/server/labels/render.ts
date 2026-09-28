import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { code128Bars } from "@/lib/barcode/code128";
import { embedFonts, type LabelFonts } from "./fonts";

export const LABEL_FORMATS = {
  "4x6": { label: "4 × 6 in (thermal)", w: 288, h: 432 },
  "4x4": { label: "4 × 4 in (thermal)", w: 288, h: 288 },
  "2x1": { label: "2 × 1 in (reference sticker)", w: 144, h: 72 },
  letter: { label: "Letter sheet (4 × 6 label)", w: 612, h: 792 },
  a4: { label: "A4 sheet (4 × 6 label)", w: 595.28, h: 841.89 },
} as const;
export type LabelFormat = keyof typeof LABEL_FORMATS;
export const isLabelFormat = (v: unknown): v is LabelFormat => typeof v === "string" && v in LABEL_FORMATS;

export interface LabelAddress {
  name: string; company?: string | null; line1: string; line2?: string | null;
  city: string; state: string; postalCode: string; country: string;
}
export interface LabelData {
  labelNumber: string;
  from: LabelAddress;
  to: LabelAddress;
  carrierName: string;
  serviceName: string;
  weightOz: number;
  dims: { l: number; w: number; h: number } | null;
  reference: string | null;
  createdAt: Date;
}

const INK = rgb(0, 0, 0);

// ---------- text with per-character font fallback ----------
type Style = "regular" | "bold" | "mono";
function runs(fonts: LabelFonts, style: Style, text: string): { font: PDFFont; text: string }[] {
  const list = fonts[style];
  const out: { font: PDFFont; text: string }[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const font = list.find((f) => f.getCharacterSet().includes(cp)) ?? list[0]!;
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += ch;
    else out.push({ font, text: ch });
  }
  return out;
}
function width(fonts: LabelFonts, style: Style, text: string, size: number) {
  return runs(fonts, style, text).reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, size), 0);
}
/** Shrinks to `minSize`, then ellipsises, so text never spills out of its box. */
function fit(fonts: LabelFonts, style: Style, text: string, size: number, maxW: number, minSize = size * 0.7) {
  let s = size;
  while (s > minSize && width(fonts, style, text, s) > maxW) s -= 0.25;
  let t = text;
  while (t.length > 1 && width(fonts, style, t, s) > maxW) t = t.slice(0, -2) + "…";
  return { text: t, size: s };
}
function draw(page: PDFPage, fonts: LabelFonts, style: Style, text: string, x: number, y: number, size: number, maxW: number, color = INK) {
  const f = fit(fonts, style, text, size, maxW);
  let cx = x;
  for (const r of runs(fonts, style, f.text)) {
    page.drawText(r.text, { x: cx, y, size: f.size, font: r.font, color });
    cx += r.font.widthOfTextAtSize(r.text, f.size);
  }
  return f.size;
}
function box(page: PDFPage, x: number, y: number, w: number, h: number, t = 1) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: INK, borderWidth: t });
}

// ---------- barcode ----------
/** Code 128 with ≥10-module quiet zones. Module width never below 0.72 pt (2 dots at 203 dpi). */
function barcode(page: PDFPage, value: string, x: number, y: number, w: number, h: number) {
  const { bars, totalModules } = code128Bars(value);
  const quiet = 10;
  const module = Math.max(0.72, w / (totalModules + quiet * 2));
  const used = module * totalModules;
  const x0 = x + (w - used) / 2;
  for (const b of bars) page.drawRectangle({ x: x0 + b.x * module, y, width: b.width * module, height: h, color: INK });
}

// ---------- layouts ----------
const addrLines = (a: LabelAddress) =>
  [a.company, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, a.country !== "US" ? a.country : null].filter(Boolean) as string[];
const weightText = (oz: number) => (oz >= 16 ? `${Math.floor(oz / 16)} lb ${oz % 16 ? `${oz % 16} oz` : ""}`.trim() : `${oz} oz`);
const dateText = (d: Date) => d.toISOString().slice(0, 10);

interface Layout { H: number; fromH: number; fromLines: number; name: number; addr: number; facts: number; bc: number; num: number }
const L6: Layout = { H: 432, fromH: 78, fromLines: 5, name: 18, addr: 14, facts: 34, bc: 70, num: 11 };
const L4: Layout = { H: 288, fromH: 58, fromLines: 3, name: 14, addr: 11, facts: 28, bc: 42, num: 9.5 };

/** Laid out bottom-up: footer, barcode and facts get fixed space; the address adapts to what's left. */
function labelMain(page: PDFPage, f: LabelFonts, d: LabelData, ox: number, oy: number, cfg: Layout) {
  const W = 288, m = 10, iw = W - m * 2, H = cfg.H;
  const top = oy + H - m, fx = ox + m + 7;
  const hline = (y: number, t = 1) => page.drawLine({ start: { x: ox + m, y }, end: { x: ox + W - m, y }, thickness: t, color: INK });
  box(page, ox + m, oy + m, iw, H - m * 2, 1.2);

  // ---- bottom-up fixed blocks
  const footerTop = oy + m + 20;
  hline(footerTop, 0.8);
  if (d.reference) draw(page, f, "regular", `Ref ${d.reference}`, fx, oy + m + 7, 7.5, iw / 2 - 10);
  const foot = "Label Nova · no carrier postage";
  draw(page, f, "regular", foot, ox + W - m - 7 - width(f, "regular", foot, 6.5), oy + m + 7, 6.5, iw / 2);

  const numY = footerTop + 7;
  const num = d.labelNumber.replace(/^(LN)(\d{3})(\d{3})(\d{3})(\d)$/, "$1 $2 $3 $4 $5");
  draw(page, f, "mono", num, ox + W / 2 - width(f, "mono", num, cfg.num) / 2, numY, cfg.num, iw);
  const bcY = numY + cfg.num + 5;
  barcode(page, d.labelNumber, ox + m + 8, bcY, iw - 16, cfg.bc);
  const labelNoY = bcY + cfg.bc + 6;
  draw(page, f, "bold", "LABEL NO.", fx, labelNoY, 6.5, 100);

  const factsBottom = labelNoY + 12, factsTop = factsBottom + cfg.facts;
  hline(factsBottom); hline(factsTop);
  const facts: [string, string][] = [
    ["WEIGHT", weightText(d.weightOz)],
    ["DIMENSIONS", d.dims ? `${d.dims.l} × ${d.dims.w} × ${d.dims.h} in` : "—"],
    ["DATE", dateText(d.createdAt)],
  ];
  const cw = iw / 3;
  facts.forEach(([k, v], i) => {
    const cx = ox + m + i * cw;
    if (i > 0) page.drawLine({ start: { x: cx, y: factsBottom }, end: { x: cx, y: factsTop }, thickness: 1, color: INK });
    draw(page, f, "bold", k, cx + 6, factsTop - 11, 6, cw - 12);
    draw(page, f, "bold", v, cx + 6, factsBottom + 7, cfg.facts > 30 ? 9 : 8, cw - 12);
  });

  // ---- top: FROM + service block
  const fromBottom = top - cfg.fromH;
  hline(fromBottom);
  const svcW = 96, sx = ox + W - m - svcW + 7, sw = svcW - 14, WHITE = rgb(1, 1, 1);
  page.drawRectangle({ x: ox + W - m - svcW, y: fromBottom, width: svcW, height: cfg.fromH, color: INK });
  draw(page, f, "bold", d.serviceName.toUpperCase(), sx, top - 20, 10.5, sw, WHITE);
  draw(page, f, "regular", d.carrierName, sx, top - 34, 7.5, sw, WHITE);
  draw(page, f, "bold", "LABEL ONLY", sx, top - 45, 7.5, sw, WHITE);
  const fw = iw - svcW - 14;
  draw(page, f, "bold", "FROM", fx, top - 12, 6.5, fw);
  [d.from.name, ...addrLines(d.from)].slice(0, cfg.fromLines).forEach((l, i) => draw(page, f, i === 0 ? "bold" : "regular", l, fx, top - 23 - i * 9.5, 7.5, fw));

  // ---- middle: SHIP TO, scaled to the space between the FROM block and the facts row
  const lines = addrLines(d.to);
  const lastBold = lines.length - 1 - (d.to.country !== "US" ? 1 : 0);
  const space = fromBottom - 8 - factsTop - 6;
  let nameSize = cfg.name, addrSize = cfg.addr;
  const need = () => 10 + nameSize * 1.25 + lines.length * addrSize * 1.22;
  while (need() > space && addrSize > 8) { addrSize -= 0.25; nameSize = Math.max(addrSize + 2, nameSize - 0.3); }
  let y = fromBottom - 16;
  draw(page, f, "bold", "SHIP TO", fx, y, 7, iw - 14);
  y -= nameSize * 1.25 + 2;
  draw(page, f, "bold", d.to.name, fx, y, nameSize, iw - 14);
  for (const [i, l] of lines.entries()) {
    y -= addrSize * 1.22;
    draw(page, f, i === lastBold ? "bold" : "regular", l, fx, y, addrSize, iw - 14);
  }
}

function label2x1(page: PDFPage, f: LabelFonts, d: LabelData) {
  const W = 144, m = 5;
  draw(page, f, "bold", d.to.name, m, 60, 7.5, W - m * 2);
  barcode(page, d.labelNumber, m, 20, W - m * 2, 34);
  const nw = width(f, "mono", d.labelNumber, 7.5);
  draw(page, f, "mono", d.labelNumber, W / 2 - nw / 2, 9, 7.5, W);
}

export async function renderLabelPdf(d: LabelData, format: LabelFormat): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Label ${d.labelNumber}`);
  doc.setProducer("Label Nova");
  doc.setCreator("Label Nova");
  doc.setCreationDate(d.createdAt);
  doc.setModificationDate(d.createdAt);
  const fonts = await embedFonts(doc);
  const size = LABEL_FORMATS[format];
  const page = doc.addPage([size.w, size.h]);
  if (format === "4x6") labelMain(page, fonts, d, 0, 0, L6);
  else if (format === "4x4") labelMain(page, fonts, d, 0, 0, L4);
  else if (format === "2x1") label2x1(page, fonts, d);
  else {
    // 4×6 label 1 inch from the top-left of a sheet, with a dashed cut guide.
    const ox = 72, oy = size.h - 72 - 432;
    page.drawRectangle({ x: ox - 4, y: oy - 4, width: 296, height: 440, borderColor: rgb(0.55, 0.55, 0.55), borderWidth: 0.6, borderDashArray: [4, 3] });
    labelMain(page, fonts, d, ox, oy, L6);
    draw(page, fonts, "regular", "Cut along the dashed line.", ox, oy - 18, 8, 288);
  }
  return doc.save({ useObjectStreams: true });
}
