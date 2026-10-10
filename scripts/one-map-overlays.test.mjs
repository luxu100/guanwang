import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from '@vue/compiler-sfc';
import * as coordinates from '../src/pages/leak-monitor/coordinateTransform.ts';
import * as risk from '../src/pages/one-map/risk.ts';

function mountScript(path, props, locale = 'zh-CN') {
  let cleanup;
  const watchers = [];
  const frames = new Map();
  const objects = [];
  const nodes = [];
  const events = [];
  const ref = (value) => ({ value });
  const language = ref(locale);
  class LatLng { constructor(lat, lng) { this.lat = lat; this.lng = lng; } }
  class OverlayView {
    static preventMapHitsAndGesturesFrom() {}
    constructor() { objects.push(this); }
    setMap(map) { this.map = map; if (map) { this.onAdd?.(); this.draw?.(); } else this.onRemove?.(); }
    getPanes() { return { overlayMouseTarget: { appendChild() {} } }; }
    getProjection() { return { fromLatLngToDivPixel: (position) => { this.position = position; return { x: 100, y: 100 }; } }; }
  }
  class DOMOverlay {
    constructor({ map }) { this.map = map; objects.push(this); this.createDOM(); this.updateDOM(); }
    setMap(map) { this.map = map; if (!map) this.onDestroy?.(); }
  }
  class Polyline {
    constructor(options) { this.options = options; this.map = options.map; objects.push(this); }
    setOptions(options) { Object.assign(this.options, options); }
    addListener(event, callback) { this[event] = callback; }
    setMap(map) { this.map = map; }
  }
  class MultiPolyline {
    constructor(options) { this.map = options.map; this.options = options; objects.push(this); }
    setGeometries(geometries) { this.geometries = geometries; }
    setMap(map) { this.map = map; }
    on(event, callback) { this[event] = callback; }
  }
  const vue = {
    ref, shallowRef: ref, computed: (fn) => ({ get value() { return fn(); } }),
    onMounted() {}, onBeforeUnmount: (fn) => { cleanup = fn; },
    nextTick: (fn) => Promise.resolve().then(fn),
    watch: (source, callback, options) => { watchers.push(callback); if (options?.immediate) callback(); },
  };
  const context = vm.createContext({
    exports: {}, defineProps: () => props, defineEmits: () => (...args) => events.push(args), defineExpose() {},
    google: { maps: { LatLng, OverlayView, Polyline, event: { clearInstanceListeners() {} } } },
    window: { TMap: { LatLng, DOMOverlay, MultiPolyline, PolylineStyle: class { constructor(options) { Object.assign(this, options); } } } },
    document: {
      createElement: () => { const node = { style: {}, setAttribute(key, value) { this[key] = value; }, remove() { this.removed = true; } }; nodes.push(node); return node; },
      addEventListener() {}, removeEventListener() {},
    },
    requestAnimationFrame: (fn) => { const id = frames.size + 1; frames.set(id, fn); return id; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require: (id) => {
      if (id === 'vue') return vue;
      if (id.includes('coordinateTransform')) return coordinates;
      if (id === '../risk') return risk;
      if (id === '@/i18n') return { useI18n: () => ({ locale: language }) };
      if (id === '@/services/map/map') return { getMapProvider: (value) => value === 'en-US' ? 'google' : 'tencent' };
      if (id.endsWith('.vue')) return {};
      if (id.endsWith('.css')) return {};
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  const source = parse(readFileSync(new URL(path, import.meta.url), 'utf8')).descriptor.scriptSetup.content;
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInContext(output, context);
  return {
    context, objects, nodes, events, props, language,
    run: (code) => vm.runInContext(code, context),
    flush: () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); },
    changed: () => watchers.forEach((fn) => fn()),
    unmount: () => cleanup?.(),
  };
}

for (const provider of ['tencent', 'google']) {
  test(`${provider}: alarm overlays use MY coordinates, emit selection and clean up`, () => {
    const map = { projectToContainer: (position) => { map.position = position; return { x: 20, y: 30 }; } };
    const props = {
      provider, mapInstance: map,
      points: [{ deviceNumber: 'A', lng: 101.5, lat: 3.1, countryCode: 'MY', coordinateSystem: 'WGS84' }],
      alarms: [{ deviceNumber: 'A', level: 'CRITICAL', count: 2 }, { deviceNumber: 'B', longitude: 101, latitude: 3, countryCode: null }],
    };
    const app = mountScript('../src/pages/leak-monitor/components/MapAlarmLayer.vue', props);
    app.flush();
    assert.equal(app.objects.length, 1, 'unlocated alarm must not get a fabricated position');
    const position = provider === 'google' ? app.objects[0].position : map.position;
    assert.equal(position.lng, 101.5);
    assert.equal(position.lat, 3.1);
    assert.match(app.nodes[0].className, /critical/);
    app.nodes[0].onclick({ stopPropagation() {} });
    assert.deepEqual(app.events[0], ['select', 'A']);
    props.alarms = [];
    app.changed(); app.flush();
    assert.equal(app.objects[0].map, null);
    assert.equal(app.nodes[0].removed, true);
    app.unmount();
  });

  test(`${provider}: risk pipes preserve independent parts and clean up on unmount`, () => {
    const tube = { id: 1, deptId: 2, countryCode: 'MY', coordinateSystem: 'WGS84', riskScore: 80, riskLevel: 'HIGH', lineCoords: [[[101, 3], [102, 4]], [[103, 5], [104, 6]]] };
    const props = { tubes: [tube], points: [], alarms: [], rejectedCount: 0 };
    const app = mountScript('../src/pages/one-map/components/OneMapRiskMap.vue', props, provider === 'google' ? 'en-US' : 'zh-CN');
    app.run('mapInstance.value = {}; sync();');
    if (provider === 'google') {
      assert.equal(app.objects.length, 2);
      assert.equal(app.objects[0].options.path.length, 2);
      assert.equal(app.objects[1].options.path[0].lng, 103);
      assert.equal(app.objects[0].options.strokeColor, risk.RISK_COLORS.HIGH);
      app.run('sync();');
      assert.equal(app.objects.length, 2, 'refresh must reuse keyed polylines');
    } else {
      assert.equal(app.objects.length, 1);
      const geometries = app.objects[0].geometries;
      assert.equal(geometries.length, 2);
      assert.equal(geometries[0].paths.length, 2);
      assert.equal(geometries[1].paths[0].lng, 103);
      assert.equal(geometries[0].styleId, 'HIGH');
      app.run('sync();');
      assert.equal(app.objects.length, 1, 'refresh must reuse the Tencent layer');
    }
    app.unmount();
    assert.ok(app.objects.every((item) => item.map === null));
  });

  test(`${provider}: alarm selection focuses valid locations and rejects missing positions`, () => {
    const app = mountScript('../src/pages/one-map/components/OneMapRiskMap.vue', {
      tubes: [], points: [{ id: 1, deviceNumber: 'A', lat: 3, lng: 101, coordinateSystem: 'WGS84', countryCode: 'MY' }],
      alarms: [{ deviceNumber: 'A', latitude: 3.1, longitude: 101.5, countryCode: 'MY' }],
    }, provider === 'google' ? 'en-US' : 'zh-CN');
    app.run('mapInstance.value = {}; mapRef.value = { focusDevice(number) { exports.focused = number; } }; focusAlarm("A");');
    assert.equal(app.context.exports.focused, 'A');
    assert.equal(app.run('locatedPoints.value[0].lng'), 101.5);
    assert.equal(app.run('locatedPoints.value[0].lat'), 3.1);
    app.run('focusAlarm("MISSING");');
    assert.equal(app.context.exports.focused, 'A');
    assert.match(app.run('notice.value'), /MISSING/);
    app.unmount();
  });
}
