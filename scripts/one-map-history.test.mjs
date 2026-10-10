import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from '@vue/compiler-sfc';

function history(request, kind = 'alarms') {
  const calls = [];
  const context = vm.createContext({
    exports: {}, defineProps: () => ({ start: '2026-10-01', end: '2026-10-10', kind, revision: 1 }),
    defineEmits: () => () => {},
    require: (name) => name === 'vue' ? { ref: value => ({ value }), watch() {}, onBeforeUnmount() {} }
      : name === '@/i18n' ? { useI18n: () => ({ locale: { value: 'zh-CN' } }) }
      : name === '@/services/alarm/api' ? { getAlarmPage: async payload => { calls.push(payload); return request(payload); } } : {},
  });
  const source = parse(readFileSync(new URL('../src/pages/one-map/components/OneMapHistoryResults.vue', import.meta.url), 'utf8')).descriptor.scriptSetup.content;
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { calls, run: code => vm.runInContext(code, context) };
}
test('history queries the selected dates and requested page', async () => {
  const app = history(() => ({ code: 200, data: { records: [{ id: 1 }], total: 40 } }));
  await app.run('page.value = 2; load();');
  assert.equal(app.calls[0].startTime, '2026-10-01T00:00:00');
  assert.equal(app.calls[0].endTime, '2026-10-10T23:59:59');
  assert.equal(app.calls[0].pageNum, 2);
  assert.equal(app.run('total.value'), 40);
});
test('failed business response clears rows rather than showing fake success', async () => {
  const app = history(() => ({ code: 500, msg: 'Failed' }));
  await app.run('load();');
  assert.equal(app.run('rows.value.length'), 0);
  assert.equal(app.run('error.value'), 'Failed');
  assert.equal(app.run('loading.value'), false);
});
test('risk history never queries current pipe data as a historical snapshot', async () => {
  const app = history(() => { throw new Error('Unexpected request'); }, 'risk');
  await app.run('load();');
  assert.equal(app.calls.length, 0);
  assert.equal(app.run('rows.value.length'), 0);
});
