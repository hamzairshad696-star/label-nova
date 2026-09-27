/**
 * Code 128 encoder (code sets B and C, with automatic switching to C for runs of digits).
 * Pure function, no dependencies: shared by the SVG preview and the future PDF renderer.
 */

// Bar/space widths for symbol values 0–106. Each symbol is 11 modules; the stop symbol is 13.
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const STOP = 106;

export interface Bar {
  /** Offset from the left edge, in modules. */
  x: number;
  /** Width in modules (1–4). */
  width: number;
}

function digitRun(s: string, from: number): number {
  let n = 0;
  while (from + n < s.length && s.charCodeAt(from + n) >= 48 && s.charCodeAt(from + n) <= 57) n++;
  return n;
}

/** Returns the symbol values (start, data, checksum, stop) for `value`. */
export function code128Values(value: string): number[] {
  if (value.length === 0) throw new Error("Code 128 value must not be empty.");
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) throw new Error(`Code 128 (set B) cannot encode character ${JSON.stringify(ch)}.`);
  }

  const out: number[] = [];
  let i = 0;
  const firstRun = digitRun(value, 0);
  let set: "B" | "C" = firstRun >= 4 ? "C" : "B";
  out.push(set === "C" ? START_C : START_B);

  while (i < value.length) {
    if (set === "C") {
      if (digitRun(value, i) >= 2) {
        out.push(Number(value.slice(i, i + 2)));
        i += 2;
        continue;
      }
      out.push(CODE_B);
      set = "B";
      continue;
    }
    const run = digitRun(value, i);
    const reachesEnd = i + run === value.length;
    if (run >= 6 || (run >= 4 && reachesEnd)) {
      // Keep an odd leading digit in set B so the C run is an even length.
      if (run % 2 === 1) {
        out.push(value.charCodeAt(i) - 32);
        i++;
      }
      out.push(CODE_C);
      set = "C";
      continue;
    }
    out.push(value.charCodeAt(i) - 32);
    i++;
  }

  let sum = out[0]!;
  for (let k = 1; k < out.length; k++) sum += out[k]! * k;
  out.push(sum % 103, STOP);
  return out;
}

/** Bars (filled modules) for rendering. Spaces are implied between them. */
export function code128Bars(value: string): { bars: Bar[]; totalModules: number } {
  const bars: Bar[] = [];
  let x = 0;
  for (const v of code128Values(value)) {
    const pattern = PATTERNS[v]!;
    for (let k = 0; k < pattern.length; k++) {
      const w = pattern.charCodeAt(k) - 48;
      if (k % 2 === 0) bars.push({ x, width: w });
      x += w;
    }
  }
  return { bars, totalModules: x };
}

/** Module string ("1" = bar, "0" = space), useful for tests. */
export function code128Modules(value: string): string {
  const { bars, totalModules } = code128Bars(value);
  const m = new Array<string>(totalModules).fill("0");
  for (const b of bars) for (let k = 0; k < b.width; k++) m[b.x + k] = "1";
  return m.join("");
}
