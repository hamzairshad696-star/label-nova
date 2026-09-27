import assert from "node:assert/strict";
import { test } from "node:test";
import { code128Bars, code128Modules, code128Values } from "./code128.ts";

test("every symbol is 11 modules and the stop is 13", () => {
  const { totalModules } = code128Bars("A");
  // start + 'A' + checksum = 3 × 11, stop = 13
  assert.equal(totalModules, 46);
});

test("checksum matches the reference example (set B)", () => {
  // "PJJ123C" — classic worked example, checksum value 55 (879 mod 103).
  const values = code128Values("PJJ123C");
  assert.equal(values[0], 104);
  assert.equal(values.at(-2), 55);
  assert.equal(values.at(-1), 106);
});

test("pure even-length digits use set C", () => {
  const values = code128Values("123456");
  assert.deepEqual(values.slice(0, 4), [105, 12, 34, 56]);
});

test("long digit runs switch to set C", () => {
  const values = code128Values("LN4829105733160");
  assert.equal(values[0], 104);
  assert.ok(values.includes(99));
});

test("barcode always starts with a bar and ends with the stop pattern", () => {
  const m = code128Modules("LN48291057331602");
  assert.ok(m.startsWith("11"));
  assert.ok(m.endsWith("1100011101011"));
});

test("rejects characters outside set B", () => {
  assert.throws(() => code128Values("é"));
  assert.throws(() => code128Values(""));
});
