import assert from "node:assert/strict";
import { test } from "node:test";
import { planPercentage } from "../ui/plan-percentage";

test("uses the visible badge value, including additive and localized percentages", () => {
  for (const [badge, expected] of [
    ["10%", 10],
    ["14%", 14],
    ["+5%", 5],
    ["+9%", 9],
    [" + 5,25 % ", 5.25],
    ["12.50%", 12.5],
    ["0%", 0],
    ["100%", 100],
  ] as const)
    assert.equal(planPercentage(badge), expected, badge);
});

test("does not turn missing, ambiguous or invalid badges into a quoted fee", () => {
  for (const badge of [
    undefined,
    "",
    " ",
    "5",
    "From 5%",
    "5–9%",
    "-5%",
    "5% + 9%",
    "100.01%",
    "Infinity%",
    "1.234%",
  ])
    assert.equal(planPercentage(badge), null, String(badge));
});
