import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const systemSource = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");
const dataReceiveSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");
const searchTemplateSource = readFileSync(new URL("../src/pages/system/search/components/SearchTemplateView.vue", import.meta.url), "utf8");

test("system and data receive modules do not render top metric cards", () => {
  assert.doesNotMatch(systemSource, /<AdminMetricRow\b|from "\@\/components\/admin\/AdminMetricRow\.vue"/);
  assert.doesNotMatch(dataReceiveSource, /<AdminMetricRow\b|from "\@\/components\/admin\/AdminMetricRow\.vue"/);
});

test("admin module layouts keep overflow inside panels on narrower screens", () => {
  assert.match(systemSource, /\.main-panel\s*\{[\s\S]*?min-width:\s*0;/);
  assert.match(systemSource, /@media \(max-width:\s*1360px\)[\s\S]*?\.content-layout--vertical/);
  assert.match(dataReceiveSource, /\.data-toolbar\s*\{[\s\S]*?flex-wrap:\s*wrap;/);
  assert.match(dataReceiveSource, /@media \(max-width:\s*1360px\)[\s\S]*?\.data-layout/);
  assert.match(systemSource, /\.data-cell > text:not\(\.status-pill\)/);
  assert.match(dataReceiveSource, /\.data-cell > text:not\(\.status-pill\)/);
});

test("detail forms constrain inputs to their panels", () => {
  assert.match(dataReceiveSource, /\.detail-body\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(dataReceiveSource, /\.detail-body :deep\(\.uni-scroll-view-content\)/);
  assert.match(dataReceiveSource, /\.form-field\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(dataReceiveSource, /\.form-input,\s*\r?\n\.form-select\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(systemSource, /\.content-layout\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(systemSource, /\.form-field\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(systemSource, /\.form-grid--user\s*\{[\s\S]*?repeat\(auto-fit, minmax\(220px, 1fr\)\)/);
  assert.match(systemSource, /class="content-layout content-layout--vertical content-layout--user"/);
  assert.match(systemSource, /\.content-layout--user\s*\{[\s\S]*?grid-template-rows:\s*minmax\(280px, 0\.95fr\) minmax\(260px, 0\.70fr\);/);
  assert.match(systemSource, /\.content-layout--user \.form-grid--user\s*\{[\s\S]*?padding-bottom:\s*16px;/);
  assert.match(systemSource, /\.content-layout--user \.form-field\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(systemSource, /\.check-grid\s*\{[\s\S]*?max-width:\s*100%;/);
  assert.match(systemSource, /\.filter-select\s*\{[\s\S]*?display:\s*flex;[\s\S]*?align-items:\s*center;[\s\S]*?line-height:\s*1;/);
});

test("admin tables and module containers scroll instead of clipping overflowing content", () => {
  assert.match(systemSource, /\.system-view\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.content-layout\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.table-scroll,\s*\r?\n\.permission-tree\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.data-table\s*\{[\s\S]*?display:\s*table;[\s\S]*?table-layout:\s*auto;[\s\S]*?width:\s*100%;/);
  assert.match(systemSource, /\.data-row\s*\{[\s\S]*?display:\s*table-row;/);
  assert.match(systemSource, /\.data-cell\s*\{[\s\S]*?display:\s*table-cell;/);
  assert.match(systemSource, /\.data-table--user \.data-cell--email\s*\{[\s\S]*?min-width:\s*240px;/);
  assert.match(systemSource, /\.data-cell\s*\{[\s\S]*?overflow:\s*visible;/);

  assert.match(dataReceiveSource, /\.data-receive-view\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(dataReceiveSource, /\.data-layout\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.doesNotMatch(dataReceiveSource, /activeTableColumns|gridTemplateColumns/);
  assert.match(dataReceiveSource, /getColumnMinWidth\(column\)/);
  assert.match(dataReceiveSource, /\.data-table\s*\{[\s\S]*?display:\s*table;[\s\S]*?table-layout:\s*auto;[\s\S]*?width:\s*100%;/);
  assert.doesNotMatch(dataReceiveSource, /\.data-table\s*\{[\s\S]*?min-height:\s*100%;[\s\S]*?\}/);
  assert.match(dataReceiveSource, /\.data-row\s*\{[\s\S]*?display:\s*table-row;/);
  assert.match(dataReceiveSource, /\.table-scroll\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(dataReceiveSource, /\.data-cell\s*\{[\s\S]*?display:\s*table-cell;/);
  assert.match(dataReceiveSource, /\.data-cell\s*\{[\s\S]*?overflow:\s*visible;/);
});

test("requested admin layout refinements remain in place", () => {
  assert.match(systemSource, /\.workspace--auth\s*\{[\s\S]*?minmax\(168px, 0\.19fr\)/);
  assert.match(systemSource, /\.content-layout--auth\s*\{[\s\S]*?minmax\(240px, 1fr\) minmax\(520px, 3fr\)/);
  assert.match(systemSource, /const visibleMenus = computed/);
  assert.match(systemSource, /v-for="item in visibleMenus"/);
  assert.match(systemSource, /class="menu-expand-arrow"/);
  assert.doesNotMatch(systemSource, /class="side-list__sub">\{\{ getText\(item, \['path'\]/);
  assert.match(systemSource, /\.permission-node__code\s*\{[\s\S]*?margin-left:\s*auto;[\s\S]*?text-align:\s*right;/);
  assert.match(systemSource, /\.content-layout--dict\s*\{[\s\S]*?minmax\(320px, 0\.9fr\)/);
  assert.match(systemSource, /\.detail-panel--dict \.form-grid\s*\{[\s\S]*?overflow-y:\s*auto;/);
  assert.match(systemSource, /\.detail-panel--dict \.form-field\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(systemSource, /\.detail-panel--dict \.form-actions\s*\{[\s\S]*?flex:\s*none;/);
  assert.match(dataReceiveSource, /\.row-actions\s*\{[\s\S]*?justify-content:\s*center;[\s\S]*?width:\s*100%;/);

  const protocolFieldIndex = searchTemplateSource.indexOf("pqt-form__item--protocol");
  const templateCodeIndex = searchTemplateSource.indexOf("pqt-form__item--template-code", protocolFieldIndex);
  const templateNameIndex = searchTemplateSource.indexOf("模板名称", templateCodeIndex);
  assert.ok(protocolFieldIndex >= 0 && templateCodeIndex > protocolFieldIndex && templateNameIndex > templateCodeIndex);
  assert.match(searchTemplateSource, /\.pqt-form__item--protocol,\s*\r?\n\.pqt-form__item--template-code\s*\{[\s\S]*?width:\s*100%;/);
  assert.match(dataReceiveSource, /\.form-grid--two-column\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(dataReceiveSource, /\.data-layout--parse\s*\{[\s\S]*?minmax\(390px, 0\.44fr\)/);
});

test("refresh animations and super admin partition locking remain enabled", () => {
  assert.match(systemSource, /icon-refresh--spinning/);
  assert.match(systemSource, /@keyframes system-refresh-spin/);
  assert.match(systemSource, /const isSuperAdminSelected = computed/);
  assert.match(systemSource, /syncSuperAdminPartitions/);
  assert.match(systemSource, /超级管理员自动绑定全部分区，不可手动修改/);
  assert.match(searchTemplateSource, /pqt-icon-refresh--spinning/);
  assert.match(searchTemplateSource, /@keyframes pqt-refresh-spin/);
  assert.match(dataReceiveSource, /icon-refresh--spinning/);
  assert.match(dataReceiveSource, /@keyframes data-receive-refresh-spin/);
});

test("query template omits device queries and parse hides the field tab", () => {
  assert.match(searchTemplateSource, /协议名称/);
  assert.match(searchTemplateSource, /v-model="filters\.protocolName"/);
  assert.doesNotMatch(searchTemplateSource, /v-model="filters\.deviceNumber"/);
  assert.doesNotMatch(searchTemplateSource, /getTemplateDeviceName/);
  assert.match(searchTemplateSource, /getTemplateProtocolName/);
  assert.match(dataReceiveSource, /parse:\s*\["parseRecord", "algorithmResult"\]/);
  assert.doesNotMatch(dataReceiveSource, /parse:\s*\["field",/);
  assert.match(dataReceiveSource, /\{ key: "protocolName", label: "协议名称" \}/);
  assert.match(dataReceiveSource, /\{ key: "deviceNumber", label: "设备编号" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceName", label: "设备名称" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceAlias", label: "设备名称" \}/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "deviceId", label: "设备ID" \},\s*\.\.\.baseTimeFilters/);
  assert.doesNotMatch(dataReceiveSource, /\{ key: "protocolId", label: "协议ID" \},\s*\.\.\.baseTimeFilters/);
});

test("data records render as a table without detail requests", () => {
  assert.match(dataReceiveSource, /const isTableOnly = computed\(\(\) => props\.mode === "record"\)/);
  assert.match(dataReceiveSource, /v-if="!isProtocolFieldEditor && !isTableOnly"/);
  assert.match(dataReceiveSource, /'data-layout--table-only': isTableOnly/);
  assert.match(dataReceiveSource, /if \(isTableOnly\.value\) \{\s*return;\s*\}/);
  assert.match(dataReceiveSource, /samplingRecord: createRecordSection\([\s\S]*?getSamplingRecordPage,\s*\[/);
  assert.doesNotMatch(dataReceiveSource, /samplingRecord: createRecordSection\([\s\S]*?getSamplingRecordDetail/);
  assert.doesNotMatch(dataReceiveSource, /samplingDetail: createRecordSection\([\s\S]*?getSamplingDetailDetail/);
});
