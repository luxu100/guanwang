import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dataReceiveSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");
const searchTemplateSource = readFileSync(new URL("../src/pages/system/search/components/SearchTemplateView.vue", import.meta.url), "utf8");

test("data receive filters submit names instead of entity ids", () => {
  assert.match(dataReceiveSource, /\{ key: "deviceName", label: "设备名称" \}/);
  assert.match(dataReceiveSource, /\{ key: "protocolName", label: "协议名称" \}/);
  assert.match(dataReceiveSource, /\{ key: "samplingName", label: "采样名称" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceId", label: "设备ID" \},\s*\.\.\.baseTimeFilters/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "protocolId", label: "协议ID" \},\s*\.\.\.baseTimeFilters/);
  assert.match(dataReceiveSource, /\.\.\.filterModel\.value/);
});

test("system query template filters submit business names", () => {
  assert.match(searchTemplateSource, /v-model="filters\.protocolName"/);
  assert.match(searchTemplateSource, /v-model="filters\.deviceName"/);
  assert.match(searchTemplateSource, /protocolName: filters\.protocolName\.trim\(\) \|\| undefined/);
  assert.match(searchTemplateSource, /deviceName: filters\.deviceName\.trim\(\) \|\| undefined/);
  assert.doesNotMatch(searchTemplateSource, /protocolId:\s*filters\./);
  assert.doesNotMatch(searchTemplateSource, /deviceId:\s*filters\./);
});

test("name-based table cells resolve ids only as display fallbacks", () => {
  assert.match(dataReceiveSource, /normalizeDeviceNameRecords/);
  assert.match(dataReceiveSource, /normalizeDeviceProtocolRelations/);
  assert.match(dataReceiveSource, /getDeviceDetail\(deviceId\)/);
  assert.match(dataReceiveSource, /deviceNumber:\s*getText\(detail, \["deviceNumber"\], ""\)/);
  assert.match(dataReceiveSource, /deviceAlias:\s*getText\(detail, \["deviceAlias"\], ""\)/);
  assert.match(dataReceiveSource, /\{ key: "deviceNumber", label: "设备编号"/);
  assert.match(dataReceiveSource, /\{ key: "deviceName", label: "设备名称"/);
  assert.doesNotMatch(dataReceiveSource, /deviceName:\s*[\s\S]{0,220}getValue\(item, \["deviceId"\]\)/);
  assert.doesNotMatch(dataReceiveSource, /deviceNameById\.value\.get\(String\(getValue\(item, \["deviceId"\]/);
  assert.match(searchTemplateSource, /getTemplateProtocolName/);
  assert.match(searchTemplateSource, /getTemplateDeviceName/);
});
