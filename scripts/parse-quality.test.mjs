import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";
import * as adminData from "../src/utils/adminData.ts";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const source = parse(read("src/pages/data-receive/components/ParseRecordQuality.vue")).descriptor.scriptSetup.content;
const record = (extra = {}) => ({ id: 7, deviceNumber: "quality-test", protocolId: 12, parseStatus: "SUCCESS", ...extra });
const page = (records, total = records.length) => ({ code: 200, data: { records, total } });
const partial = JSON.stringify({ qualityStatus: "PARTIAL", fallbackFieldCount: 1, fallbackFields: ["pressure"], values: { pressure: { raw: "FFFF", value: null } } });

function harness(service, locale = "zh-CN") {
  const calls = [];
  const unmounts = [];
  const props = { record: {} };
  const context = vm.createContext({
    exports: {}, console,
    defineProps: () => props,
    require: (id) => {
      if (id === "vue") return {
        ref: (value) => ({ value }), computed: (get) => ({ get value() { return get(); } }),
        watch() {}, onBeforeUnmount: (fn) => unmounts.push(fn),
      };
      if (id === "@/i18n/localeText") return { useLocaleText: () => (zh, en) => locale === "en-US" ? en : zh };
      if (id === "@/utils/adminData") return adminData;
      if (id === "@/services/data-receive/parse") return { getProtocolParsedJsonPage: async (query) => {
        calls.push(JSON.parse(JSON.stringify(query)));
        return service(query);
      } };
      throw new Error(`Unexpected dependency ${id}`);
    },
  });
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return {
    calls,
    run: (expression) => vm.runInContext(expression, context),
    load: (value) => {
      props.record = value;
      context.input = value;
      return vm.runInContext("loadQuality(input)", context);
    },
    unmount: () => unmounts.forEach((fn) => fn()),
  };
}

test("12.3 actual localized and fallback parsing views mount field quality details", () => {
  for (const directory of ["components", "localized/components"]) {
    const view = read(`src/pages/data-receive/${directory}/DataReceiveView.vue`);
    assert.match(view, /import ParseRecordQuality from "@\/pages\/data-receive\/components\/ParseRecordQuality.vue"/);
    assert.match(view, /<ParseRecordQuality v-else-if="activeConfig.key === 'parseRecord' && selectedRecord" :record="selectedRecord"/);
    assert.match(view, /getDetail: \(id\) => getProtocolParseRecordDetail\(id\)/);
  }
  assert.match(read("src/components/app-shell/appShellModules.localized.ts"), /data-receive\/localized\/components\/DataReceiveView.vue/);
});

test("12.3 SUCCESS with inner PARTIAL exposes fallback fields and preserves raw values", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: partial }]));
  await app.load(record({ channel: "AEP_NB", afn: "01", taskType: "TASK_1" }));
  assert.equal(app.run("qualityText.value"), "部分解析成功");
  assert.equal(app.run("parsed.value.fallbackFieldCount"), 1);
  assert.equal(app.run("parsed.value.fallbackFields[0]"), "pressure");
  assert.equal(app.run("rawJson.value"), partial);
  assert.equal(app.run("parsed.value.values.pressure.raw"), "FFFF");
  assert.deepEqual(app.calls[0], { deviceNumber: "quality-test", protocolId: 12, pageNum: 1, pageSize: 10, channel: "AEP_NB", afn: "01", taskType: "TASK_1", parseStatus: "SUCCESS" });
});

test("12.3 field quality has an English summary", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: partial }]), "en-US");
  await app.load(record());
  assert.equal(app.run("qualityText.value"), "Partially parsed");
});

test("quality lookup uses the record's own second without timezone conversion", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: partial }]));
  await app.load(record({ parseTime: "2026-11-08T13:27:40.123456" }));
  assert.equal(app.calls[0].startTime, "2026-11-08T13:27:40");
  assert.equal(app.calls[0].endTime, "2026-11-08T13:27:40.999999999");
  assert.equal(app.calls[0].pageSize, 10);
});

test("12.3 field failure stays a failure even when partial values exist", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: partial }]));
  await app.load(record({ parseStatus: "FAILED" }));
  assert.equal(app.run("qualityText.value"), "解析失败");
});

test("12.3 outer VO quality cannot substitute for the complete JSON quality", async () => {
  const app = harness(() => page([{ id: 7, qualityStatus: "PARTIAL", parsedJson: '{"values":{"pressure":0}}' }]));
  await app.load(record({ qualityStatus: "PARTIAL" }));
  assert.equal(app.run("isPartial.value"), false);
  assert.equal(app.run("qualityText.value"), "未提供");
});

test("12.3 zero fallback count remains zero and fallback fields can indicate partial parsing", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: '{"fallbackFieldCount":0,"fallbackFields":["pressure"]}' }]));
  await app.load(record());
  assert.equal(app.run("display(parsed.value.fallbackFieldCount)"), "0");
  assert.equal(app.run("isPartial.value"), true);
});

test("12.3 failed records without a protocol keep their original error and make no JSON request", async () => {
  const app = harness(() => { throw new Error("must not query"); });
  const failed = record({ parseStatus: "FAILED", protocolId: null, errorMessage: "未匹配协议" });
  await app.load(failed);
  assert.equal(app.calls.length, 0);
  assert.equal(failed.errorMessage, "未匹配协议");
  assert.match(app.run("unavailable.value"), /协议关联/);
});

test("12.3 complete JSON lookup matches the selected ID across pages", async () => {
  const app = harness((query) => query.pageNum === 1
    ? page([{ id: 6, parsedJson: '{"qualityStatus":"COMPLETE"}' }], 11)
    : page([{ id: "7", parsedJson: partial }], 11));
  await app.load(record());
  assert.deepEqual(app.calls.map((query) => query.pageNum), [1, 2]);
  assert.equal(app.run("isPartial.value"), true);
});

test("12.3 a missing current record never borrows another record's JSON", async () => {
  const app = harness(() => page([{ id: 6, parsedJson: partial }]));
  await app.load(record());
  assert.equal(app.run("parsed.value"), null);
  assert.match(app.run("error.value"), /未找到当前记录/);
});

test("12.3 trace IDs are used only when the selected record has no ID", async () => {
  const app = harness(() => page([{ traceId: "another" }, { traceId: "trace-7", parsedJson: partial }]));
  await app.load(record({ id: null, traceId: "trace-7" }));
  assert.equal(app.run("isPartial.value"), true);
  await app.load(record({ id: null, traceId: null }));
  assert.equal(app.calls.length, 1);
  assert.match(app.run("unavailable.value"), /追踪 ID/);
});

test("12.3 malformed full JSON is an explicit error rather than healthy data", async () => {
  const app = harness(() => page([{ id: 7, parsedJson: "{invalid" }]));
  await app.load(record());
  assert.notEqual(app.run("error.value"), "");
  assert.equal(app.run("parsed.value"), null);
  assert.equal(app.run("loading.value"), false);
});

test("12.3 quality lookup failures remain visible and can be retried", async () => {
  let attempts = 0;
  const app = harness(() => ++attempts === 1 ? { code: 500, msg: "完整 JSON 查询失败" } : page([{ id: 7, parsedJson: partial }]));
  await app.load(record());
  assert.equal(app.run("error.value"), "完整 JSON 查询失败");
  await app.load(record());
  assert.equal(app.run("error.value"), "");
  assert.equal(app.run("isPartial.value"), true);
});

test("12.3 a late quality reply cannot overwrite the newly selected record", async () => {
  let resolve;
  const pending = new Promise((accept) => { resolve = accept; });
  const app = harness((query) => query.protocolId === 12 ? pending : page([{ id: 8, parsedJson: '{"qualityStatus":"COMPLETE"}' }]));
  const first = app.load(record());
  await app.load(record({ id: 8, protocolId: 13 }));
  resolve(page([{ id: 7, parsedJson: partial }]));
  await first;
  assert.equal(app.run("parsed.value.qualityStatus"), "COMPLETE");
});

test("12.3 leaving quality details discards the in-flight response", async () => {
  let resolve;
  const pending = new Promise((accept) => { resolve = accept; });
  const app = harness(() => pending);
  const loading = app.load(record());
  app.unmount();
  resolve(page([{ id: 7, parsedJson: partial }]));
  await loading;
  assert.equal(app.run("parsed.value"), null);
});
