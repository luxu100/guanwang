import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const systemSource = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");
const dataReceiveSource = readFileSync(new URL("../src/pages/data-receive/components/DataReceiveView.vue", import.meta.url), "utf8");

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
  assert.match(systemSource, /\.check-grid\s*\{[\s\S]*?max-width:\s*100%;/);
});
