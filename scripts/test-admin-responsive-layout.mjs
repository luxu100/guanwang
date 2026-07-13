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
  assert.match(systemSource, /\.content-layout--user\s*\{[\s\S]*?grid-template-rows:\s*minmax\(160px, 0\.8fr\) minmax\(320px, 1\.2fr\);/);
  assert.match(systemSource, /\.content-layout--user \.form-grid--user\s*\{[\s\S]*?padding-bottom:\s*16px;/);
  assert.match(systemSource, /\.content-layout--user \.form-field\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(systemSource, /\.content-layout--dict\s*\{[\s\S]*?minmax\(280px, 0\.78fr\)/);
  assert.match(systemSource, /\.detail-panel--dict \.form-grid\s*\{[\s\S]*?overflow-y:\s*auto;/);
  assert.match(systemSource, /\.detail-panel--dict \.form-field\s*\{[\s\S]*?overflow:\s*visible;/);
  assert.match(systemSource, /\.check-grid\s*\{[\s\S]*?max-width:\s*100%;/);
});

test("admin tables and module containers scroll instead of clipping overflowing content", () => {
  assert.match(systemSource, /\.system-view\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.content-layout\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.table-scroll,\s*\r?\n\.permission-tree\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(systemSource, /\.data-table\s*\{[\s\S]*?display:\s*table;[\s\S]*?table-layout:\s*auto;[\s\S]*?width:\s*max-content;/);
  assert.match(systemSource, /\.data-row\s*\{[\s\S]*?display:\s*table-row;/);
  assert.match(systemSource, /\.data-cell\s*\{[\s\S]*?display:\s*table-cell;/);
  assert.match(systemSource, /\.data-table--user \.data-cell--email\s*\{[\s\S]*?min-width:\s*240px;/);
  assert.match(systemSource, /\.data-cell\s*\{[\s\S]*?overflow:\s*visible;/);

  assert.match(dataReceiveSource, /\.data-receive-view\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.match(dataReceiveSource, /\.data-layout\s*\{[\s\S]*?overflow:\s*auto;/);
  assert.doesNotMatch(dataReceiveSource, /activeTableColumns|gridTemplateColumns/);
  assert.match(dataReceiveSource, /getColumnMinWidth\(column\)/);
  assert.match(dataReceiveSource, /\.data-table\s*\{[\s\S]*?display:\s*table;[\s\S]*?table-layout:\s*auto;[\s\S]*?width:\s*max-content;/);
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
  assert.match(dataReceiveSource, /\.row-actions\s*\{[\s\S]*?justify-content:\s*center;[\s\S]*?width:\s*100%;/);

  const protocolFieldIndex = searchTemplateSource.indexOf("pqt-form__item--protocol");
  const templateNameIndex = searchTemplateSource.indexOf("模板名称", protocolFieldIndex);
  assert.ok(protocolFieldIndex >= 0 && templateNameIndex > protocolFieldIndex);
  assert.match(searchTemplateSource, /\.pqt-form__item--protocol\s*\{[\s\S]*?width:\s*100%;/);
});
