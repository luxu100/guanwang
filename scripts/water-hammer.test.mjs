import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { baselineWaveform, generateMockSimulation, MOCK_DEVICES, validateOperations } from '../src/pages/water-hammer/mock.ts';

const device = MOCK_DEVICES[0];
const operation = (changes = {}) => ({ id: 'test', valveId: 'MV-001', start: 10, duration: 0.8, targetOpening: 0, ...changes });
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('normal mock waveform is deterministic, finite and stable for all devices', () => {
  for (const item of MOCK_DEVICES) {
    const points = baselineWaveform(item);
    assert.equal(points.length, 601);
    assert.equal(points[0][0], 0);
    assert.equal(points.at(-1)[0], 60);
    assert.deepEqual(points, baselineWaveform(item));
    assert.ok(points.every(([time, pressure]) => Number.isFinite(time) && Number.isFinite(pressure) && Math.abs(pressure - item.pressure) <= 0.0031));
  }
});

test('rapid closure generates a larger illustrative disturbance than slow closure', () => {
  const fast = generateMockSimulation(device, [operation()]);
  const slow = generateMockSimulation(device, [operation({ duration: 10 })]);
  assert.ok(fast.maxDeviation > slow.maxDeviation);
  assert.deepEqual(fast.waveform.slice(0, 100), baselineWaveform(device).slice(0, 100));
  assert.ok(fast.waveform.every((point) => Number.isFinite(point[1])));
  assert.equal(fast.maximum, Math.max(...fast.waveform.map((point) => point[1])));
  assert.equal(fast.minimum, Math.min(...fast.waveform.map((point) => point[1])));
});

test('opening starts with a negative disturbance and operation sequences retain valve state', () => {
  const opened = generateMockSimulation(device, [operation({ valveId: 'MV-003', targetOpening: 100 })]);
  assert.ok(opened.waveform[105][1] < baselineWaveform(device)[105][1]);
  const sequence = generateMockSimulation(device, [operation({ id: 'open', start: 30, duration: 3, targetOpening: 100 }), operation()]);
  assert.deepEqual(sequence.operations.map((item) => [item.start, item.initialOpening, item.targetOpening]), [[10, 100, 0], [30, 0, 100]]);
});

test('invalid values, ranges, no-op and same-valve overlaps are rejected', () => {
  assert.equal(validateOperations([]), 'required');
  assert.equal(validateOperations(Array(7).fill(operation())), 'required');
  assert.equal(validateOperations([operation({ valveId: 'missing' })]), 'valve');
  for (const value of ['', NaN, Infinity, null]) assert.equal(validateOperations([operation({ start: value })]), 'number');
  for (const changes of [{ start: 0 }, { duration: 0.1 }, { duration: 31 }, { start: 54, duration: 2 }, { targetOpening: -1 }, { targetOpening: 101 }]) {
    assert.equal(validateOperations([operation(changes)]), 'range');
  }
  assert.equal(validateOperations([operation({ targetOpening: 100 })]), 'unchanged');
  assert.equal(validateOperations([operation(), operation({ id: 'second', start: 10.5, targetOpening: 100 })]), 'overlap');
  assert.equal(validateOperations([operation(), operation({ id: 'second', start: 10.8, targetOpening: 100 })]), null);
  assert.equal(validateOperations([operation(), operation({ valveId: 'MV-002' })]), null);
  assert.throws(() => generateMockSimulation(device, []), /required/);
});

test('page, first-level menu, content, translations and permission fixtures are registered', () => {
  const shell = read('src/components/AppShell.vue');
  assert.match(shell, /permissionCode: "page:water-hammer"/);
  assert.match(shell, /component: WaterHammerView/);
  assert.ok(JSON.parse(read('src/pages.json')).pages.some((page) => page.path === 'pages/water-hammer/water-hammer'));
  for (const locale of ['zh-CN', 'en-US']) assert.ok(JSON.parse(read(`src/components/locales/${locale}.json`)).appShellMenu.waterHammer);
  for (const path of ['src/pages/system/components/SystemManagementView.vue', 'src/pages/system/localized/components/SystemManagementView.vue']) assert.match(read(path), /page:water-hammer/);
});

test('simulation is isolated from backend and real valve controls', () => {
  for (const path of ['src/pages/water-hammer/mock.ts', 'src/pages/water-hammer/components/WaterHammerView.vue']) {
    assert.doesNotMatch(read(path), /fetch\(|uni\.request|axios|@\/services|\/api\//);
  }
  assert.match(read('src/pages/water-hammer/components/WaterHammerView.vue'), /不发送阀门指令/);
});
