import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCoordinate, coordinateError, getDraftPointCoordinates,
  getFacilityCoordinate, findPipeCrossings,
} from "../src/pages/leak-monitor/pipeGeometry.ts";
import {
  tencentDisplayCoordinate, tencentSourceCoordinate,
} from "../src/pages/leak-monitor/coordinateTransform.ts";

const point = (lng, lat) => ({ lng, lat });
const existing = (lineCoords, tubeName = "existing") => ({ tubeName, lineCoords });

test("empty and partial coordinates never become zero", () => {
  assert.equal(parseCoordinate(point("", "")), null);
  assert.equal(parseCoordinate(point("101.5", "")), null);
  assert.equal(parseCoordinate(point("", "3.1")), null);
  assert.match(coordinateError(point("101.5", "")), /完整/);
  assert.deepEqual(getDraftPointCoordinates({ points: [point("101.5", "3.1"), point("", ""), point("102", "4")] }), [{ lng: 101.5, lat: 3.1 }]);
  assert.equal(parseCoordinate(point("181", "3")), null);
  assert.equal(parseCoordinate(point("101", "-91")), null);
});

test("real crossing and nonadjacent self-crossing block creation", () => {
  assert.ok(findPipeCrossings([point(0, 0), point(2, 2)], [existing([[[0, 2], [2, 0]]])]).length);
  assert.ok(findPipeCrossings([point(0, 0), point(2, 2), point(0, 2), point(2, 0)], []).length);
  assert.ok(findPipeCrossings([point(0, 0), point(2, 0)], [existing([[[1, -1], [1, 0]]])]).length);
  assert.ok(findPipeCrossings([point(0, 0), point(0, 0)], []).length);
  assert.deepEqual(findPipeCrossings([point(0, 0), point(1, 1), point(2, 0)], []), []);
});

test("separate existing geometry parts are never joined", () => {
  assert.deepEqual(findPipeCrossings([point(0, 1), point(2, 1)], [existing([[[0, 0], [1, 0]], [[1, 2], [2, 2]]])]), []);
  assert.deepEqual(findPipeCrossings([point(1, 0), point(2, 0)], [existing([[[0, 0], [1, 0]]])]), []);
});

test("facility slider and manual coordinates retain WGS84 positions", () => {
  const points = [point(100, 3), point(102, 5)];
  assert.deepEqual(getFacilityCoordinate({ mode: "line", segmentIndex: 0, positionRatio: .25 }, points), { lng: 100.5, lat: 3.5 });
  assert.equal(getFacilityCoordinate({ mode: "manual", longitude: "", latitude: "" }, points), null);
  assert.deepEqual(getFacilityCoordinate({ mode: "manual", longitude: "101.5", latitude: "3.2" }, points), { lng: 101.5, lat: 3.2 });
});

test("Malaysia is unshifted and China drag round-trips", () => {
  const malaysia = point(101.5215385, 3.1038617);
  assert.deepEqual(tencentDisplayCoordinate(malaysia, "MY"), malaysia);
  assert.deepEqual(tencentSourceCoordinate(malaysia, "MY"), malaysia);
  const china = point(116.3975, 39.9087);
  const back = tencentSourceCoordinate(tencentDisplayCoordinate(china, "CN"), "CN");
  assert.ok(Math.abs(back.lng - china.lng) < 1e-5);
  assert.ok(Math.abs(back.lat - china.lat) < 1e-5);
});
