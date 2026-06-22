import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");

test("protocol management moves JSON upload into the field editor dialog", () => {
  assert.match(source, /当前协议信息/);
  assert.match(source, /端口号使用协议ID，保存时会同步保存协议和字段列表/);
  assert.match(source, /上传JSON/);
  assert.match(source, /保存全部/);
  assert.match(source, /saveProtocolAndFields/);
  assert.match(source, /accept="\.json,application\/json"/);
  assert.match(source, /ref="protocolJsonDialogInputRef"/);
  assert.match(source, /triggerProtocolJsonDialogUpload/);
  assert.match(source, /protocolJsonDialogInputRef\.value\?\.click\(\)/);
  assert.match(source, /handleProtocolJsonDialogFileChange/);
  assert.match(source, /updateProtocolDefinition\(targetProtocolId, payload\)/);
  assert.match(source, /batchSaveProtocolFields\(fieldPayload\)/);
  assert.doesNotMatch(source, /@click="triggerProtocolJsonUpload"/);
  assert.doesNotMatch(source, /ref="protocolJsonInputRef"/);
  assert.doesNotMatch(source, /@click="saveActiveFieldProtocol"/);
  assert.doesNotMatch(source, /<label v-if="activeConfig\.key === 'protocol'" class="toolbar-button toolbar-button--upload"/);
});

test("protocol management follows the provided table actions and import aliases", () => {
  assert.match(source, /新增协议/);
  assert.match(source, /编辑字段/);
  assert.match(source, /openProtocolFieldEditor/);
  assert.doesNotMatch(source, /查看字段/);
  assert.doesNotMatch(source, /viewProtocolFields/);
  assert.match(source, /\{ key: "id", label: "端口"/);
  assert.match(source, /id: normalizeImportNumber\(getFirstImportValue\(protocol, \["id", "port", "portNumber", "listenPort"\]\)\)/);
  assert.match(source, /portNumber/);
  assert.match(source, /normalizeProtocolFieldImportPayload/);
  assert.match(source, /isAlertField/);
  assert.match(source, /isCorrectedField/);
});

test("protocol field editor uses inline editable and movable field rows", () => {
  assert.match(source, /data-layout--field-editor/);
  assert.match(source, /isProtocolFieldEditor/);
  assert.match(source, /class="table-input"/);
  assert.match(source, /class="table-select"/);
  assert.match(source, /handleInlineFieldInput/);
  assert.match(source, /handleInlineFieldBooleanChange/);
  assert.match(source, /handleFieldDragStart/);
  assert.match(source, /handleFieldDrop/);
  assert.match(source, /moveFieldRecord/);
  assert.match(source, /syncFieldSortOrder/);
  assert.match(source, /buildFieldRecordsPayload/);
});

test("pagination supports editable current page and blur jump", () => {
  assert.match(source, /v-model="pageInputValue"/);
  assert.match(source, /@blur="commitPageInput"/);
  assert.match(source, /function commitPageInput/);
  assert.match(source, /function jumpToPage/);
});
