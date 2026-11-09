import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from '@vue/compiler-sfc';
import * as pipeGeometry from '../src/pages/leak-monitor/pipeGeometry.ts';
import * as coordinates from '../src/pages/leak-monitor/coordinateTransform.ts';
import * as adminData from '../src/utils/adminData.ts';
import * as deviceChannels from '../src/utils/device-channel.ts';

const ref = (value) => ({ value });
const vue = { ref, reactive: (value) => value, computed: (get) => ({ get value() { return get(); } }), watch() {}, onMounted() {}, onBeforeUnmount() {} };
function load(path, modules = {}, globals = {}) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8');
  if (path.endsWith('.vue')) source = parse(source).descriptor.scriptSetup.content;
  const context = vm.createContext({
    exports: {}, console, URL, Blob, setTimeout, clearTimeout,
    require: (id) => modules[id] || (id === 'vue' ? vue : {}), ...globals,
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

function draftLayerHarness(provider, countryCode = 'MY') {
  let cleanup;
  const labels = [];
  class Overlay {
    constructor(options) { this.options = options; this.map = options.map; }
    setOptions(options) { Object.assign(this.options, options); }
    setGeometries(geometries) { this.options.geometries = geometries; }
    setStyles(styles) { this.options.styles = styles; }
    setMap(map) { this.map = map; }
    setVisible(visible) { this.visible = visible; }
    on() {}
  }
  const i18n = { useLeakMonitorI18n: () => ({ language: ref('zh-CN'), t: (key) => key }) };
  const controller = load('../src/pages/leak-monitor/pipeCreation.ts', {
    './pipeGeometry': pipeGeometry, './i18n': i18n,
  }).context.exports.usePipeCreation(ref([]), { focusCoordinate() {}, onSaved() {} });
  controller.start('pipe');
  controller.draft.countryCode = countryCode;
  const props = {
    mapInstance: {}, formalTubes: [], formalFacilities: [],
    formalTubeRejected: [], formalFacilityRejected: [], creation: controller,
    facilityVisibility: { VALVE: true, HYDRANT: true, PUMP: true },
  };
  const context = {
    scale() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    fillText(text) { labels.push(text); },
  };
  const app = load(`../src/pages/leak-monitor/components/${provider === 'google' ? 'Google' : 'Tencent'}PipeDemoLayer.vue`, {
    vue: { ...vue, onBeforeUnmount(fn) { cleanup = fn; } },
    '../i18n': i18n,
    '../pipeCreation': pipeGeometry,
    '../coordinateTransform': coordinates,
    '../facilityHover': { useFacilityHover: () => ({ hover: ref(null), show() {}, hide() {} }) },
  }, {
    defineProps: () => props, withDefaults: (value) => value, defineEmits: () => () => {},
    window: { TMap: {
      LatLng: class { constructor(lat, lng) { Object.assign(this, { lat, lng }); } },
      MultiMarker: Overlay, MultiPolyline: Overlay,
      MarkerStyle: class { constructor(options) { Object.assign(this, options); } },
      PolylineStyle: class { constructor(options) { Object.assign(this, options); } },
    } },
    document: { createElement: () => ({ getContext: () => context, toDataURL: () => 'data:image/png;base64,test' }) },
    google: { maps: { Marker: Overlay, Polyline: Overlay, SymbolPath: { CIRCLE: 1 }, event: { clearInstanceListeners() {} } } },
  });
  app.run('syncLayers()');
  return {
    ...app, controller, props, labels,
    refresh: () => app.run(provider === 'google' ? 'renderDraftLayers()' : 'syncDraftLayers()'),
    markers: () => app.run(provider === 'google' ? 'draftPointMarkers' : 'draftPointLayer.options.geometries'),
    unmount: () => cleanup(),
  };
}

for (const provider of ['google', 'tencent']) {
  test(`${provider}: first pipe click shows a node, undo, clear and discard remove nodes`, () => {
    const app = draftLayerHarness(provider);
    assert.equal(app.markers().length, 0);
    app.controller.addMapPoint({ lng: 101.5, lat: 3.1 });
    app.refresh();
    assert.equal(app.markers().length, 1);
    const position = provider === 'google' ? app.markers()[0].options.position : app.markers()[0].position;
    assert.equal(position.lng, 101.5);
    assert.equal(position.lat, 3.1);
    const firstMarker = app.markers()[0];
    app.controller.addMapPoint({ lng: 101.6, lat: 3.2 });
    app.refresh();
    assert.equal(app.markers().length, 2);
    if (provider === 'google') {
      assert.equal(app.markers()[0], firstMarker);
      assert.equal(app.markers()[1].options.label.text, '2');
      assert.equal(app.markers()[0].options.clickable, false);
    } else {
      assert.deepEqual(app.labels, ['1', '2']);
    }
    app.controller.undoLastPoint();
    app.refresh();
    assert.equal(app.markers().length, 1);
    app.controller.clearPoints();
    app.refresh();
    assert.equal(app.markers().length, 0);
    app.controller.addMapPoint({ lng: 101.5, lat: 3.1 });
    app.refresh();
    assert.equal(app.markers().length, 1);
    app.controller.discard();
    app.refresh();
    assert.equal(app.markers().length, 0);
    app.unmount();
  });

  test(`${provider}: draft nodes keep country coordinates and detach when maps change or unmount`, () => {
    const app = draftLayerHarness(provider, 'CN');
    const coordinate = { lng: 116.3975, lat: 39.9087 };
    app.controller.addMapPoint(coordinate);
    app.refresh();
    const expected = provider === 'google' ? coordinate : coordinates.tencentDisplayCoordinate(coordinate, 'CN');
    const position = provider === 'google' ? app.markers()[0].options.position : app.markers()[0].position;
    assert.equal(position.lng, expected.lng);
    assert.equal(position.lat, expected.lat);
    const oldOverlay = app.run(provider === 'google' ? 'draftPointMarkers[0]' : 'draftPointLayer');
    app.props.mapInstance = {};
    app.run('syncLayers()');
    assert.equal(oldOverlay.map, null);
    assert.equal(app.markers().length, 1);
    const overlay = app.run(provider === 'google' ? 'draftPointMarkers[0]' : 'draftPointLayer');
    app.unmount();
    assert.equal(overlay.map, null);
  });
}

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

function deviceInfoHarness(base, extended) {
  const calls = [];
  const app = load('../src/services/leak-monitor/device-query.ts', {
    '@/services/device/info': { getDeviceDetail: async (id) => { calls.push(['base', id]); return base; } },
    '@/services/shared/crud': { getRequest: async (url) => { calls.push(['extended', url]); return extended; } },
    '@/utils/adminData': adminData,
    '@/i18n': { getLocale: () => 'zh-CN' },
  });
  return { ...app, calls };
}

test('monitor details combine device archive and extended fields without losing zero or known values', async () => {
  const app = deviceInfoHarness(
    { code: 0, data: { aepProtocol: 'tcp', nbNumber: 'cloud', downlinkProtocolVersion: 'LEGACY', tcpOnlineStatus: 0, hardwareVersion: 'archive' } },
    { code: 200, data: { hardwareVersion: null, batteryVoltage: 0, firmwareVersion: 'reported' } },
  );
  const info = await app.context.exports.fetchLeakMonitorDeviceInfo({ id: 7, raw: { hardwareVersion: 'stale', installAddress: 'site' } });
  assert.equal(app.calls.length, 2);
  assert.deepEqual(app.calls, [['base', 7], ['extended', '/api/device/7/detail']]);
  assert.equal(info.aepProtocol, 'tcp');
  assert.equal(info.downlinkProtocolVersion, 'LEGACY');
  assert.equal(info.hardwareVersion, 'archive');
  assert.equal(info.batteryVoltage, 0);
  assert.equal(info.installAddress, 'site');
});

test('device detail business failures are surfaced instead of becoming an apparently complete archive', async () => {
  const app = deviceInfoHarness({ code: 403, msg: 'archive denied' }, { code: 200, data: {} });
  await assert.rejects(app.context.exports.fetchLeakMonitorDeviceInfo({ id: 7, raw: {} }), error => error.msg === 'archive denied');
});

test('monitor detail online status follows its channel and unknown values remain unknown', () => {
  const props = { detail: { info: { aepProtocol: 'tcp', nbNumber: 'cloud', onlineStatus: 1, tcpOnlineStatus: 0 }, trend: [], dailyAudio: [], maintenance: [] } };
  const app = load('../src/pages/leak-monitor/components/DeviceDetailDialog.vue', {
    '@/i18n': { useI18n: () => ({ locale: ref('zh-CN') }) },
    '../i18n': { useLeakMonitorI18n: () => ({ language: ref('zh-CN'), t: key => key }) },
    '@/utils/device-channel': deviceChannels,
  }, { defineProps: () => props, withDefaults: value => value, defineEmits: () => () => {} });
  assert.equal(app.run("detailFields.value.find(item => item.label === 'deviceStatus').value"), 'online');
  assert.equal(app.run("detailFields.value.find(item => item.label === 'tcpOnline').value"), 'offline');
  props.detail.info = { aepProtocol: null, nbNumber: null, onlineStatus: 1, tcpOnlineStatus: 0 };
  assert.equal(app.run("detailFields.value.find(item => item.label === 'deviceStatus').value"), 'offline');
  assert.equal(app.run("statusLabel(null, 'online', 'offline')"), '-');
});

function focusHarness(nextTick = async () => {}) {
  const focusCalls = [];
  const toasts = [];
  const workspace = {
    selectedDevice: ref({ id: 1, deviceNumber: 'A' }), detailVisible: ref(true), sidebarCollapsed: ref(false),
    mapPoints: ref([{ id: 2, deviceNumber: 'B', lat: 30, lng: 120 }]),
    formalTubes: ref([]), openDevice: async () => {},
  };
  const app = load('../src/pages/leak-monitor/components/LocaleLeakMap.vue', {
    vue: { ...vue, shallowRef: ref, provide() {}, nextTick },
    '@/i18n': { useI18n: () => ({ locale: ref('zh-CN') }) },
    '../i18n': { useLeakMonitorI18n: () => ({ t: key => key }) },
    '../composables/useActiveMapAlarms': { useActiveMapAlarms: () => ({ alarms: ref([]), error: ref('') }) },
    '../composables/useDesktopMapEditor': { useDesktopMapEditor: () => ref(true) },
    '../composables/useLeakMonitorWorkspace': { useLeakMonitorWorkspace: () => workspace },
    '../pipeCreation': { usePipeCreation: () => ({ draft: {}, hasUnsavedChanges: ref(false) }) },
    '@/utils/appShellNavigation': { registerAppShellNavigationGuard: () => () => {} },
  }, {
    defineProps: () => ({ localized: true }), withDefaults: value => value,
    window: { requestAnimationFrame: fn => fn() }, uni: { showToast: message => toasts.push(message) },
    testMap: { focusDevice: number => focusCalls.push(number), resize() {} },
  });
  app.run('mapRef.value = testMap');
  return { ...app, workspace, focusCalls, toasts };
}

test('related map focus can return to the same selected device and prior panel layout', async () => {
  const app = focusHarness();
  await app.run("focusRelatedDevice('B')");
  assert.equal(app.run('mapFocusDeviceNumber.value'), 'B');
  assert.deepEqual(app.focusCalls, ['B']);
  assert.equal(app.workspace.selectedDevice.value.deviceNumber, 'A');
  app.run('returnFromMapFocus()');
  assert.equal(app.run('mapFocusDeviceNumber.value'), '');
  assert.equal(app.workspace.sidebarCollapsed.value, false);
  const source = readFileSync(new URL('../src/pages/leak-monitor/components/LocaleLeakMap.vue', import.meta.url), 'utf8');
  assert.match(source, /v-show="!mapFocusDeviceNumber"/);
  assert.match(source, /:collapsed="!!mapFocusDeviceNumber \|\| sidebarCollapsed"/);
});

test('missing related coordinates preserve the current panels and provide feedback', async () => {
  const app = focusHarness();
  await app.run("focusRelatedDevice('missing')");
  assert.equal(app.run('mapFocusDeviceNumber.value'), '');
  assert.equal(app.focusCalls.length, 0);
  assert.equal(app.toasts[0].title, 'noRelatedDeviceCoordinate');
});

test('returning before map layout completes cancels a stale related focus', async () => {
  let resolve;
  const nextFrame = new Promise(accept => { resolve = accept; });
  const app = focusHarness(() => nextFrame);
  const focus = app.run("focusRelatedDevice('B')");
  app.run('returnFromMapFocus()');
  resolve();
  await focus;
  assert.equal(app.focusCalls.length, 0);
});
