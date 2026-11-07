import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dataReceiveSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");
const searchTemplateSource = readFileSync(new URL("../src/pages/system/search/components/SearchTemplateView.vue", import.meta.url), "utf8");

test("data receive filters submit device numbers instead of device names or ids", () => {
  assert.match(dataReceiveSource, /\{ key: "deviceNumber", label: "设备编号" \}/);
  assert.match(dataReceiveSource, /\{ key: "protocolName", label: "协议名称" \}/);
  assert.match(dataReceiveSource, /\{ key: "samplingName", label: "采样名称" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceId", label: "设备ID" \},\s*\.\.\.baseTimeFilters/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "protocolId", label: "协议ID" \},\s*\.\.\.baseTimeFilters/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceName", label: "设备名称" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceAlias", label: "设备名称" \}/);
  assert.match(dataReceiveSource, /\.\.\.filterModel\.value/);
});

test("device protocol relation query follows the updated page contract", () => {
  const relationStart = dataReceiveSource.indexOf('  relation: {');
  const relationEnd = dataReceiveSource.indexOf('  field: {', relationStart);
  const relationSource = dataReceiveSource.slice(relationStart, relationEnd);

  assert.match(relationSource, /\{ key: "deviceNumber", label: "设备编号" \}/);
  assert.doesNotMatch(relationSource, /\{ key: "deviceName", label: "设备名称" \}/);
  assert.doesNotMatch(relationSource, /\{ key: "deviceAlias", label: "设备名称" \}/);
  assert.doesNotMatch(relationSource, /\{ key: "protocolName", label: "协议名称" \}/);
  assert.match(relationSource, /\.\.\.baseTimeFilters/);
  assert.match(relationSource, /getDeviceProtocolRelationPage\(query\)/);
});

test("system query template filters omit device queries", () => {
  assert.match(searchTemplateSource, /v-model="filters\.protocolName"/);
  assert.match(searchTemplateSource, /protocolName: filters\.protocolName\.trim\(\) \|\| undefined/);
  assert.doesNotMatch(searchTemplateSource, /v-model="filters\.deviceNumber"/);
  assert.doesNotMatch(searchTemplateSource, /deviceNumber:\s*filters\./);
  assert.doesNotMatch(searchTemplateSource, /deviceName:\s*filters\./);
  assert.doesNotMatch(searchTemplateSource, /deviceAlias:\s*filters\./);
  assert.doesNotMatch(searchTemplateSource, /protocolId:\s*filters\./);
  assert.doesNotMatch(searchTemplateSource, /deviceId:\s*filters\./);
});

test("name-based table cells resolve ids only as display fallbacks", () => {
  assert.match(dataReceiveSource, /normalizeDeviceNameRecords/);
  assert.match(dataReceiveSource, /normalizeDeviceProtocolRelations/);
  assert.doesNotMatch(dataReceiveSource, /getDeviceDetail/);
  assert.doesNotMatch(dataReceiveSource, /ensureRelationDeviceDetails/);
  assert.match(dataReceiveSource, /deviceNumber:\s*getText\(item, \["deviceNumber", "device_number"\], "-"\)/);
  assert.match(dataReceiveSource, /\{ key: "deviceNumber", label: "设备编号"/);
  assert.match(dataReceiveSource, /\{ key: "deviceName", label: "设备名称"/);
  assert.doesNotMatch(dataReceiveSource, /deviceName:\s*[\s\S]{0,220}getValue\(item, \["deviceId"\]\)/);
  assert.doesNotMatch(dataReceiveSource, /deviceNameById\.value\.get\(String\(getValue\(item, \["deviceId"\]/);
  assert.match(searchTemplateSource, /getTemplateProtocolName/);
  assert.doesNotMatch(searchTemplateSource, /getTemplateDeviceName/);
});

test("requested tables omit device name columns", () => {
  const relationStart = dataReceiveSource.indexOf('  relation: {');
  const relationEnd = dataReceiveSource.indexOf('  field: {', relationStart);
  const relationSource = dataReceiveSource.slice(relationStart, relationEnd);

  assert.doesNotMatch(searchTemplateSource, />设备名称<\/view>/);
  assert.doesNotMatch(relationSource, /\{ key: "deviceName", label: "设备名称", width:/);
});
