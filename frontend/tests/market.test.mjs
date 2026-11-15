import { test } from "node:test";
import assert from "node:assert/strict";
import {
  utcTime,
  comparison,
  pointsFor,
  windowChange,
  csv,
} from "../src/lib/market.ts";
test("UTC timestamps preserve dates and explicit offsets", () => {
  assert.equal(
    utcTime("2026-11-15 23:59:00"),
    Date.parse("2026-11-15T23:59:00Z"),
  );
  assert.equal(
    utcTime("2026-11-16T05:29:00+05:30"),
    utcTime("2026-11-15 23:59:00"),
  );
  assert.ok(Number.isNaN(utcTime("not a date")));
});
test("comparison keeps equal clock times on different dates separate", () => {
  const rows = comparison([
    { timestamp: "2026-11-14 12:00:00", symbol: "BTC", price: 100 },
    { timestamp: "2026-11-15 12:00:00", symbol: "BTC", price: 110 },
    { timestamp: "2026-11-14 12:00:02", symbol: "ETH", price: 2 },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].BTC, 0);
  assert.equal(rows[0].ETH, 0);
  assert.ok(Math.abs(rows[1].BTC - 10) < 1e-10);
  assert.equal(rows[1].ETH, undefined);
});
test("sparse history excludes invalid and zero prices without fabricating samples", () => {
  const h = [
    { timestamp: "2026-11-15 12:00:00", symbol: "BTC", price: 0 },
    { timestamp: "bad", symbol: "BTC", price: 2 },
    { timestamp: "2026-11-15 12:00:00", symbol: "ETH", price: 50 },
    { timestamp: "2026-11-15 12:01:00", symbol: "BTC", price: 100 },
  ];
  assert.equal(pointsFor(h, "BTC").length, 1);
  assert.equal(windowChange(h, "BTC"), null);
  assert.equal(comparison(h)[0].BTC, undefined);
});
test("window change uses numeric UTC order across midnight", () => {
  const history = [
    { timestamp: "2026-11-16 00:01:00", symbol: "SOL", price: 90 },
    { timestamp: "2026-11-15 23:59:00", symbol: "SOL", price: 100 },
  ];
  assert.equal(Math.round(windowChange(history, "SOL")), -10);
});
test("CSV contains only valid supported records and canonical UTC times", () => {
  const output = csv([
    { timestamp: "2026-11-15 12:00:00", symbol: "BTC", price: 123 },
    { timestamp: "bad", symbol: "BTC", price: 1 },
    { timestamp: "2026-11-15 12:00:00", symbol: "=formula", price: 1 },
  ]);
  assert.equal(output.split("\r\n").length, 2);
  assert.match(output, /2026-11-15T12:00:00.000Z/);
  assert.doesNotMatch(output, /formula/);
});
