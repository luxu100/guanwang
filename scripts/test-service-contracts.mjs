import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/services/partition/partition.js", import.meta.url), "utf8");
const typeSource = readFileSync(new URL("../src/services/partition/partition.d.ts", import.meta.url), "utf8");
const parseSource = readFileSync(new URL("../src/services/data-receive/parse.js", import.meta.url), "utf8");
const parseTypeSource = readFileSync(new URL("../src/services/data-receive/parse.d.ts", import.meta.url), "utf8");

test("partition semantic exports use department endpoints", () => {
  assert.match(source, /const deptApi = createCrudService\("\/api\/dept"\)/);
  assert.match(source, /export const getPartitionPage = deptApi\.getPage/);
  assert.match(source, /export const createPartition = deptApi\.create/);
  assert.match(source, /export const getDeptList = getPartitionList/);
});

test("tube network endpoints remain explicit and separate", () => {
  assert.match(source, /const tubeNetworkApi = createCrudService\("\/api\/tube-network"\)/);
  assert.match(source, /export const getTubeNetworkPage = tubeNetworkApi\.getPage/);
  assert.doesNotMatch(source, /export const getPartitionPage = tubeNetworkApi\.getPage/);
});

test("partition devices are queried through device page deptId", () => {
  assert.match(source, /const deviceApi = createCrudService\("\/api\/device"\)/);
  assert.match(source, /function getPartitionDevicePage\(partitionId, data = \{\}\)/);
  assert.match(source, /deptId: partitionId/);
  assert.match(typeSource, /getPartitionDevicePage\(partitionId: ServiceId, data\?: ServiceQuery\)/);
});

test("protocol field batch save endpoint is wrapped", () => {
  assert.match(parseSource, /postRequest\("\/api\/protocol-field-definition\/batch-save", data\)/);
  assert.match(parseSource, /batchSaveProtocolFields/);
  assert.match(parseTypeSource, /batchSaveProtocolFields\(data: ProtocolFieldDefinition\[\]\)/);
});
