import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDateTimeValue,
  splitDateTimeValue,
} from "../src/utils/adminDateTime.js";

test("buildDateTimeValue joins date and time for API filters", () => {
  assert.equal(buildDateTimeValue("2026-06-18", "09:35"), "2026-06-18 09:35:00");
  assert.equal(buildDateTimeValue("2026-06-18", "09:35:40"), "2026-06-18 09:35:40");
});

test("buildDateTimeValue uses fallback time when only date changes", () => {
  assert.equal(buildDateTimeValue("2026-06-18", "", "23:59:59"), "2026-06-18 23:59:59");
});

test("splitDateTimeValue keeps date and minute precision for picker display", () => {
  assert.deepEqual(splitDateTimeValue("2026-06-18 09:35:40"), {
    date: "2026-06-18",
    time: "09:35",
  });
});
