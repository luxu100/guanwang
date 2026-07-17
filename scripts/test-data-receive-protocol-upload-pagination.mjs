import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/data-receive/localized/components/DataReceiveView.vue", import.meta.url), "utf8");

test("protocol management moves JSON upload into the field editor dialog", () => {
  assert.match(source, /当前协议信息/);
  assert.match(source, /保存时会同步更新协议信息和字段列表/);
  assert.match(source, /上传JSON/);
  assert.match(source, /保存全部/);
  assert.match(source, /saveProtocolAndFields/);
  assert.match(source, /accept="\.json,application\/json"/);
  assert.match(source, /ref="protocolJsonDialogInputRef"/);
  assert.match(source, /triggerProtocolJsonDialogUpload/);
  assert.match(source, /protocolJsonDialogInputRef\.value\?\.click\(\)/);
  assert.match(source, /handleProtocolJsonDialogFileChange/);
  assert.match(source, /updateProtocolDefinition\(targetProtocolId, payload\)/);
  assert.match(source, /saveProtocolFieldRecordsIndividually\(fieldPayload\)/);
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
  assert.match(source, /\{ key: "id", label: "ID"/);
  assert.doesNotMatch(source, /\{ key: "description", label: "描述"/);
  assert.match(source, /id: normalizeImportNumber\(getFirstImportValue\(protocol, \["id", "port", "portNumber", "listenPort"\]\)\)/);
  assert.match(source, /portNumber/);
  assert.match(source, /normalizeProtocolFieldImportPayload/);
  assert.match(source, /isAlertField/);
  assert.match(source, /isCorrectedField/);
});

test("protocol field editor recalculates moved rows and saves only changed sortOrder", () => {
  assert.match(source, /data-layout--field-editor/);
  assert.match(source, /isProtocolFieldEditor/);
  assert.match(source, /class="table-input"/);
  assert.match(source, /class="table-select"/);
  assert.match(source, /handleInlineFieldInput/);
  assert.match(source, /handleInlineFieldBooleanChange/);
  assert.match(source, /captureFieldRecordBaselines/);
  assert.match(source, /sortProtocolFieldRecords/);
  assert.match(source, /handleFieldDragStart/);
  assert.match(source, /handleFieldDrop/);
  assert.match(source, /moveFieldRecord/);
  assert.match(source, /syncFieldSortOrder/);
  assert.match(source, /item\.sortOrder = \(index \+ 1\) \* 10/);
  assert.match(source, /buildChangedFieldRecordsPayload/);
  assert.match(source, /buildChangedFieldRecordPayload/);
  assert.match(source, /sortOrder: normalizeInlineNumberValue\(getValue\(item, \["sortOrder"\]\)\)/);
  assert.match(source, /protocolId: normalizeInlineNumberValue\(getValue\(normalized, \["protocolId"\]\)\)/);
  assert.match(source, /afn: getValue\(normalized, \["afn"\]\)/);
  assert.match(source, /fieldName: getValue\(normalized, \["fieldName"\]\)/);
  assert.match(source, /format: getValue\(normalized, \["format"\]\)/);
});

test("pagination supports editable current page and blur jump", () => {
  assert.match(source, /v-model="pageInputValue"/);
  assert.match(source, /@blur="commitPageInput"/);
  assert.match(source, /function commitPageInput/);
  assert.match(source, /function jumpToPage/);
});

test("protocol field editor loads protocol-scoped fields and paginates them locally", () => {
  assert.match(source, /loadRecords: \(query, filters\) => filters\.protocolId\s*\?\s*getFieldsByProtocol\(filters\.protocolId\)\s*:\s*getProtocolFieldPage\(query\)/);
  assert.match(source, /\? paginateProtocolFieldRecords\(parsed\.records\)/);
  assert.match(source, /function paginateProtocolFieldRecords\(items: RecordLike\[\]\)/);
  assert.match(source, /const startIndex = \(pagination\.pageNum - 1\) \* pagination\.pageSize/);
  assert.match(source, /return sortedRecords\.slice\(startIndex, startIndex \+ pagination\.pageSize\)/);
});

test("protocol field editor preserves field ids and updates existing rows", () => {
  assert.match(source, /function getProtocolFieldId/);
  assert.match(source, /\["id", "fieldId", "protocolFieldId", "definitionId"\]/);
  assert.match(source, /const id = getProtocolFieldId\(item\)/);
  assert.match(source, /normalized\.id = id/);
  assert.match(source, /const id = getProtocolFieldId\(payload\)/);
  assert.match(source, /\? await updateProtocolField\(id, payload as ProtocolFieldDefinition\)/);
  assert.match(source, /: await createProtocolField\(payload as ProtocolFieldDefinition\)/);
});
