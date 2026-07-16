import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(new URL("../src/services/leak-monitor/device-query.ts", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../src/pages/leak-monitor/composables/useLeakMonitorWorkspace.ts", import.meta.url), "utf8");
const sidebar = readFileSync(new URL("../src/pages/leak-monitor/components/LeakMonitorSidebar.vue", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../src/pages/leak-monitor/components/DeviceDetailDialog.vue", import.meta.url), "utf8");
const tencentMap = readFileSync(new URL("../src/pages/leak-monitor/components/TencentLeakMap.vue", import.meta.url), "utf8");
const googleMap = readFileSync(new URL("../src/pages/leak-monitor/components/GoogleLeakMap.vue", import.meta.url), "utf8");

test("sidebar uses the required statistics and paginated device endpoint", () => {
  assert.match(service, /postRequest\("\/api\/device-query\/sidebar", data\)/);
  assert.match(service, /sidebar\/communication-success-rate/);
  assert.match(service, /sidebar\/today-online-rate/);
  assert.match(service, /sidebar\/tcp-today-online-rate/);
  assert.match(service, /pageNum: page\.current/);
  assert.match(service, /pageSize: page\.size/);
  assert.match(service, /latestInstalled: optionalBoolean/);
});

test("leak status mapping follows backend codes 1 normal 2 suspect 0 leak 3 unknown", () => {
  assert.match(service, /code === 1[\s\S]*status: "normal"/);
  assert.match(service, /code === 2[\s\S]*status: "suspect"/);
  assert.match(service, /code === 0[\s\S]*status: "leak"/);
  assert.match(sidebar, /\{ label: "正常", value: "1" \}/);
  assert.match(sidebar, /\{ label: "疑似", value: "2" \}/);
  assert.match(sidebar, /\{ label: "渗漏", value: "0" \}/);
  assert.match(sidebar, /\{ label: "未知", value: "3" \}/);
});

test("sidebar renders required rates counts filters columns and backend pagination", () => {
  for (const label of ["通讯成功率", "设备上线率", "正常", "疑似", "渗漏", "未知"]) {
    assert.match(workspace, new RegExp(label));
  }
  for (const label of ["设备编号", "设备类型", "在线状态", "设备状态", "当日新增", "最新安装", "人工分析", "蓝鲸分析"]) {
    assert.match(sidebar, new RegExp(label));
  }
  assert.match(sidebar, /page\.current \+ 1/);
  assert.match(sidebar, /page\.current - 1/);
});

test("device dialog implements audio trend history detail and maintenance endpoints", () => {
  for (const endpoint of [
    "/api/device/",
    "/api/data-query/audio/page",
    "/api/data-query/leakage/feature-trend/",
    "/api/data-query/audio/daily-latest/",
    "/api/maintenance-record/manage/page",
  ]) {
    assert.ok(service.includes(endpoint), endpoint);
  }
  assert.match(service, /parseStatus: "success"/);
  assert.match(service, /sortOrder: "desc"/);
  assert.match(dialog, /噪声分析/);
  assert.match(dialog, /历史数据/);
  assert.match(dialog, /设备详情/);
  assert.match(dialog, /维护记录/);
  assert.match(dialog, /const maintenancePageSize = 6/);
  assert.match(dialog, /拆卸总次数/);
  assert.match(dialog, /安装总次数/);
});

test("both map providers render leakProperty in status-colored markers", () => {
  assert.match(googleMap, /text: point\.leakProperty === null/);
  assert.match(googleMap, /normal: "#00a870"/);
  assert.match(tencentMap, /createMarkerStyles/);
  assert.match(tencentMap, /point\.leakProperty === null/);
  assert.match(tencentMap, /normal: "#00a870"/);
  assert.match(tencentMap, /suspect: "#f59e0b"/);
  assert.match(tencentMap, /leak: "#ef4444"/);
});