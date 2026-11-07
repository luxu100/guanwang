import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/services/partition/partition.js", import.meta.url), "utf8");
const typeSource = readFileSync(new URL("../src/services/partition/partition.d.ts", import.meta.url), "utf8");
const parseSource = readFileSync(new URL("../src/services/data-receive/parse.js", import.meta.url), "utf8");
const parseTypeSource = readFileSync(new URL("../src/services/data-receive/parse.d.ts", import.meta.url), "utf8");
const accessSource = readFileSync(new URL("../src/services/data-receive/access.js", import.meta.url), "utf8");
const accessTypeSource = readFileSync(new URL("../src/services/data-receive/access.d.ts", import.meta.url), "utf8");
const dataReceiveViewSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");
const deviceProtocolViewSource = readFileSync(new URL("../src/pages/device/protocol/components/DeviceProtocolTableView.vue", import.meta.url), "utf8");
const sharedTableSource = readFileSync(new URL("../src/pages/device/components/x/table/XDataTable.vue", import.meta.url), "utf8");
const sharedTableStyles = readFileSync(new URL("../src/pages/device/components/x/table/styles/table.css", import.meta.url), "utf8");

test("partition semantic exports use region endpoints", () => {
  assert.match(source, /const regionApi = createCrudService\("\/api\/region"\)/);
  assert.match(source, /export const getPartitionPage = regionApi\.getPage/);
  assert.match(source, /export const createPartition = regionApi\.create/);
  assert.match(source, /export const getRegionList = regionApi\.getList/);
});

test("tube network endpoints remain explicit and separate", () => {
  assert.match(source, /const tubeNetworkApi = createCrudService\("\/api\/tube-network"\)/);
  assert.match(source, /export const getTubeNetworkPage = tubeNetworkApi\.getPage/);
  assert.doesNotMatch(source, /export const getPartitionPage = tubeNetworkApi\.getPage/);
});

test("partition devices use backend region-device endpoints", () => {
  assert.match(source, /function getPartitionDevicePage\(partitionId, data = \{\}\)/);
  assert.match(source, /postRequest\(`\/api\/region\/\$\{partitionId\}\/devices\/page`, data\)/);
  assert.match(source, /function getPartitionDeviceList\(partitionId, params\)/);
  assert.match(source, /getRequest\(`\/api\/region\/\$\{partitionId\}\/devices`, params\)/);
  assert.match(source, /function getPartitionTree\(params\)/);
  assert.match(source, /getRequest\("\/api\/region\/tree", params\)/);
  assert.match(typeSource, /getPartitionDevicePage\(partitionId: ServiceId, data\?: ServiceQuery\)/);
  assert.match(typeSource, /getPartitionDeviceList\(partitionId: ServiceId, params\?: ServiceQuery\)/);
  assert.match(typeSource, /getPartitionTree\(params\?: ServiceQuery\)/);
});

test("legacy department endpoints remain explicit and separate", () => {
  assert.match(source, /const deptApi = createCrudService\("\/api\/dept"\)/);
  assert.match(source, /export const getDeptPage = deptApi\.getPage/);
  assert.match(source, /postRequest\(`\/api\/dept\/\$\{deptId\}\/devices\/page`, data\)/);
  assert.match(source, /getRequest\("\/api\/dept\/tree", params\)/);
  assert.doesNotMatch(source, /export const getPartitionPage = deptApi\.getPage/);
});

test("protocol field batch save endpoint is wrapped", () => {
  assert.match(parseSource, /postRequest\("\/api\/protocol-field-definition\/batch-save", data\)/);
  assert.match(parseSource, /batchSaveProtocolFields/);
  assert.match(parseTypeSource, /batchSaveProtocolFields\(data: ProtocolFieldDefinition\[\]\)/);
});

test("protocol field format metadata endpoint is wrapped and used", () => {
  assert.match(parseSource, /getRequest\("\/api\/protocol-field-formats", params\)/);
  assert.match(parseTypeSource, /interface FieldFormatMetadata/);
  assert.match(dataReceiveViewSource, /getProtocolFieldFormats/);
  assert.match(dataReceiveViewSource, /startPosition: normalizeImportNumber\(getFirstImportValue\(field, \["startPosition", "startBit", "offset", "start"\]\)\)/);
});

test("device protocol creation validates selected environment IDs and scene", () => {
  assert.match(accessSource, /deviceProtocolRelationApi\.create\(buildBindingPayload\(data, true\)\)/);
  assert.match(accessSource, /deviceProtocolRelationApi\.update\(id, buildBindingPayload\(data\)\)/);
  assert.match(accessTypeSource, /DeviceProtocolRelationPayload = Pick<DeviceProtocolRelation, "deviceId" \| "protocolId"/);
  assert.match(accessTypeSource, /scene: BindingScene/);
  assert.match(dataReceiveViewSource, /\{ key: "deviceId", label: "设备", type: "select", options: bindingDeviceOptions, required: true \}/);
  assert.match(dataReceiveViewSource, /\{ key: "protocolId", label: "协议", type: "select", options: bindingProtocolOptions, required: true \}/);
  assert.doesNotMatch(dataReceiveViewSource, /\{ key: "deviceId", label: "设备ID", type: "number", required: true \}/);
  assert.match(dataReceiveViewSource, /deviceNumber: getText\(item, \["deviceNumber", "device_number"\], "-"\)/);
});

test("device protocol loading states are centered in both module views", () => {
  assert.match(dataReceiveViewSource, /\.table-state \{[\s\S]*display: flex;[\s\S]*align-items: center;[\s\S]*justify-content: center;/);
  assert.match(deviceProtocolViewSource, /<XDataTable\s[^>]*:loading="loading"/);
  assert.match(sharedTableSource, /v-if="loading" class="loading-mask"/);
  assert.match(sharedTableStyles, /\.loading-mask\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/);
});

test("updated protocol parse service wraps list detail and parsed-json endpoints", () => {
  assert.match(parseSource, /export const getProtocolFieldList = protocolFieldDefinitionApi\.getList/);
  assert.match(parseSource, /export async function batchDeleteProtocolField\(ids, isForce\)\s*\{\s*return assertProtocolResponse\(await protocolFieldDefinitionApi\.batchDelete\(ids, isForce\)\)/);
  assert.match(parseSource, /export const getProtocolParseRecordList = protocolParseRecordApi\.getList/);
  assert.match(parseSource, /export const getProtocolParseRecordDetail = protocolParseRecordApi\.getDetail/);
  assert.match(parseSource, /postRequest\("\/api\/protocol-parse-record\/parsed-json\/page", data\)/);
  assert.match(parseTypeSource, /interface ProtocolParseRecordJson/);
  assert.match(parseTypeSource, /getProtocolParsedJsonPage\(data: ProtocolParseRecordQuery\)/);
});
