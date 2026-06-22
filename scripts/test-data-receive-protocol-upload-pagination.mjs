import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");

test("protocol management exposes JSON upload and submits through protocol creation", () => {
  assert.match(source, /上传JSON/);
  assert.match(source, /accept="\.json,application\/json"/);
  assert.match(source, /ref="protocolJsonInputRef"/);
  assert.match(source, /triggerProtocolJsonUpload/);
  assert.match(source, /protocolJsonInputRef\.value\?\.click\(\)/);
  assert.match(source, /handleProtocolJsonFileChange/);
  assert.match(source, /createProtocolDefinition\(payload\)/);
  assert.doesNotMatch(source, /<label v-if="activeConfig\.key === 'protocol'" class="toolbar-button toolbar-button--upload"/);
});

test("protocol management follows the provided table actions and import aliases", () => {
  assert.match(source, /新增协议/);
  assert.match(source, /查看字段/);
  assert.match(source, /viewProtocolFields/);
  assert.match(source, /label: "端口"/);
  assert.match(source, /portNumber/);
  assert.match(source, /normalizeProtocolFieldImportPayload/);
  assert.match(source, /isAlertField/);
  assert.match(source, /isCorrectedField/);
});

test("pagination supports editable current page and blur jump", () => {
  assert.match(source, /v-model="pageInputValue"/);
  assert.match(source, /@blur="commitPageInput"/);
  assert.match(source, /function commitPageInput/);
  assert.match(source, /function jumpToPage/);
});
