import test from 'node:test';
import assert from 'node:assert/strict';
import { riskBand, riskColor, RISK_COLORS } from '../src/pages/one-map/risk.ts';
import { normalizeActiveMapAlarms } from '../src/pages/leak-monitor/activeMapAlarms.ts';

test('empty risk fields are unassessed and never synthesized from pipe attributes', () => {
  for (const score of [null, undefined, '', ' ', NaN, Infinity]) {
    const pipe = { riskScore: score, riskLevel: 'HIGH', material: 'MS', diameterMm: 150, constructionYear: 1990 };
    assert.equal(riskBand(pipe), 'UNASSESSED');
    assert.equal(riskColor(pipe), RISK_COLORS.UNASSESSED);
  }
  assert.equal(riskBand({ riskScore: 80, riskLevel: null }), 'UNASSESSED');
});

test('evaluated risk levels agree with the map legend, including a valid zero score', () => {
  for (const level of ['HIGH', 'MEDIUM', 'LOW']) {
    const pipe = { riskScore: 0, riskLevel: level.toLowerCase() };
    assert.equal(riskBand(pipe), level);
    assert.equal(riskColor(pipe), RISK_COLORS[level]);
  }
  assert.equal(riskBand({ riskScore: 99, riskLevel: 'unknown' }), 'UNASSESSED');
});

test('alarm responses require exact business success and the documented items array', () => {
  for (const code of [0, 401, 500, '200', undefined]) {
    assert.throws(() => normalizeActiveMapAlarms({ code, data: { items: [] } }));
  }
  assert.throws(() => normalizeActiveMapAlarms({ code: 200, data: {} }));
  assert.deepEqual(normalizeActiveMapAlarms({ code: 200, data: { items: [] } }), []);
});

test('multiple alarms per device produce one marker with the highest severity', () => {
  const alarms = normalizeActiveMapAlarms({ code: 200, data: { items: [
    { deviceNumber: 'A', alarmLevel: 'WARNING', longitude: 101.5, latitude: 3.1, countryCode: 'my' },
    { deviceNumber: 'A', alarmLevel: 'CRITICAL' },
    { deviceNumber: 'A', alarmLevel: 'INFO' },
    { deviceNumber: 'B', alarmLevel: 'INFO' },
    { deviceNumber: '' },
  ] } });
  assert.equal(alarms.length, 2);
  assert.deepEqual(alarms[0], { deviceNumber: 'A', level: 'CRITICAL', count: 3, longitude: 101.5, latitude: 3.1, countryCode: 'MY' });
});

test('missing or invalid alarm coordinates never become a false zero position', () => {
  for (const [longitude, latitude] of [[null, ''], [' ', undefined], [181, -91], ['NaN', Infinity]]) {
    const [alarm] = normalizeActiveMapAlarms({ code: 200, data: { items: [{ deviceNumber: 'A', longitude, latitude }] } });
    assert.equal(alarm.longitude, null);
    assert.equal(alarm.latitude, null);
    assert.equal(alarm.countryCode, null);
  }
});
