import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function compile(source) {
  return new vm.Script(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText);
}

const crudScript = compile(read("src/services/shared/crud.js"));
const confirmationScript = compile(read("src/utils/confirmAction.ts"));
const viewScript = parse(read("src/pages/device/components/DeviceManagementView.vue")).descriptor.scriptSetup.content;
const declarations = ts.createSourceFile("DeviceManagementView.ts", viewScript, ts.ScriptTarget.ES2020, true);
const handlers = declarations.statements.filter(node =>
  ts.isFunctionDeclaration(node) && ["handleDelete", "fetchDevices"].includes(node.name?.text),
);
const pageScript = compile(handlers.map(node => node.getText(declarations)).join("\n"));

const removedDevice = { id: 12, deviceNumber: "test-device-12" };
const otherDevice = { id: 13, deviceNumber: "test-device-13" };
const pageSuccess = { code: 200, data: { records: [otherDevice], total: 1, current: 1, size: 10 } };

function createScenario({ confirmed = true, deletion = () => ({ code: 200 }), refresh = () => pageSuccess } = {}) {
  const requests = [];
  const notices = [];
  let confirmationCount = 0;
  const ref = value => ({ value });
  const request = (options) => {
    const method = options.method.toUpperCase();
    requests.push({ ...options, method });
    return method === "DELETE" ? deletion() : refresh();
  };
  const context = vm.createContext({
    exports: {},
    URLSearchParams,
    require: () => ({ default: request }),
    props: { mode: "info" },
    selectedDevice: ref(removedDevice),
    currentDevice: ref(removedDevice),
    selectedDeviceId: ref(removedDevice.id),
    deviceList: ref([removedDevice, otherDevice]),
    pagination: ref({ current: 1, size: 10, total: 2 }),
    searchForm: ref({ deviceNumber: "" }),
    deletingDevice: ref(false),
    deviceListRequest: 0,
    t: key => key,
    toastError: (error, fallback) => notices.push(error?.msg || fallback),
    uni: {
      showModal: options => {
        confirmationCount++;
        options.success({ confirm: confirmed });
      },
      showToast: options => notices.push(options.title),
    },
  });
  crudScript.runInContext(context);
  confirmationScript.runInContext(context);
  const api = context.exports.createCrudService("/api/device");
  context.deleteDeviceT = api.delete;
  context.getDevicePageT = api.getPage;
  context.confirmDangerAction = context.exports.confirmDangerAction;
  pageScript.runInContext(context);
  return { context, requests, notices, get confirmationCount() { return confirmationCount; } };
}

test("cancelling a device deletion leaves the selected device in place", async () => {
  const { context, requests, notices } = createScenario({ confirmed: false });

  await context.handleDelete();

  assert.equal(requests.length, 0);
  assert.equal(notices.length, 0);
  assert.equal(context.selectedDevice.value, removedDevice);
  assert.equal(context.deletingDevice.value, false);
});

test("device deletion accepts business success and keeps the force-delete request", async () => {
  for (const code of [0, 200]) {
    const { context, requests, notices } = createScenario({ deletion: () => ({ code, data: "" }) });

    await context.handleDelete();

    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ["DELETE", "/api/device/12?is_force=true"],
      ["POST", "/api/device/page"],
    ]);
    assert.deepEqual(notices, ["message.deleteSuccess"]);
    assert.equal(context.selectedDevice.value, otherDevice);
  }
});

test("business errors, a false result and a missing business code never refresh the list", async () => {
  for (const [result, expectedNotice] of [
    [{ code: 409, msg: "Device still has bindings" }, "Device still has bindings"],
    [{ code: 200, data: false, msg: "Success" }, "message.deleteFail"],
    [{ data: true, msg: "Success" }, "message.deleteFail"],
  ]) {
    const { context, requests, notices } = createScenario({ deletion: () => result });

    await context.handleDelete();

    assert.equal(requests.length, 1);
    assert.deepEqual(notices, [expectedNotice]);
    assert.equal(context.selectedDevice.value, removedDevice);
    assert.equal(context.deviceList.value.length, 2);
    assert.equal(context.deletingDevice.value, false);
  }
});

test("a failed deletion request reports the error and can be retried", async () => {
  const { context, requests, notices } = createScenario({
    deletion: async () => { throw { msg: "Request timed out" }; },
  });

  await context.handleDelete();

  assert.equal(requests.length, 1);
  assert.deepEqual(notices, ["Request timed out"]);
  assert.equal(context.currentDevice.value, removedDevice);
  assert.equal(context.deletingDevice.value, false);
});

test("a refresh error after a confirmed deletion keeps the remaining rows", async () => {
  const { context, requests, notices } = createScenario({
    refresh: () => ({ code: 503, msg: "List is unavailable" }),
  });

  await context.handleDelete();

  assert.equal(requests.length, 2);
  assert.deepEqual(notices, ["message.deleteRefreshFail"]);
  assert.equal(context.currentDevice.value, null);
  assert.equal(context.deviceList.value.length, 1);
  assert.equal(context.deviceList.value[0], otherDevice);
});

test("repeated clicks share a single confirmation and deletion", async () => {
  let completeDeletion;
  const pendingDeletion = new Promise(resolve => { completeDeletion = resolve; });
  const scenario = createScenario({ deletion: () => pendingDeletion });

  const first = scenario.context.handleDelete();
  await scenario.context.handleDelete();
  await scenario.context.handleDelete();
  completeDeletion({ code: 200 });
  await first;

  assert.equal(scenario.confirmationCount, 1);
  assert.equal(scenario.requests.filter(({ method }) => method === "DELETE").length, 1);
  assert.deepEqual(scenario.notices, ["message.deleteSuccess"]);
});
