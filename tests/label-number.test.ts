import assert from "node:assert/strict";
import { test } from "node:test";
import { formatLabelNumber, isValidLabelNumber, luhnCheckDigit } from "../src/server/labels/numbering.ts";

test("luhn check digit matches known values", () => {
  assert.equal(luhnCheckDigit("7992739871"), 3); // classic Luhn example
  assert.equal(luhnCheckDigit("000000000"), 0);
});

test("label numbers are LN + 9 digits + check digit", () => {
  assert.equal(formatLabelNumber(1).length, 12);
  assert.match(formatLabelNumber(123456789), /^LN123456789\d$/);
  for (const n of [1, 17, 999, 424242, 999_999_999]) assert.ok(isValidLabelNumber(formatLabelNumber(n)));
});

test("check digit catches a single-digit typo and adjacent transposition", () => {
  const good = formatLabelNumber(314159265);
  const typo = good.slice(0, 5) + String((Number(good[5]) + 1) % 10) + good.slice(6);
  const swapped = good.slice(0, 4) + good[5] + good[4] + good.slice(6);
  assert.equal(isValidLabelNumber(typo), false);
  if (good[4] !== good[5]) assert.equal(isValidLabelNumber(swapped), false);
});

test("out-of-range sequences are refused rather than wrapped", () => {
  assert.throws(() => formatLabelNumber(0));
  assert.throws(() => formatLabelNumber(1_000_000_000));
});
