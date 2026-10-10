import test from "node:test";
import assert from "node:assert/strict";
import { getFacilityLabel, useFacilityHover } from "../src/pages/leak-monitor/facilityHover.ts";

test("facility names take priority; unnamed records retain type and number", () => {
  assert.equal(getFacilityLabel({ facilityType: "VALVE", facilityName: " Control valve ", facilityNumber: "V1" }, "Valve"), "Control valve");
  assert.equal(getFacilityLabel({ facilityType: "PUMP", facilityName: null, facilityNumber: "P1" }, "Pump"), "Pump · P1");
  assert.equal(getFacilityLabel({ facilityType: "HYDRANT", facilityName: "  ", facilityNumber: "" }, "Hydrant"), "Hydrant");
});

test("hover is clamped to the viewport and missing pointer data never leaves a stale label", () => {
  const previous = globalThis.window;
  globalThis.window = { innerWidth: 1280, innerHeight: 800 };
  try {
    const tooltip = useFacilityHover(() => "Valve");
    const facility = { facilityType: "VALVE", facilityName: "<b>V1</b>" };
    tooltip.show(facility, { clientX: 1270, clientY: 790 });
    assert.deepEqual(tooltip.hover.value, { text: "<b>V1</b>", x: 1032, y: 736 });
    tooltip.show(facility);
    assert.equal(tooltip.hover.value, null);
    tooltip.show(facility, { clientX: 10, clientY: 20 });
    tooltip.hide();
    assert.equal(tooltip.hover.value, null);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
