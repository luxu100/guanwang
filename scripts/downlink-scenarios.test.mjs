import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";
import * as channels from "../src/utils/device-channel.ts";

// Frontend logic regressions for 20261105_frontend_change_guide.md section 12.3.
// Service responses are controlled here. Live platform receipts and device effects need integration acceptance.
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const cloud = (extra = {}) => ({ id: 1, deviceNumber: "test-1", aepProtocol: "tcp", nbNumber: "cloud-1", productId: 10, downlinkProtocolVersion: "NEW", enableState: 1, onlineStatus: 0, tcpOnlineStatus: 0, ...extra });
const direct = (extra = {}) => ({ id: 2, deviceNumber: "direct-1", aepProtocol: null, nbNumber: null, enableState: 1, tcpOnlineStatus: 1, ...extra });
const ok = (data) => ({ code: 200, data });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
};

function viewHarness(kind, services = {}, language = "zh-CN") {
  const filename = kind === "setting" ? "DeviceSettingDialog" : "CommandManageView";
  const source = parse(read(`src/pages/command/localized/components/${filename}.vue`)).descriptor.scriptSetup.content;
  const timers = new Map();
  const calls = [];
  const messages = [];
  const unmounts = [];
  const mounts = [];
  const listeners = new Map();
  let nextTimer = 0;
  let nextRequest = 0;
  const ref = (value) => ({ value });
  const api = new Proxy({}, { get: (_target, name) => async (...args) => {
    calls.push({ name, args: plain(args) });
    return services[name] ? services[name](...args) : ok({ records: [], total: 0 });
  } });
  const document = {
    visibilityState: "visible",
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => { if (listeners.get(name) === handler) listeners.delete(name); },
  };
  const context = vm.createContext({
    exports: {}, console, document,
    setTimeout: (fn) => { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++nextRequest).padStart(12, "0")}` },
    uni: {
      showToast: (message) => messages.push(message.title),
      getStorageSync: () => ({}),
      showModal: (options) => options.success({ confirm: true }),
    },
    defineEmits: () => () => {},
    require: (id) => {
      if (id === "vue") return { ref, reactive: (value) => value, computed: (get) => ({ get value() { return get(); } }), onMounted: (fn) => mounts.push(fn), onBeforeUnmount: (fn) => unmounts.push(fn) };
      if (id === "@/i18n/localeText") return {
        useLocaleText: () => (zh, en) => language === "en-US" ? en : zh,
        useLocalizedCount: () => (count) => String(count), useLocalizedTotal: () => (count) => String(count),
      };
      if (id === "@/utils/device-channel") return channels;
      if (id.startsWith("@/services/")) return api;
      return {};
    },
  });
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
  const run = (code) => vm.runInContext(code, context);
  return {
    run, calls, messages, timers, document,
    set: (expression, value) => { context.input = value; run(`${expression} = input`); },
    call: (name, ...args) => { context.args = args; return run(`${name}(...args)`); },
    hide: () => { document.visibilityState = "hidden"; listeners.get("visibilitychange")?.(); },
    mount: async () => { for (const fn of mounts) await fn(); await Promise.resolve(); },
    unmount: () => unmounts.forEach((fn) => fn()),
  };
}

function prepareSetting(app) {
  app.set("selectedDevices.value", [cloud()]);
  app.set("enabledParameters.value", ["signalLevel"]);
  app.set("parameterValues.signalLevel", 0);
}

test("12.3 routes load localized command and firmware pages", () => {
  assert.match(read("src/pages/command/commandManage.vue"), /@\/pages\/command\/localized\/components\/CommandManageView.vue/);
  assert.match(read("src/pages/command/commandConfiguration.vue"), /@\/pages\/command\/localized\/components\/CommandConfigurationView.vue/);
  assert.equal(viewHarness("manage", {}, "en-US").call("getStageText", "WAITING_PLATFORM_CALLBACK"), "Waiting for CTWing callback");
  assert.equal(viewHarness("setting", {}, "en-US").call("getOnlineText", cloud()), "Offline");
});

test("12.3 channel and online state follow protocol rather than commandSendway", () => {
  assert.equal(channels.getDeviceChannel(cloud({ commandSendway: 0 })), "AEP_TCP");
  assert.equal(channels.getDeviceChannel(cloud({ commandSendway: 1, aepProtocol: "LWM2M" })), "AEP_NB");
  assert.equal(channels.getDeviceOnline(cloud({ onlineStatus: 1, tcpOnlineStatus: 0 })), true);
  assert.equal(channels.getDeviceOnline(direct({ onlineStatus: 0 })), true);
  assert.equal(channels.getDeviceOnline(cloud({ onlineStatus: null })), null);
});

test("12.3 direct TCP needs no cloud identity and remains selectable when connected", () => {
  assert.equal(viewHarness("setting").call("isDeviceSelectable", direct()), true);
  assert.equal(viewHarness("manage").call("isDeviceUpgradeSelectable", direct()), true);
});

test("12.3 NB upgrade single and select-all use the same eligibility", () => {
  const app = viewHarness("manage");
  const device = cloud({ aepProtocol: "lwm2m", commandSendway: 1 });
  app.set("deviceCandidates.value", [device, cloud({ id: 3, deviceNumber: "invalid", nbNumber: null })]);
  app.call("toggleDevice", device);
  assert.equal(app.run("selectedDevices.value.length"), 1);
  app.call("toggleSelectableDevices");
  assert.equal(app.run("selectedDevices.value.length"), 0);
  app.call("toggleSelectableDevices");
  assert.equal(app.run("selectedDevices.value[0].deviceNumber"), device.deviceNumber);
});

for (const [field, label] of [["nbNumber", /ID|身份/], ["productId", /产品/], ["downlinkProtocolVersion", /版本/]]) {
  test(`12.3 missing ${field} gives a specific reason and never defaults to NEW`, () => {
    const device = cloud({ [field]: null });
    const app = viewHarness("manage");
    assert.equal(app.call("isDeviceUpgradeSelectable", device), false);
    assert.match(app.call("getDeviceAvailability", device), label);
    assert.equal(device[field], null);
    assert.equal(viewHarness("setting").call("isDeviceSelectable", device), false);
  });
}

test("12.3 cloud online blocks parameter setting but permits firmware precheck", () => {
  const device = cloud({ onlineStatus: 1, tcpOnlineStatus: 0 });
  assert.equal(viewHarness("setting").call("isDeviceSelectable", device), false);
  assert.equal(viewHarness("manage").call("isDeviceUpgradeSelectable", device), true);
});

test("12.3 offline cloud devices display the backend precheck reason and cloud stage", async () => {
  const app = viewHarness("manage", { checkFirmwareUpdatable: () => ok([{ deviceNumber: "test-1", updatable: false, reason: "平台存在未结束任务" }]) });
  app.set("upgradeDraft.devices", [cloud()]);
  await app.call("runUpdatableCheck");
  assert.equal(app.call("getCheckResult", "test-1").label, "平台存在未结束任务");
  assert.match(app.call("getStageText", "WAITING_PLATFORM_CALLBACK"), /平台/);
});

test("12.3 NEW and LEGACY share exactly eight parameters and reject gain", () => {
  const app = viewHarness("setting");
  app.set("selectedDevices.value", [cloud(), cloud({ downlinkProtocolVersion: "LEGACY", deviceNumber: "legacy" })]);
  assert.deepEqual(plain(app.run("effectiveParameterDefinitions.value.map(item => item.key).sort()")), ["audioRule", "leakThreshold", "reportInterval", "samplingPeriodTime", "samplingTime", "samplingWeekday", "signalLevel", "workMode"]);
  app.call("toggleParameter", "gainGroup");
  assert.equal(app.run("enabledParameters.value.length"), 0);
  assert.match(app.messages.at(-1), /旧协议/);
});

test("12.3 selected zero is sent and unchecked parameters are omitted", () => {
  const app = viewHarness("setting");
  prepareSetting(app);
  app.set("parameterValues.reportInterval", 60);
  assert.deepEqual(plain(app.call("buildParameters")), { signalLevel: 0 });
  assert.equal(app.call("validateForm"), "");
});

test("12.3 parameter retry reuses its ID and a changed payload gets a new ID", async () => {
  const app = viewHarness("setting", { applyDeviceParameters: () => { throw new Error("network timeout"); } });
  prepareSetting(app);
  await app.call("submitTasks");
  await app.call("submitTasks");
  app.set("parameterValues.signalLevel", 1);
  await app.call("submitTasks");
  const requests = app.calls.filter((call) => call.name === "applyDeviceParameters").map((call) => call.args[0]);
  assert.equal(requests[0].clientRequestId, requests[1].clientRequestId);
  assert.notEqual(requests[1].clientRequestId, requests[2].clientRequestId);
  assert.ok(requests.every((request) => /^[A-Za-z0-9._-]{1,48}$/.test(request.clientRequestId)));
});

test("12.3 changing devices or expiry also creates a new idempotency ID", async () => {
  const app = viewHarness("setting", { applyDeviceParameters: () => { throw new Error("network timeout"); } });
  prepareSetting(app);
  await app.call("submitTasks");
  app.set("selectedDevices.value", [cloud({ deviceNumber: "another-device" })]);
  await app.call("submitTasks");
  app.set("expiresAt.value", "2099-01-01T00:00:00");
  await app.call("submitTasks");
  const ids = app.calls.filter((call) => call.name === "applyDeviceParameters").map((call) => call.args[0].clientRequestId);
  assert.equal(new Set(ids).size, 3);
});

test("12.3 repeated parameter submit while pending sends one request", async () => {
  const pending = deferred();
  const app = viewHarness("setting", { applyDeviceParameters: () => pending.promise });
  prepareSetting(app);
  const first = app.call("submitTasks");
  const second = app.call("submitTasks");
  pending.resolve(ok({ batchId: "batch", tasks: [] }));
  await Promise.all([first, second]);
  assert.equal(app.calls.filter((call) => call.name === "applyDeviceParameters").length, 1);
});

test("12.3 result refresh preserves times and false cloud state when history omits them", async () => {
  const app = viewHarness("setting", {
    getDeviceSettingPage: () => ok({ records: [{ id: 1, commandExecuteStatus: 2 }] }),
    getDeviceSettingResult: () => ok({ settingId: 1, platformStatus: "CACHED", deviceConfirmed: false }),
  });
  app.set("resultBatchId.value", "batch");
  app.set("taskResults.value", [{ settingId: 1, sentAt: "2026-11-05T12:00:00", expiresAt: "2026-11-06T12:00:00", cloudOnline: false, transportChannel: "AEP_NB" }]);
  await app.call("refreshTaskResults");
  const task = app.run("taskResults.value[0]");
  assert.equal(task.sentAt, "2026-11-05T12:00:00");
  assert.equal(task.expiresAt, "2026-11-06T12:00:00");
  assert.equal(task.cloudOnline, false);
  assert.equal(task.transportChannel, "AEP_NB");
  assert.equal(task.platformStatus, "CACHED");
  assert.ok(app.calls.some((call) => call.name === "getDeviceSettingResult" && call.args[0] === 1));
});

test("12.3 executeStatus failure wins over PLATFORM_ACCEPTED", () => {
  const task = { executeStatus: 4, status: "PLATFORM_ACCEPTED", platformStatus: "ACCEPTED" };
  const dialog = viewHarness("setting");
  assert.match(dialog.call("getTaskStatusText", task), /失败/);
  assert.equal(dialog.call("getTaskStatusClass", task), "task-status--danger");
  const history = viewHarness("manage");
  const row = history.call("normalizeDeviceSetting", task);
  assert.match(history.call("getSettingStatusText", row.commandStatus), /失败/);
  assert.equal(row.platformStatus, "ACCEPTED");
});

test("12.3 platform success without device evidence is explicitly unconfirmed", () => {
  const task = { executeStatus: 6, confirmationSource: "PLATFORM", deviceConfirmed: false };
  assert.match(viewHarness("setting").call("getTaskStatusText", task), /尚无设备级确认/);
  assert.match(viewHarness("manage").call("getConfirmationText", task), /尚无设备级确认/);
});

test("12.3 successful historical upgrade keeps 72 of 72 and DONE despite old missing frames", () => {
  const app = viewHarness("manage");
  const task = app.call("normalizeUpgradeLog", { id: 27, executeStatus: 4, finishPercent: 100, upgradeStage: "DONE", frameCount: 72, receivedFrameCount: 72, repairRound: 1, frameStatus: "62,64,65,66,67," });
  assert.equal(task.frameSummary, "72/72");
  assert.equal(task.finishPercent, 100);
  assert.equal(task.upgradeStageText, "升级完成");
  assert.equal(task.repairRound, 1);
});

for (const progress of [80, 90]) {
  test(`12.3 upgrade at ${progress} percent stays pending`, () => {
    const app = viewHarness("manage");
    app.set("activeView.value", "UPGRADE");
    app.set("selectedUpgradeId.value", 1);
    app.set("selectedDetail.value", { id: 1, executeStatus: 1, finishPercent: progress, upgradeStage: "WAITING_DEVICE_REPORT" });
    app.call("scheduleUpgradePolling");
    assert.equal(app.timers.size, 1);
    assert.equal(app.call("getStatusText", 1), "升级中");
  });
}

test("12.3 status 6 stops polling and retains failure reason", () => {
  const app = viewHarness("manage");
  app.set("activeView.value", "UPGRADE");
  app.set("selectedUpgradeId.value", 1);
  app.set("selectedDetail.value", { id: 1, executeStatus: 6, failureReason: "设备无响应" });
  app.call("scheduleUpgradePolling");
  assert.equal(app.timers.size, 0);
  assert.equal(app.call("getStatusClass", 6), "status-tag--danger");
  assert.equal(app.run("selectedDetail.value.failureReason"), "设备无响应");
});

test("12.3 a command TIMEOUT does not terminate an active upgrade", () => {
  const app = viewHarness("manage");
  const command = app.call("normalizeCommandLog", { executeStatus: 4, platformStatus: "TIMEOUT" });
  assert.equal(command.platformStatus, "TIMEOUT");
  assert.equal(app.call("getCommandStatusClass", command.executeStatus), "status-tag--danger");
  assert.equal(app.run("upgradeStatusMap[1].terminal"), false);
});

test("12.3 cancelling stays active until status 5 arrives", async () => {
  const app = viewHarness("manage", { cancelFirmwareUpgrade: () => ok(true), getFirmwareUpgradeLogDetail: () => ok({ id: 1, executeStatus: 2 }) });
  app.set("activeView.value", "UPGRADE");
  app.set("selectedUpgradeId.value", 1);
  app.set("selectedDetail.value", { id: 1, deviceNumber: "test-1", executeStatus: 1 });
  await app.call("confirmCancelUpgrade");
  assert.ok(app.messages.includes("取消请求已提交"));
  assert.equal(app.timers.size, 1);
  assert.equal(app.call("getStatusText", 2), "取消中");
  app.set("selectedDetail.value", { id: 1, executeStatus: 5 });
  app.call("scheduleUpgradePolling");
  assert.equal(app.timers.size, 0);
});

test("12.3 switching tasks ignores the first reply without invalidating the newer request", async () => {
  const first = deferred();
  const second = deferred();
  const app = viewHarness("manage", { getFirmwareUpgradeLogDetail: (id) => id === 1 ? first.promise : second.promise });
  app.set("activeView.value", "UPGRADE");
  const loadingFirst = app.call("selectUpgradeRow", { id: 1 });
  const loadingSecond = app.call("selectUpgradeRow", { id: 2 });
  first.resolve(ok({ id: 1, executeStatus: 4 }));
  await loadingFirst;
  second.resolve(ok({ id: 2, executeStatus: 1 }));
  await loadingSecond;
  assert.equal(app.run("selectedDetail.value.id"), 2);
  assert.equal(app.timers.size, 1);
});

for (const [method, service, state] of [
  ["loadFrames", "getFirmwareUpgradeFrames", "frames"],
  ["loadEvents", "getFirmwareUpgradeEvents", "events"],
]) {
  test(`12.3 late ${state} replies cannot overwrite a new task`, async () => {
    const pending = deferred();
    const app = viewHarness("manage", { [service]: () => pending.promise });
    app.set("activeView.value", "UPGRADE");
    app.set("selectedUpgradeId.value", 1);
    const loading = app.call(method, false);
    await app.call("selectUpgradeRow", { id: 2 });
    pending.resolve(ok([{ id: "old-task-resource" }]));
    await loading;
    assert.deepEqual(plain(app.run(`${state}.value`)), []);
    assert.equal(app.run("subResourceLoading.value"), false);
  });
}

test("12.3 closing parameter results ignores a late refresh and stops polling", async () => {
  const pending = deferred();
  const app = viewHarness("setting", { getDeviceSettingPage: () => pending.promise });
  app.set("resultBatchId.value", "batch");
  app.set("step.value", 4);
  app.set("taskResults.value", [{ settingId: 1, executeStatus: 1 }]);
  app.call("scheduleTaskRefresh");
  const loading = app.call("refreshTaskResults");
  app.call("closeDialog");
  app.unmount();
  pending.resolve(ok({ records: [{ id: 1, commandExecuteStatus: 6 }] }));
  await loading;
  assert.equal(app.run("taskResults.value[0].executeStatus"), 1);
  assert.equal(app.timers.size, 0);
  assert.equal(app.calls.filter((call) => call.name === "getDeviceSettingResult").length, 0);
});

test("12.3 hiding parameter results stops the timer and discards an in-flight result", async () => {
  const pending = deferred();
  const app = viewHarness("setting", { getDeviceSettingResult: () => pending.promise });
  await app.mount();
  app.set("resultBatchId.value", "batch");
  app.set("step.value", 4);
  app.set("taskResults.value", [{ settingId: 1, executeStatus: 1 }]);
  app.call("scheduleTaskRefresh");
  const loading = app.call("refreshTaskResults");
  await Promise.resolve();
  await Promise.resolve();
  app.hide();
  pending.resolve(ok({ settingId: 1, executeStatus: 6 }));
  await loading;
  assert.equal(app.run("taskResults.value[0].executeStatus"), 1);
  assert.equal(app.timers.size, 0);
});

test("12.3 late upgrade replies cannot overwrite a different record view", async () => {
  const pending = deferred();
  const app = viewHarness("manage", { getFirmwareUpgradeLogDetail: () => pending.promise });
  app.set("activeView.value", "UPGRADE");
  app.set("selectedUpgradeId.value", 1);
  const loading = app.call("loadSelectedUpgradeDetail");
  await app.call("switchRecordView", "SETTING");
  pending.resolve(ok({ id: 1, executeStatus: 4 }));
  await loading;
  assert.equal(app.run("selectedDetail.value"), null);
});

test("12.3 hiding and leaving the page stop pending poll timers", async () => {
  const app = viewHarness("manage");
  await app.mount();
  app.set("activeView.value", "UPGRADE");
  app.set("selectedUpgradeId.value", 1);
  app.set("selectedDetail.value", { id: 1, executeStatus: 1 });
  app.call("scheduleUpgradePolling");
  assert.equal(app.timers.size, 1);
  app.hide();
  assert.equal(app.timers.size, 0);
  app.unmount();
  assert.equal(app.timers.size, 0);
});

test("12.3 parameter history uses supported filters and surfaces backend errors", async () => {
  const app = viewHarness("manage", { getDeviceSettingPage: () => ({ code: 500, msg: "历史查询失败" }) });
  app.set("settingFilters.keyword", "test-1");
  app.set("settingFilters.status", "FAILED");
  app.set("settingFilters.startDate", "2026-11-01");
  app.set("settingFilters.endDate", "2026-11-05");
  await app.call("loadSettingPage");
  const query = app.calls.find((call) => call.name === "getDeviceSettingPage").args[0];
  assert.equal(query.recordSource, "COMMAND");
  assert.equal(query.startTime, undefined);
  assert.equal(query.endTime, undefined);
  assert.equal(query.commandStatus, undefined);
  assert.ok(app.messages.includes("历史查询失败"));
  assert.equal(app.run("settingLoadError.value"), "历史查询失败");
  const source = read("src/pages/command/localized/components/CommandManageView.vue");
  assert.match(source, /v-if="activeView === 'SETTING' && settingLoadError"/);
  assert.match(source, /<CommandDataTable v-else/);
});

test("12.3 parameter history error clears after a successful retry", async () => {
  let attempts = 0;
  const app = viewHarness("manage", { getDeviceSettingPage: () => ++attempts === 1 ? { code: 500, msg: "参数历史接口异常" } : ok({ records: [], total: 0 }) });
  await app.call("loadSettingPage");
  assert.equal(app.run("settingLoadError.value"), "参数历史接口异常");
  await app.call("loadSettingPage");
  assert.equal(app.run("settingLoadError.value"), "");
});

test("12.3 a late history failure cannot replace the result of a newer retry", async () => {
  const pending = deferred();
  let attempts = 0;
  const app = viewHarness("manage", { getDeviceSettingPage: () => ++attempts === 1 ? pending.promise : ok({ records: [], total: 0 }) });
  const first = app.call("loadSettingPage");
  await app.call("loadSettingPage");
  pending.resolve({ code: 500, msg: "已过期的查询失败" });
  await first;
  assert.equal(app.run("settingLoadError.value"), "");
  assert.equal(app.messages.includes("已过期的查询失败"), false);
});

for (const kind of ["setting", "manage"]) {
  test(`12.3 ${kind} selector reaches device 201 and preserves earlier selections`, async () => {
    const app = viewHarness(kind, { getDevicePage: () => ok({ records: [cloud({ id: 201, deviceNumber: "test-201" })], total: 201 }) });
    if (kind === "setting") {
      app.call("toggleDevice", cloud());
      await app.call("changeDevicePage", 1);
      app.call("toggleDevice", app.run("devices.value[0]"));
    } else {
      app.call("toggleDevice", cloud());
      await app.call("changeDeviceCandidatePage", 1);
      app.call("toggleDevice", app.run("deviceCandidates.value[0]"));
    }
    assert.equal(app.run("selectedDevices.value.length"), 2);
    assert.equal(app.calls.find((call) => call.name === "getDevicePage").args[0].pageNum, 2);
  });
}

test("12.3 duplicate firmware start clicks send one request and never auto-retry", async () => {
  const pending = deferred();
  const app = viewHarness("manage", { startFirmwareUpgrade: () => pending.promise });
  app.set("firmwareCandidates.value", [{ id: 1 }]);
  app.set("upgradeDraft.firmwareId", 1);
  app.set("upgradeDraft.devices", [cloud()]);
  app.set("updatableResults.value", [{ deviceNumber: "test-1", updatable: true }]);
  const first = app.call("submitUpgrade");
  const second = app.call("submitUpgrade");
  pending.reject(new Error("network timeout"));
  await Promise.all([first, second]);
  await app.call("submitUpgrade");
  assert.equal(app.calls.filter((call) => call.name === "startFirmwareUpgrade").length, 1);
  assert.ok(app.calls.some((call) => call.name === "getFirmwareUpgradeLogPage"));
  assert.equal(app.run("canSubmitUpgrade.value"), false);
});
