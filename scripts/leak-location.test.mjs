import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const serviceSource = read('src/services/leak-monitor/device-query.ts');
const output = ts.transpileModule(serviceSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function service(response) {
  const calls = [];
  const exports = {};
  vm.runInNewContext(output, {
    exports, uni: { getStorageSync: () => ({ region: 'overseas' }) },
    require: path => {
      if (path.endsWith('/crud')) return {
        postRequest: async (url, data) => { calls.push({ url, data }); return response; },
        getRequest: async (url, data) => { calls.push({ url, data }); return response; },
      };
      if (path.endsWith('/coordinateTransform')) return { normalizeCoordinateSystem: () => 'WGS84' };
      if (path === '@/i18n') return { getLocale: () => 'en-US' };
      return {};
    },
  });
  return { api: exports, calls };
}

test('device selection searches all visible devices without nearby or coordinate restrictions', async () => {
  const { api, calls } = service({ code: 200, data: { devices: [{ deviceNumber: 'A' }, { deviceNumber: 'B' }], total: 92 } });
  const result = await api.fetchLeakLocationDevices(' A ', 2);
  assert.equal(result.total, 92);
  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].lng, undefined);
  assert.equal(calls[0].url, '/api/device-query/sidebar');
  assert.equal(calls[0].data.deviceNumber, 'A');
  assert.equal(calls[0].data.pageNum, 2);
  assert.equal(calls[0].data.pageSize, 50);
  assert.equal(calls[0].data.radiusKm, undefined);
});

test('device, audio and analysis APIs reject non-200 business codes', async () => {
  for (const code of [0, '200', 500, undefined]) {
    const { api } = service({ code, msg: 'rejected', data: {} });
    await assert.rejects(api.fetchLeakLocationDevices(''), /rejected/);
    await assert.rejects(api.fetchLeakMonitorDailyLatestAudioOption('A', '2026-10-10'), /rejected/);
    await assert.rejects(api.fetchLeakLocationAnalysis({}), /rejected/);
  }
});

test('audio choices keep real positive audio IDs and bind the chosen device and date', async () => {
  const { api, calls } = service({ code: 200, data: [{ audioId: 51 }, { audioId: 0 }, { audioId: null }, { audioId: 1.5 }] });
  const choices = await api.fetchLeakMonitorDailyLatestAudioOption('A/B', '2026-10-01');
  assert.equal(choices.length, 1);
  assert.equal(choices[0].audioId, 51);
  assert.equal(choices[0].deviceNumber, 'A/B');
  assert.equal(calls[0].url, '/api/data-query/audio/daily-latest/A%2FB');
  assert.equal(calls[0].data.startDate, '2026-10-01');
  assert.equal(calls[0].data.endDate, '2026-10-01');
});

test('analysis passes selected audio IDs and all required parameters to the real endpoint', async () => {
  const { api, calls } = service({ code: 200, data: { leakDistanceA: 30, amplitudeA: 5, amplitudeB: 6, totalAlpha: .02, positionFlag: 'BETWEEN_AB' } });
  const payload = { audioId1: 51, audioId2: 52, distanceAB: 100, pipeMaterial: 'STEEL', diameterMm: 300, wallThicknessMm: 10, soilType: 'CLAY', buriedDepthM: 1 };
  const result = await api.fetchLeakLocationAnalysis(payload);
  assert.equal(calls[0].url, '/api/leak-locate/analyze');
  assert.deepEqual(calls[0].data, payload);
  assert.equal(result.leakDistanceA, 30);
  await assert.rejects(service({ code: 200, data: {} }).api.fetchLeakLocationAnalysis(payload));
});

test('page is registered in routes, shell and both permission fixtures', () => {
  const path = '/pages/leak-burst/leak-location/leak-location';
  const shell = read('src/components/AppShell.vue');
  assert.ok(shell.includes(`labelKey: "leakLocation", path: "${path}"`));
  assert.ok(shell.includes(`"${path}": { component: LeakLocationView }`));
  assert.ok(JSON.parse(read('src/pages.json')).pages.some(page => page.path === path.slice(1)));
  for (const file of ['src/pages/system/components/SystemManagementView.vue', 'src/pages/system/localized/components/SystemManagementView.vue']) {
    assert.ok(read(file).includes('permissionCode: "page:leak-burst:leak-location"'));
  }
  for (const locale of ['zh-CN', 'en-US']) assert.ok(JSON.parse(read(`src/components/locales/${locale}.json`)).appShellMenu.leakLocation);
});

test('pair selection is independent and duplicate selection is blocked', () => {
  const page = read('src/pages/leak-burst/components/LeakLocationView.vue');
  const picker = read('src/pages/leak-burst/components/LeakLocationDeviceSelect.vue');
  assert.match(page, /v-model="primaryDevice" site="A"/);
  assert.match(page, /v-model="relatedDevice" site="B"/);
  assert.match(page, /primaryDevice.value.deviceNumber !== relatedDevice.value.deviceNumber/);
  assert.match(picker, /:disabled="device.deviceNumber === excludedNumber"/);
  assert.match(picker, /if \(value && value === props.excludedNumber\) return/);
});

test('shared analysis invalidates stale results when pair or parameters change and initializes on mount', () => {
  const dialog = read('src/pages/leak-monitor/components/CorrelationAnalysisDialog.vue');
  assert.match(dialog, /\{ immediate: true \}/);
  assert.match(dialog, /requestId \+= 1;[\s\S]*?result.value = null;[\s\S]*?if \(!visible \|\| !props.primaryDevice \|\| !props.relatedDevice\) return/);
  assert.match(dialog, /watch\(\(\) => \[form.distanceAB/);
  assert.match(dialog, /primaryAudio.audioId === relatedAudio.audioId/);
  assert.match(dialog, /if \(currentRequest === analysisRequestId\)/);
  assert.match(dialog, /currentRequest === requestId && siteRequest === siteRequestIds\[key\]/);
});
