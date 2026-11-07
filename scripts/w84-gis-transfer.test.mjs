import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test, { after, before } from "node:test";
import { writeW84Fixture } from "./fixtures/w84-source.mjs";
import {
  buildImportPayloads,
  buildPipePayloads,
  parseArgs,
  readW84Source,
  requestJson,
  selectFacilitySamplePayloads,
  selectPipeOnlyPayloads,
  selectSamplePayloads,
} from "./w84-gis-transfer.mjs";

const fixtureRoot = resolve(tmpdir());
let sourceDir;

before(() => {
  sourceDir = mkdtempSync(join(fixtureRoot, "guanwang-w84-test-"));
  writeW84Fixture(sourceDir);
});

after(() => {
  if (!sourceDir) return;
  assert.equal(dirname(sourceDir), fixtureRoot);
  rmSync(sourceDir, { recursive: true, force: true });
});

test("reads fixture layer counts and WGS84 multipart geometry from disk", () => {
  const source = readW84Source(sourceDir);
  assert.equal(source.sourceDir, sourceDir);
  assert.equal(source.pipes.length, 3);
  assert.equal(source.facilities.hydrants.length, 1);
  assert.equal(source.facilities.pumps.length, 1);
  assert.equal(source.facilities.valves.length, 1);
  assert.equal(source.pipes[0].geometry.parts.length, 2);
  assert.deepEqual(source.pipes[0].geometry.parts[0][0], [101.1, 3.1]);
  assert.equal(source.pipes[0].attributes.MATERIAL, "PVC");

  for (const pipe of source.pipes) {
    assert.equal(pipe.geometry.type, "Polyline");
    assert.ok(pipe.geometry.parts.length >= 1);
    for (const part of pipe.geometry.parts) {
      assert.ok(part.length >= 2);
      for (const [longitude, latitude] of part) {
        assert.ok(longitude >= -180 && longitude <= 180);
        assert.ok(latitude >= -90 && latitude <= 90);
      }
    }
  }
});

test("builds the documented sample payloads without system fields", () => {
  const payloads = buildImportPayloads(readW84Source(sourceDir), 2);
  const sample = selectSamplePayloads(payloads);
  assert.equal(sample.pipes.length, 1);
  assert.equal(sample.facilities.length, 3);

  assert.equal(sample.pipes[0].deptId, 2);
  assert.equal(sample.pipes[0].lineCoords[0][0].length, 2);
  assert.equal(sample.pipes[0].tubeName, "POC_KG556_p-4");
  assert.equal(sample.pipes[0].status, 1);
  assert.equal(sample.pipes[0].diameterMm, 100);

  const types = new Set(sample.facilities.map((item) => item.facilityType));
  assert.deepEqual(types, new Set(["VALVE", "HYDRANT", "PUMP"]));
  assert.equal(sample.facilities.find((item) => item.facilityType === "HYDRANT").status, 0);
  assert.equal(sample.facilities.find((item) => item.facilityType === "PUMP").status, 1);
  for (const item of sample.facilities) {
    assert.equal(item.deptId, 2);
    assert.equal(item.countryCode, "MY");
    assert.equal(item.coordinateSystem, "WGS84");
    assert.equal(item.gisSource, undefined);
    assert.equal(item.riskScore, undefined);
  }
});

test("pipe-only selection never includes facility payloads", () => {
  const payloads = buildImportPayloads(readW84Source(sourceDir), 2);
  const selected = selectPipeOnlyPayloads(payloads);
  assert.equal(selected.pipes.length, 1);
  assert.equal(selected.facilities.length, 0);
});

test("facility-only sample contains one record for each W84 facility type", () => {
  const payloads = buildImportPayloads(readW84Source(sourceDir), 2);
  const selected = selectFacilitySamplePayloads(payloads);
  assert.equal(selected.pipes.length, 0);
  assert.deepEqual(
    selected.facilities.map((item) => item.facilityType).sort(),
    ["HYDRANT", "PUMP", "VALVE"],
  );
});

test("keeps duplicate OBJECTIDs as distinct, stable pipe names", () => {
  const source = readW84Source(sourceDir);
  const duplicates = new Map();
  for (const record of source.pipes) {
    const id = record.attributes.OBJECTID;
    duplicates.set(id, (duplicates.get(id) || 0) + 1);
  }
  const repeatedIds = [...duplicates].filter(([, count]) => count > 1).map(([id]) => id);
  assert.deepEqual(repeatedIds, [8]);

  const payloads = buildImportPayloads(source, 2).pipes;
  assert.equal(new Set(payloads.map((item) => item.tubeName)).size, 3);
  assert.deepEqual(payloads.map((item) => item.tubeName), ["POC_KG556_p-4", "POC_KG556_p-8-seg1", "POC_KG556_p-8-seg2"]);
  assert.deepEqual(buildPipePayloads(source.pipes, 2), payloads);
  for (const id of repeatedIds) {
    const group = payloads.filter((item) => item.tubeName.startsWith(`POC_KG556_p-${id}-seg`));
    assert.equal(group.length, 2);
    assert.notDeepEqual(group[0].lineCoords, group[1].lineCoords);
  }
  assert.equal(payloads.find((item) => item.tubeName === "POC_KG556_p-4").deptId, 2);
});

test("bulk writes require explicit all and pipe-only flags", () => {
  assert.throws(() => parseArgs(["--apply"]), /--pipes-only/);
  assert.throws(() => parseArgs(["--pipes-only", "--all", "--sample", "--apply"]), /cannot be used together/);
  assert.throws(() => parseArgs(["--pipes-only", "--facilities-only", "--all", "--apply"]), /exactly one/);
  const options = parseArgs(["--pipes-only", "--all", "--apply"]);
  assert.equal(options.all, true);
  assert.equal(options.pipesOnly, true);
  assert.equal(options.sample, false);
  const facilityOptions = parseArgs(["--facilities-only", "--sample", "--apply"]);
  assert.equal(facilityOptions.facilitiesOnly, true);
  assert.equal(facilityOptions.pipesOnly, false);
});

test("requires both HTTP success and business code 200", async () => {
  const ok = await requestJson("http://test", "/ok", {}, async () => ({
    ok: true,
    status: 200,
    async json() { return { code: 200, data: [] }; },
  }));
  assert.equal(ok.code, 200);

  await assert.rejects(
    requestJson("http://test", "/business-error", {}, async () => ({
      ok: true,
      status: 200,
      async json() { return { code: 400, msg: "rejected" }; },
    })),
    /code 400/,
  );

  await assert.rejects(
    requestJson("http://test", "/http-error", {}, async () => ({
      ok: false,
      status: 500,
      async json() { return { code: 200, data: [] }; },
    })),
    /HTTP 500/,
  );
});

test("formats bearer authorization without duplicating whitespace", async () => {
  let authorization = "";
  await requestJson("http://test", "/secured", {
    token: "session",
    tokenPrefix: "Bearer",
  }, async (_url, options) => {
    authorization = options.headers.Authorization;
    return { ok: true, status: 200, async json() { return { code: 200, data: [] }; } };
  });
  assert.equal(authorization, "Bearer session");
});

test("does not retry a failed POST", async () => {
  let calls = 0;
  await assert.rejects(
    requestJson("http://test", "/create", {
      method: "POST",
      token: "secret-token",
      body: { deptId: 2 },
    }, async () => {
      calls += 1;
      return {
        ok: false,
        status: 503,
        async json() { return { code: 503, msg: "unavailable" }; },
      };
    }),
  );
  assert.equal(calls, 1);
});
