import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync(new URL("../src/services/leak-monitor/device-query.ts", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../src/pages/leak-monitor/composables/useLeakMonitorWorkspace.ts", import.meta.url), "utf8");
const sidebar = readFileSync(new URL("../src/pages/leak-monitor/components/LeakMonitorSidebar.vue", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../src/pages/leak-monitor/components/DeviceDetailDialog.vue", import.meta.url), "utf8");
const chart = readFileSync(new URL("../src/pages/leak-monitor/components/DeviceSpectrumChart.vue", import.meta.url), "utf8");
const localeMap = readFileSync(new URL("../src/pages/leak-monitor/components/LocaleLeakMap.vue", import.meta.url), "utf8");
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
  assert.match(sidebar, /\.leak-sidebar--collapsed\s*\{[\s\S]*?top:\s*min\(286px, calc\(100% - 64px\)\);[\s\S]*?width:\s*48px;/);
});

test("device dialog implements audio trend history detail and maintenance endpoints", () => {
  for (const endpoint of [
    "/api/device/",
    "/api/data-query/audio/page",
    "/api/data-query/leakage/page",
    "/api/maintenance-record/page",
  ]) {
    assert.ok(service.includes(endpoint), endpoint);
  }
  assert.match(service, /parseStatus: "success"/);
  assert.match(service, /sortOrder: "desc"/);
  assert.match(dialog, /t\("noiseAnalysis"\)/);
  assert.match(dialog, /t\("historyData"\)/);
  assert.match(dialog, /t\("deviceDetail"\)/);
  assert.match(dialog, /t\("maintenanceRecords"\)/);
  assert.match(dialog, /const maintenancePageSize = 6/);
  assert.match(dialog, /t\("uninstallCount"\)/);
  assert.match(dialog, /t\("installCount"\)/);
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

test("noise charts support numeric coordinates hover values and zoom", () => {
  assert.match(chart, /type: "value"/);
  assert.match(chart, /axisPointer: \{ type: "cross"/);
  assert.match(chart, /dataZoom: zoomControls/);
  assert.match(chart, /zoomOnMouseWheel: true/);
  assert.match(chart, /feature: \{[\s\S]*dataZoom:[\s\S]*restore:[\s\S]*saveAsImage:/);
  assert.match(chart, /type: "heatmap"/);
  assert.match(chart, /const timeLabels = props\.matrix\.map/);
  assert.match(chart, /type: "category"[\s\S]*data: timeLabels/);
  assert.match(chart, /data: frequencyLabels/);
  assert.match(chart, /progressive: 0/);
  assert.match(chart, /#151b62/);
  assert.match(chart, /borderColor: "rgba\(218,205,255,.48\)"/);
  assert.match(chart, /text: t\("frequency"\)\.replace/);
  assert.match(chart, /text: `\$\{t\("time"\)\}\/s`/);
});

test("daily spectrum uses an interactive line3D waterfall", () => {
  assert.match(chart, /import "echarts-gl"/);
  assert.match(chart, /type: "line3D"/);
  assert.match(chart, /coordinateSystem: "cartesian3D"/);
  assert.match(chart, /grid3D:/);
  assert.match(chart, /xAxis3D:/);
  assert.match(chart, /yAxis3D:/);
  assert.match(chart, /zAxis3D:/);
  assert.match(chart, /rotateSensitivity: 1/);
  assert.match(chart, /boxWidth: 210/);
  assert.match(chart, /boxHeight: 112/);
  assert.match(chart, /distance: 200/);
  assert.match(chart, /height: clamp\(520px, calc\(100vh - 560px\), 680px\)/);
  assert.match(chart, /maxFrequency/);
  assert.doesNotMatch(chart, /value \+ seriesIndex \* 22/);
  assert.doesNotMatch(chart, /type: "custom"/);
  assert.match(workspace, /sampleRate: analysis\.sampleRate/);
});

test("manual correlation and finder tabs reuse visible user devices", () => {
  for (const key of ['"manual"', '"correlation"', '"finder"']) {
    assert.ok(dialog.includes(key), key);
  }
  assert.match(service, /getLeakMonitorManualAnalysisPage[\s\S]*\/api\/data-query\/leakage\/page/);
  assert.match(service, /postRequest\("\/api\/manual-analysis\/work-orders", data\)/);
  assert.match(dialog, /haversineDistance/);
  assert.match(dialog, /props\.visibleDevices/);
  assert.match(localeMap, /:visible-devices="mapDevices"/);
  assert.match(service, /getRequest\("\/api\/device\/visible-list", params\)/);
  assert.doesNotMatch(dialog, /\/api\/device\/list/);
  assert.match(dialog, /TencentLeakMap[\s\S]*GoogleLeakMap/);
  assert.match(dialog, /currentDevicePoint/);
  assert.doesNotMatch(dialog, /finderKeyword/);
  assert.doesNotMatch(dialog, /finder-search/);
});

test("detail tab errors are isolated and optional requests are lazy", () => {
  for (const field of [
    "analysisError",
    "historyError",
    "detailError",
    "maintenanceError",
    "manualError",
  ]) {
    assert.ok(dialog.includes(`detail.${field}`), field);
  }
  assert.doesNotMatch(dialog, /detail\.errorMessage/);
  assert.doesNotMatch(workspace, /void loadManualAnalysis\(sourceDevice\)/);
  assert.match(dialog, /tab === "manual"[\s\S]*emit\("load-manual"\)/);
});

test("historical feature values keep the maximum valid value for each date", () => {
  assert.match(service, /const maximumByDate = new Map<string, FeatureTrendPoint>/);
  assert.match(service, /candidateValue > currentValue/);
  assert.match(service, /Array\.from\(maximumByDate\.values\(\)\)\.sort/);
  assert.match(dialog, /const historyPoints = computed\(\(\) => \{[\s\S]*maximumByDate/);
});

test("a single historical feature bar keeps a normal fixed width", () => {
  assert.match(chart, /barMaxWidth: isBar \? 52 : undefined/);
  assert.match(chart, /barCategoryGap: isBar \? "58%" : undefined/);
});
