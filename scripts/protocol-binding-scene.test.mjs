import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, require: path => imports[path] || {},
  });
  return exports;
}
const rules = load('src/services/device/protocolBinding.js');
const valid = { deviceId: 329, protocolId: 50, scene: 'APP_REALTIME_SINGLE', priority: 0, enabled: true };

test('scene is explicit, ALL is query-only and missing scene never defaults to CLOUD', () => {
  for (const scene of [undefined, null, '', 'ALL', 'cloud']) assert.throws(() => rules.buildBindingPayload({ ...valid, scene }, true));
  assert.equal(rules.bindingSceneOptions(false).length, 2);
  assert.equal(rules.bindingSceneOptions(false, true)[0].value, 'ALL');
});
test('create uses environment IDs, fixed BLE rules and only writable business fields', () => {
  const payload = rules.buildBindingPayload({ ...valid, deviceId: '329', protocolId: '50', afn: '03', taskType: 'TASK_3', contentPrefix: 'test', id: 958, deviceNumber: '2603071206', expectedPayloadBytes: 999, createdAt: 'test' }, true);
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), { ...valid, ...rules.REALTIME_BINDING_RULES });
  for (const key of ['id', 'createdAt', 'deviceNumber', 'device_number', 'expectedPayloadBytes']) assert.equal(payload[key], undefined);
  for (const id of [0, -1, 'x', 1.2, '']) assert.throws(() => rules.buildBindingPayload({ ...valid, deviceId: id }, true));
});
test('CLOUD wildcard strings are preserved and null update fields are omitted', () => {
  const payload = rules.buildBindingPayload({ scene: 'CLOUD', afn: '', taskType: '', contentPrefix: '', deviceId: null, priority: null, enabled: false });
  assert.equal(payload.afn, '');
  assert.equal(payload.taskType, '');
  assert.equal(payload.contentPrefix, '');
  assert.equal(payload.deviceId, undefined);
  assert.equal(payload.priority, undefined);
  assert.equal(payload.enabled, false);
});
test('strict response check rejects business failures and false update results', () => {
  for (const code of [0, undefined, '200', 400, 409, 500]) assert.throws(() => rules.assertProtocolResponse({ code, msg: 'backend rejection' }), /backend rejection/);
  assert.throws(() => rules.assertProtocolResponse({ code: 200, data: false }, true));
  assert.equal(rules.assertProtocolResponse({ code: 200, data: true }, true).data, true);
});
test('relation services include scene on enable/disable, use IDs and propagate backend errors', async () => {
  const calls = [];
  let result = { code: 200, data: true };
  const api = load('src/services/data-receive/access.js', {
    '@/services/device/protocolBinding': rules,
    '@/services/shared/crud': { createCrudService: path => ({
      create: async data => { calls.push({ path, data }); return result; },
      update: async (id, data) => { calls.push({ path, id, data }); return result; },
      getPage: async data => { calls.push({ path, data }); return result; },
    }) },
  });
  await api.createDeviceProtocolRelation(valid);
  await api.updateDeviceProtocolRelation(958, { scene: 'APP_REALTIME_SINGLE', enabled: false });
  await api.updateDeviceProtocolRelation(959, { scene: 'CLOUD', enabled: true });
  assert.equal(calls[0].data.deviceId, 329);
  assert.equal(calls[1].data.scene, 'APP_REALTIME_SINGLE');
  assert.equal(calls[1].data.enabled, false);
  assert.equal(calls[2].data.scene, 'CLOUD');
  result = { code: 409, msg: 'duplicate binding' };
  await assert.rejects(api.createDeviceProtocolRelation(valid), /duplicate binding/);
  await assert.rejects(api.getDeviceProtocolRelationPage({ scene: 'ALL' }), /duplicate binding/);
});
test('batch-save inserts new fields only and layout failures stop updates', async () => {
  let writes = 0;
  const api = load('src/services/data-receive/parse.js', {
    '@/services/device/protocolBinding': rules,
    '@/services/shared/crud': {
      createCrudService: () => ({ update: async () => ({ code: 400, msg: 'layout overlap' }) }),
      postRequest: async () => { writes++; return { code: 200, data: true }; },
    },
  });
  await assert.rejects(api.batchSaveProtocolFields([{ id: 1 }]), /新增字段/);
  assert.equal(writes, 0);
  await api.batchSaveProtocolFields([{ protocolId: 50, fieldName: 'value' }]);
  assert.equal(writes, 1);
  await assert.rejects(api.updateProtocolField(1, {}), /layout overlap/);
});
test('both data-receive views expose required scene, filter, lengths and preserve complete field updates', () => {
  for (const file of ['src/pages/data-receive/components/DataReceiveView.vue', 'src/pages/data-receive/localized/components/DataReceiveView.vue']) {
    const source = read(file);
    const binding = source.slice(source.indexOf('  relation: {'), source.indexOf('  field: {'));
    assert.match(binding, /key: "scene"[\s\S]*required: true/);
    assert.match(binding, /key: "expectedPayloadBytes"/);
    assert.doesNotMatch(binding.slice(binding.indexOf('formFields:')), /key: "expectedPayloadBytes"/);
    assert.match(source, /getRowKey[\s\S]*getId\(item\)/);
    assert.match(source, /Object.assign\(formModel, formModel.scene/);
    assert.doesNotMatch(source, /changedKeys.length === 1 && changedKeys\[0\] === "sortOrder"/);
    assert.match(source, /if \(config.key === "relation"\) assertProtocolResponse\(response, Boolean\(id\)\)/);
  }
});
test('device panel independently filters scenes and waits for successful save before closing', () => {
  const page = read('src/pages/device/protocol/components/DeviceProtocolTableView.vue');
  assert.match(page, /id-key="id"/);
  assert.match(page, /props.deviceData.id, sceneFilter.value/);
  assert.match(page, /:submit-handler="handleSubmit"/);
  const dialog = read('src/pages/device/components/x/dialog/XDynamicDialog.vue');
  assert.match(dialog, /await props.submitHandler\(\{ ...formData.value \}\);\s*visible.value = false/);
  assert.match(dialog, /validationErrors.submit = error/);
});
