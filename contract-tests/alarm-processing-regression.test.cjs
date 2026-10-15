const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Exercise the actual view functions in isolation; no requests reach a backend.
function viewFunction(variant, name, environment) {
  const file = path.join(__dirname, '../src/pages/alarm', variant, 'AlarmProcessingView.vue');
  const script = fs.readFileSync(file, 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
  const ast = ts.createSourceFile('view.ts', script, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, `Function ${name} exists`);
  const compiled = ts.transpileModule(declaration.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function('environment', `with (environment) { ${compiled}; return ${name}; }`)(environment);
}

for (const variant of ['components', 'localized/components']) {
  test(`${variant}: real-map filters immediately reload`, () => {
    let requests = 0;
    const env = { mapFilters: {}, activeMapSelect: { value: null }, loadAlarmMap: () => requests++ };
    viewFunction(variant, 'selectMapStatus', env)(2);
    viewFunction(variant, 'selectMapLevel', env)(1);
    assert.equal(requests, 2);
    assert.deepEqual(env.mapFilters, { statusIndex: 2, levelIndex: 1 });
  });

  test(`${variant}: coordinates allow integers and reject out-of-range values`, () => {
    const valid = viewFunction(variant, 'isValidCoord', {});
    assert.equal(valid(120, 180), true);
    assert.equal(valid(30, 90), true);
    assert.equal(valid(180, 180), true);
    assert.equal(valid(-90, 90), true);
    for (const value of [91.5, -90.1, NaN, Infinity, null]) assert.equal(valid(value, 90), false);
    assert.equal(valid(999.5, 180), false);
  });

  test(`${variant}: failed trend does not block overview statistics`, async () => {
    const env = {
      panelsDisposed: false, overviewLoading: false, overviewRequestId: 0,
      overviewStatsLoading: { value: false }, overviewTrendLoading: { value: false },
      overviewStatsError: { value: false }, overviewTrendError: { value: false },
      overviewStats: { value: null }, overviewHasData: { value: false },
      fmtDate: () => '2026-10-15',
      getAlarmTrend: async () => { throw Error('trend unavailable'); },
      getAlarmOverview: async () => ({ code: 200, data: { activeTotal: 11 } }),
    };
    await viewFunction(variant, 'loadOverview', env)();
    assert.equal(env.overviewStats.value.activeTotal, 11);
    assert.equal(env.overviewStatsError.value, false);
    assert.equal(env.overviewTrendError.value, true);
    assert.equal(env.overviewStatsLoading.value, false);
    assert.equal(env.overviewTrendLoading.value, false);
  });

  test(`${variant}: latest filter wins when old map response arrives last`, async () => {
    const pending = [];
    const env = {
      panelsDisposed: false, mapLoading: { value: false }, mapError: { value: false },
      mapPendingQuery: '', mapLoadedQuery: '', mapRequestId: 0,
      query: '["ACTIVE",null]', currentMapQuery: () => env.query,
      getAlarmMap: body => new Promise(resolve => pending.push({ body, resolve })),
      mapPointCount: { value: 0 }, mapItems: { value: [] }, mapGroups: { value: [] },
      isValidCoord: viewFunction(variant, 'isValidCoord', {}), groupMapItems: items => items,
      mapProvider: { value: 'chart' }, mapChart: {}, renderMapChart: () => {}, refreshMapDialogMarkers: () => {},
    };
    const load = viewFunction(variant, 'loadAlarmMap', env);
    const first = load();
    env.query = '["CONFIRMED",null]';
    const second = load();
    assert.equal(pending.length, 2);
    const point = id => ({ alarmRecordId: id, longitude: 120, latitude: 30 });
    pending[1].resolve({ code: 200, data: { items: [point(2)] } });
    await second;
    pending[0].resolve({ code: 200, data: { items: [point(1)] } });
    await first;
    assert.equal(env.mapItems.value[0].alarmRecordId, 2);
    assert.equal(env.mapLoadedQuery, '["CONFIRMED",null]');
    assert.equal(env.mapLoading.value, false);
  });

  test(`${variant}: stale failed map request cannot mark current result failed`, async () => {
    const pending = [];
    const env = {
      panelsDisposed: false, mapLoading: { value: false }, mapError: { value: false },
      mapPendingQuery: '', mapLoadedQuery: '', mapRequestId: 0,
      query: '["ACTIVE",null]', currentMapQuery: () => env.query,
      getAlarmMap: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
      mapPointCount: { value: 0 }, mapItems: { value: [] }, mapGroups: { value: [] },
      isValidCoord: () => true, groupMapItems: items => items,
      mapProvider: { value: 'chart' }, mapChart: {}, renderMapChart: () => {}, refreshMapDialogMarkers: () => {},
    };
    const load = viewFunction(variant, 'loadAlarmMap', env);
    const first = load();
    env.query = '[null,null]';
    const second = load();
    pending[1].resolve({ code: 200, data: { items: [] } });
    await second;
    pending[0].reject(Error('old failure'));
    await first;
    assert.equal(env.mapError.value, false);
  });
}
