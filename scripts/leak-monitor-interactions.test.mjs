import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from '@vue/compiler-sfc';

const ref = (value) => ({ value });
const vue = { ref, reactive: (value) => value, computed: (get) => ({ get value() { return get(); } }), watch() {}, onMounted() {}, onBeforeUnmount() {} };
function load(path, modules = {}, globals = {}) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8');
  if (path.endsWith('.vue')) source = parse(source).descriptor.scriptSetup.content;
  const context = vm.createContext({
    exports: {}, console, URL, Blob, setTimeout, clearTimeout,
    require: (id) => id === 'vue' ? vue : modules[id] || {}, ...globals,
  });
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return { context, run: (code) => vm.runInContext(code, context) };
}

function mapHarness(provider) {
  const objects = [];
  const events = [];
  class Overlay {
    constructor(options) { this.options = options; this.map = options.map; this.updates = 0; this.listeners = {}; objects.push(this); }
    setOptions(options) { Object.assign(this.options, options); this.updates++; }
    setGeometries(geometries) { this.options.geometries = geometries; this.updates++; }
    setStyles(styles) { this.options.styles = styles; }
    setMap(map) { this.map = map; }
    addListener(event, handler) { this.listeners[event] = handler; }
    on(event, handler) { this.listeners[event] = handler; }
  }
  const props = { points: [{ deviceNumber: 'A', title: 'old', lat: 3, lng: 101, coordinateSystem: 'WGS84', leakProperty: 5, status: 'normal' }], regions: [{ id: 2, visible: true, minZoom: 8, maxZoom: 16, color: '#1686a0', coordinateSystem: 'WGS84', boundary: [{ lat: 3, lng: 101 }, { lat: 4, lng: 101 }, { lat: 4, lng: 102 }] }], selectedDeviceNumber: '', compact: false };
  const map = { zoom: 10, getZoom() { return this.zoom; } };
  let canvases = 0;
  const tmap = {
    LatLng: class { constructor(lat, lng) { Object.assign(this, { lat, lng }); } },
    MultiMarker: Overlay, MultiPolygon: Overlay,
    MarkerStyle: class { constructor(options) { Object.assign(this, options); } },
    PolygonStyle: class { constructor(options) { Object.assign(this, options); } },
  };
  const app = load(`../src/pages/leak-monitor/components/${provider === 'google' ? 'Google' : 'Tencent'}LeakMap.vue`, {
    '../i18n': { useLeakMonitorI18n: () => ({ language: ref('zh-CN'), t: (key) => key }) },
    '../coordinateTransform': { convertMapCoordinate: (point) => point, tencentDisplayCoordinate: (point) => point },
    './map-marker-style': { deviceBindingColor: () => null },
    '@/services/map/map': { MAP_CONFIG: { tencentKey: '' } },
  }, {
    defineProps: () => props, withDefaults: (value) => value, defineEmits: () => (...args) => events.push(args), defineExpose() {},
    window: { TMap: tmap, setTimeout, clearTimeout },
    document: { createElement() { canvases++; return { getContext: () => null, toDataURL: () => 'test' }; } },
    google: { maps: { Marker: Overlay, Polygon: Overlay, SymbolPath: { CIRCLE: 1 }, event: { clearInstanceListeners(overlay) { overlay.listeners = {}; } } } },
    testMap: map,
  });
  app.run('mapInstance = testMap');
  return { ...app, props, map, objects, events, canvases: () => canvases };
}

test('Google: reuse markers and read refreshed records in click handlers', () => {
  const app = mapHarness('google');
  app.run('renderMarkers()');
  const marker = app.objects[0];
  app.props.points = [{ ...app.props.points[0], title: 'updated', leakProperty: 8 }];
  app.run('renderMarkers()');
  assert.equal(app.objects.length, 1);
  assert.equal(marker.options.label.text, '8');
  marker.listeners.click();
  assert.equal(app.events[0][1].title, 'updated');
  app.props.points = [];
  app.run('renderMarkers()');
  assert.equal(marker.map, null);
  assert.deepEqual(marker.listeners, {});
});

test('Google: pan/zoom reuses polygons and only toggles visibility at thresholds', () => {
  const app = mapHarness('google');
  app.run('renderRegions()');
  const polygon = app.objects[0];
  for (let i = 0; i < 60; i++) app.run('renderRegions()');
  assert.equal(app.objects.length, 1);
  assert.equal(polygon.updates, 0);
  app.map.zoom = 17;
  app.run('renderRegions()');
  assert.equal(polygon.map, null);
  app.map.zoom = 10;
  app.run('renderRegions()');
  assert.equal(polygon.map, app.map);
  app.props.regions = [{ ...app.props.regions[0], color: '#ff0000' }];
  app.run('renderRegions()');
  assert.equal(polygon.options.fillColor, '#ff0000');
  app.props.regions = [];
  app.run('renderRegions()');
  assert.equal(polygon.map, null);
});

test('Tencent: unchanged zoom visibility does not upload polygon coordinates', () => {
  const app = mapHarness('tencent');
  app.run('renderRegions()');
  const polygon = app.objects[0];
  for (let i = 0; i < 60; i++) app.run('renderRegions()');
  assert.equal(polygon.updates, 0);
  app.map.zoom = 17;
  app.run('renderRegions()');
  assert.equal(polygon.options.geometries.length, 0);
  app.map.zoom = 10;
  app.run('renderRegions()');
  assert.equal(polygon.options.geometries.length, 1);
  app.props.regions = [{ ...app.props.regions[0], color: '#ff0000' }];
  app.run('renderRegions()');
  assert.equal(polygon.updates, 3);
});

test('Tencent: unchanged device symbols reuse raster styles', () => {
  const app = mapHarness('tencent');
  app.run('createMarkerStyles(); createMarkerStyles()');
  assert.equal(app.canvases(), 1);
  app.props.selectedDeviceNumber = 'A';
  app.run('createMarkerStyles()');
  assert.equal(app.canvases(), 2);
  app.props.points = [];
  app.run('createMarkerStyles()');
  assert.equal(app.run('markerStyleCache.size'), 0);
});

test('manual service rejects missing/non-200 codes and never dispatches on save', async () => {
  let response;
  const calls = [];
  const app = load('../src/services/leak-monitor/device-query.ts', { '@/services/shared/crud': { postRequest: async (...args) => { calls.push(args); return response; } } });
  for (const value of [null, {}, { code: 0 }, { code: 500, msg: 'rejected' }]) {
    response = value;
    await assert.rejects(app.context.exports.createLeakMonitorManualWorkOrder({}));
    await assert.rejects(app.context.exports.getLeakMonitorManualAnalysisPage('A'));
  }
  response = { code: 200, data: {} };
  await app.context.exports.createLeakMonitorManualWorkOrder({ deviceNo: 'A' });
  const count = calls.length;
  await assert.rejects(app.context.exports.submitLeakMonitorManualAnalysis({}), /独立/);
  assert.equal(calls.length, count);
});

function workspaceHarness(overrides = {}) {
  const calls = [];
  const messages = [];
  const app = load('../src/pages/leak-monitor/composables/useLeakMonitorWorkspace.ts', {
    '@/i18n': { useI18n: () => ({ locale: ref('zh-CN') }) },
    '../i18n': { useLeakMonitorI18n: () => ({ t: (key) => key }) },
    '../components/w84-gis-data': { buildW84TubeRecords: () => [] },
    '@/services/leak-monitor/device-query': { createLeakMonitorManualWorkOrder: async (payload) => { calls.push(payload); }, fetchLeakMonitorManualAnalysis: async () => [], ...overrides },
  }, { uni: { showToast: (message) => messages.push(message) } });
  const workspace = app.context.exports.useLeakMonitorWorkspace();
  workspace.selectedDevice.value = { id: 10, deviceNumber: 'A', regionId: 2, raw: {} };
  return { workspace, calls, messages, payload: { deviceId: 10, deviceNumber: 'A', manualAnalysis: '渗漏', manualAnalysisStatus: 0, troubleshootingFeedback: '待排查', reasonAnalysis: 'test', resetDate: '2026-10-24', dispatchRequested: true } };
}

test('manual dispatch validates IDs and real calendar dates before network', async () => {
  const app = workspaceHarness();
  await app.workspace.submitManualAnalysis({ ...app.payload, resetDate: '2026-02-31' });
  assert.equal(app.calls.length, 0);
  assert.equal(app.workspace.detail.value.manualError, 'manualInvalidDate');
  await app.workspace.submitManualAnalysis({ ...app.payload, deptId: '' });
  assert.equal(app.calls.length, 0);
  await app.workspace.submitManualAnalysis({ ...app.payload, dispatchRequested: false });
  assert.equal(app.calls.length, 0);
  await app.workspace.submitManualAnalysis(app.payload);
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].deviceNo, 'A');
  assert.equal(app.calls[0].deptId, 2);
  assert.equal(app.calls[0].leakageStatus, '渗漏');
  assert.equal(app.workspace.detail.value.manualSubmitting, false);
});

test('manual dispatch blocks duplicate clicks and device changes during submission', async () => {
  let resolve;
  let requests = 0;
  const app = workspaceHarness({ createLeakMonitorManualWorkOrder: () => { requests++; return new Promise((done) => { resolve = done; }); } });
  const pending = app.workspace.submitManualAnalysis(app.payload);
  await app.workspace.submitManualAnalysis(app.payload);
  await app.workspace.openDevice({ id: 11, deviceNumber: 'B', raw: {} });
  app.workspace.closeDetail();
  assert.equal(requests, 1);
  assert.equal(app.workspace.selectedDevice.value.deviceNumber, 'A');
  resolve();
  await pending;
  assert.equal(app.workspace.detail.value.manualSubmitting, false);
});

test('record refresh failure after creation is not reported as dispatch failure', async () => {
  const app = workspaceHarness({ fetchLeakMonitorManualAnalysis: async () => { throw new Error('offline'); } });
  await app.workspace.submitManualAnalysis(app.payload);
  assert.equal(app.calls.length, 1);
  assert.match(app.workspace.detail.value.manualError, /manualDispatchRefreshFailed.*offline/);
  assert.equal(app.messages[0].title, 'manualDispatchSucceeded');
});

test('dispatch rejection preserves the analysis form payload and releases submission lock', async () => {
  const app = workspaceHarness({ createLeakMonitorManualWorkOrder: async () => { throw new Error('backend rejected'); } });
  await app.workspace.submitManualAnalysis(app.payload);
  assert.equal(app.payload.reasonAnalysis, 'test');
  assert.equal(app.workspace.detail.value.manualError, 'backend rejected');
  assert.equal(app.workspace.detail.value.manualSubmitting, false);
  assert.equal(app.messages.length, 0);
});
