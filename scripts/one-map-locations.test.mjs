import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { normalizeActiveMapAlarms } from '../src/pages/leak-monitor/activeMapAlarms.ts';
const context = vm.createContext({ exports: {}, require: () => ({ normalizeActiveMapAlarms }) });
vm.runInContext(ts.transpileModule(readFileSync(new URL('../src/pages/one-map/locations.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { alarmLocations, loadPeriodAlarms } = context.exports;
test('alarm locations group by device, not a shared address; keep all devices', () => {
  const records = Array.from({ length: 12 }, (_, i) => ({ deviceNumber: `D${i}`, address: 'Same address', alarmLevel: 'WARNING' }));
  records.push({ deviceNumber: 'D0', address: 'Same address', alarmLevel: 'CRITICAL' });
  const rows = alarmLocations(records);
  assert.equal(rows.length, 12);
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), 13);
  assert.equal(rows[0].key, 'D0');
  assert.equal(rows[0].tone, 'red');
  assert.equal(rows[0].ratio, 100);
});
test('alarm locations retain valid coordinates and never fabricate missing positions', () => {
  const rows = alarmLocations([
    { deviceNumber: 'A', longitude: 101.5, latitude: 3.1, countryCode: 'MY' },
    { deviceNumber: 'B', longitude: '', latitude: null },
  ]);
  assert.equal(rows[0].longitude, 101.5);
  assert.equal(rows[0].latitude, 3.1);
  assert.equal(rows[1].longitude, null);
  assert.equal(rows[1].latitude, null);
});

test('period distribution reads all pages with the same date range and no active-only filter', async () => {
  const calls = [];
  const records = Array.from({ length: 205 }, (_, id) => ({ id, deviceNumber: id < 200 ? 'A' : 'B', status: 'RESOLVED' }));
  const result = await loadPeriodAlarms(async query => {
    calls.push(query);
    return { code: 200, data: { records: records.slice((query.pageNum - 1) * 200, query.pageNum * 200), total: records.length } };
  }, { start: '2026-10-01', end: '2026-10-07' });
  assert.equal(calls.length, 2);
  for (const query of calls) {
    assert.equal(query.startTime, '2026-10-01T00:00:00');
    assert.equal(query.endTime, '2026-10-07T23:59:59');
    assert.equal(query.status, undefined);
  }
  assert.equal(alarmLocations(result).find(row => row.key === 'B').count, 5);
});

test('distribution changes with selected dates', async () => {
  const request = async query => ({ code: 200, data: { records: Array.from({ length: query.startTime.startsWith('2026-09') ? 3 : 1 }, (_, id) => ({ id, deviceNumber: 'A' })), total: query.startTime.startsWith('2026-09') ? 3 : 1 } });
  const week = await loadPeriodAlarms(request, { start: '2026-10-01', end: '2026-10-07' });
  const month = await loadPeriodAlarms(request, { start: '2026-09-08', end: '2026-10-07' });
  assert.equal(alarmLocations(week)[0].count, 1);
  assert.equal(alarmLocations(month)[0].count, 3);
});

test('failed, partial and repeated pages never publish truncated distribution', async () => {
  await assert.rejects(loadPeriodAlarms(async () => ({ code: '200', data: {} }), { start: 'x', end: 'y' }));
  await assert.rejects(loadPeriodAlarms(async () => ({ code: 500, msg: 'Failed' }), { start: 'x', end: 'y' }), /Failed/);
  await assert.rejects(loadPeriodAlarms(async () => ({ code: 200, data: { records: [], total: 1 } }), { start: 'x', end: 'y' }), /Incomplete/);
  await assert.rejects(loadPeriodAlarms(async () => ({ code: 200, data: { records: [{ id: 1 }], total: 2 } }), { start: 'x', end: 'y' }), /repeated/);
  await assert.rejects(loadPeriodAlarms(async () => ({ code: 200, data: { records: [], total: 20001 } }), { start: 'x', end: 'y' }), /shorter/);
});
