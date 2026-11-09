import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";
import * as adminData from "../src/utils/adminData.ts";
import * as frontendMenu from "../src/utils/frontendMenu.ts";
import { filterMenuItemsByAccess, flattenMenuPaths } from "../src/utils/menuAccess.js";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const labels = JSON.parse(read("src/components/locales/zh-CN.json")).appShellMenu;
const ok = (data) => ({ code: 200, data });
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve;
  const promise = new Promise((accept) => { resolve = accept; });
  return { promise, resolve };
};
const flat = (items) => items.flatMap((item) => [item, ...flat(item.children || [])]);

function harness(kind, services = {}, localized = true) {
  const directory = localized ? "localized/components" : "components";
  const file = kind === "parse" ? `src/pages/data-receive/${directory}/DataReceiveView.vue` : `src/pages/system/${directory}/SystemManagementView.vue`;
  const calls = [];
  const messages = [];
  const unmounts = [];
  const api = new Proxy({}, { get: (_target, name) => async (...args) => {
    calls.push({ name, args: plain(args) });
    return services[name] ? services[name](...args) : ok([]);
  } });
  const context = vm.createContext({
    exports: {}, console,
    defineProps: () => ({ mode: kind === "parse" ? "parse" : "auth" }),
    uni: { getStorageSync: () => [], showToast: (options) => messages.push(options.title), showLoading() {}, hideLoading() {} },
    require: (id) => {
      if (id === "vue") return {
        ref: (value) => ({ value }), reactive: (value) => value,
        computed: (get) => ({ get value() { return get(); } }), watch() {}, onMounted() {},
        onBeforeUnmount: (fn) => unmounts.push(fn),
      };
      if (id === "@/utils/adminData") return { ...adminData, toastError: (error, fallback) => messages.push(error?.msg || error?.message || fallback) };
      if (id === "@/utils/frontendMenu") return frontendMenu;
      if (id === "@/components/locales/zh-CN.json") return { default: { appShellMenu: labels } };
      if (id === "@/i18n/localeText") return {
        useLocaleText: () => (zh) => zh, useLocalizedCount: () => String, useLocalizedTotal: () => String,
      };
      if (id === "@/i18n") return { createScopedT: () => (key) => labels[key] || key };
      if (id === "@/utils/confirmAction") return { confirmAction: async () => true };
      if (id === "@/services/device/protocolBinding") return { bindingSceneOptions: () => [] };
      if (id.startsWith("@/services/")) return api;
      return {};
    },
  });
  const source = parse(read(file)).descriptor.scriptSetup.content;
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return {
    calls, messages,
    run: (expression) => vm.runInContext(expression, context),
    set: (expression, value) => { context.input = value; vm.runInContext(`${expression} = input`, context); },
    call: (name, ...args) => { context.args = args; return vm.runInContext(`${name}(...args)`, context); },
    unmount: () => unmounts.forEach((fn) => fn()),
  };
}

test("sidebar and both system views use one menu registry and registered leaf paths", () => {
  const pages = new Set(JSON.parse(read("src/pages.json")).pages.map((page) => `/${page.path}`));
  const resources = flat(frontendMenu.createDefaultMenuTree(labels));
  const definitions = flat(frontendMenu.frontendMenuItems);
  assert.equal(new Set(definitions.map((item) => item.permissionCode)).size, definitions.length);
  assert.deepEqual(resources.map((item) => item.permissionCode), definitions.map((item) => item.permissionCode));
  for (const item of definitions) assert.ok(pages.has(item.path), `Unregistered path ${item.path}`);
  for (const directory of ["components", "localized/components"]) {
    assert.match(read(`src/pages/system/${directory}/SystemManagementView.vue`), /createDefaultMenuTree\(appShellZhCN.appShellMenu\)/);
  }
  assert.match(read("src/components/AppShell.vue"), /const menuItems: MenuItem\[\] = frontendMenuItems/);
});

test("legacy parameter permission keeps access to the current parameter route", () => {
  const menus = filterMenuItemsByAccess(frontendMenu.frontendMenuItems, { roles: ["COMMON"], permissions: ["page:device:settings"] });
  assert.deepEqual(flattenMenuPaths(menus), ["/pages/device/parameter/parameter"]);
});

test("permission page puts the admin hint beside its role and keeps errors visible", () => {
  for (const directory of ["components", "localized/components"]) {
    const source = read(`src/pages/system/${directory}/SystemManagementView.vue`);
    assert.doesNotMatch(source, /class="menu-alignment"/);
    assert.match(source, /v-if="menuLoadError" class="permission-load-error" role="alert"/);
    assert.match(source, /v-if="isSuperAdminRole\(item\)"\s+class="role-admin-note"/);
    assert.match(source, /v-if="permissionLoadError \|\| rolePermissionError" class="permission-load-error" role="alert"/);
  }
});

test("existing burst permissions match the frontend's differently named routes", () => {
  const menus = filterMenuItemsByAccess(frontendMenu.frontendMenuItems, { roles: ["COMMON"], permissions: ["page:leak-burst:identification"] });
  assert.deepEqual(flattenMenuPaths(menus), ["/pages/leak-burst/burst-identification/burst-identification"]);
});

test("menu alignment detects the observed missing, outdated and retired resources", () => {
  const resources = flat(frontendMenu.createDefaultMenuTree(labels));
  assert.deepEqual(frontendMenu.getFrontendMenuAlignment(resources), { missing: [], outdated: [], unmatched: [] });
  const backend = resources.filter((item) => !["page:one-map", "page:device:protocol"].includes(item.permissionCode))
    .map((item) => item.permissionCode === "page:device:settings" ? { ...item, path: "/pages/device/settings/settings" } : item);
  backend.push({ id: 99, permissionCode: "page:data-analysis:device-params", path: "/pages/data-analysis/device-params/device-params", parentId: 0, permissionType: 1 });
  const alignment = frontendMenu.getFrontendMenuAlignment(backend);
  assert.deepEqual(alignment.missing.map((item) => item.permissionCode), ["page:one-map", "page:device:protocol"]);
  assert.equal(alignment.outdated[0].permissionCode, "page:device:settings");
  assert.equal(alignment.unmatched[0].id, 99);
});

const tree = [
  { id: 1, parentId: 0 }, { id: 2, parentId: 1 }, { id: 3, parentId: 2 },
  { id: 4, parentId: 2 }, { id: 5, parentId: 1 }, { id: 6, parentId: 5 }, { id: 7, parentId: 5 },
];

for (const localized of [false, true]) {
  test(`permission cascade reaches every level of a flat backend tree (${localized})`, () => {
    const app = harness("system", {}, localized);
    const rows = app.call("toTreeRows", tree);
    app.set("permissions.value", rows);
    app.call("togglePermission", rows[0]);
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), [1, 2, 3, 4, 5, 6, 7]);
    app.call("togglePermission", rows.find((item) => item.id === 3));
    assert.equal(app.run("selectedPermissionIds.value.includes(1)"), false);
    assert.equal(app.run("selectedPermissionIds.value.includes(2)"), false);
    assert.equal(app.run("selectedPermissionIds.value.includes(5)"), true);
  });

  test(`parent selection processes later branches after an unchecked branch (${localized})`, () => {
    const app = harness("system", {}, localized);
    app.set("permissions.value", app.call("toTreeRows", tree));
    app.set("selectedPermissionIds.value", [5, 6]);
    app.call("applyRolePermissionSelection", { permissionIds: [5, 6] });
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), [6]);
  });

  test(`select-all toggles back to no selection (${localized})`, () => {
    const app = harness("system", {}, localized);
    app.set("permissions.value", app.call("toTreeRows", tree));
    app.call("toggleAllPermissions");
    assert.equal(app.run("areAllPermissionsChecked.value"), true);
    app.call("toggleAllPermissions");
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), []);
  });

  test(`backend permission failure cannot be reported as a successful save (${localized})`, async () => {
    const app = harness("system", { assignRolePermissions: () => ({ code: 500, msg: "授权保存失败" }) }, localized);
    app.set("selectedRole.value", { id: 2 });
    app.set("selectedPermissionIds.value", [3]);
    await app.call("saveRolePermissions");
    assert.ok(app.messages.includes("授权保存失败"));
    assert.equal(app.messages.some((message) => message.includes("角色权限已保存")), false);
  });

  test(`failed role hydration blocks an accidental empty permission save (${localized})`, async () => {
    const app = harness("system", { getRolePermissions: () => ({ code: 500, msg: "权限读取失败" }) }, localized);
    app.set("selectedRole.value", { id: 2 });
    await app.call("hydrateSelectedRolePermissions", 2);
    await app.call("saveRolePermissions");
    assert.notEqual(app.run("rolePermissionError.value"), "");
    assert.equal(app.calls.some((call) => call.name === "assignRolePermissions"), false);
  });

  test(`disabled retired pages cannot be selected for role assignment (${localized})`, async () => {
    const records = [
      { id: 1, permissionCode: "page:favorite", parentId: 0, status: 1 },
      { id: 74, permissionCode: "page:report:operation", parentId: 0, status: 0 },
      { id: 75, permissionCode: "page:report:command", parentId: 0, status: 0 },
    ];
    const app = harness("system", { getPermissionTree: () => ok(records) }, localized);
    await app.call("loadPermissions");
    app.call("toggleAllPermissions");
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), [1]);
    assert.equal(app.run("permissions.value.length"), 1);
  });

  test(`role receipts accept numeric IDs and permission-code arrays (${localized})`, async () => {
    let receipt = [1];
    const app = harness("system", { getRolePermissions: () => ok(receipt) }, localized);
    app.set("permissions.value", [{ id: 1, permissionCode: "page:favorite", __level: 1 }]);
    app.set("selectedRole.value", { id: 2 });
    await app.call("hydrateSelectedRolePermissions", 2);
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), [1]);
    receipt = ["page:favorite"];
    await app.call("hydrateSelectedRolePermissions", 2);
    assert.deepEqual(plain(app.run("selectedPermissionIds.value")), [1]);
  });

  test(`a failed sync reloads actual backend resources before reporting failure (${localized})`, async () => {
    const records = [{ id: 1, permissionName: "我的收藏", permissionCode: "page:favorite", path: "/pages/index/index", parentId: 0, permissionType: 1, status: 1 }];
    const app = harness("system", { getMenuTree: () => ok(records), createMenu: () => ({ code: 500, msg: "同步中断" }) }, localized);
    await app.call("syncDefaultMenusToBackend");
    assert.equal(app.run("menus.value.length"), 1);
    assert.equal(app.run("menuSource.value"), "api");
    assert.ok(app.calls.filter((call) => call.name === "getMenuTree").length >= 2);
    assert.ok(app.messages.includes("同步中断"));
  });

  test(`later syncs retain explicitly disabled legacy resources (${localized})`, async () => {
    const app = harness("system", {}, localized);
    await app.call("pruneStaleDefaultMenus", [{ id: 74, permissionCode: "page:report:operation", status: 0 }], new Map(), { deleted: 0 });
    assert.equal(app.calls.some((call) => call.name === "batchDeleteMenu"), false);
  });

  test(`parse selection hydrates sparse list rows before quality lookup (${localized})`, async () => {
    const app = harness("parse", { getProtocolParseRecordDetail: (id) => ok({ id, protocolId: 12, protocolName: "扩展协议", frameCount: 2, fieldCount: 73, errorMessage: "字段降级为原始Hex" }) }, localized);
    await app.call("selectRecord", { id: 7, deviceNumber: "fixture-device", parseStatus: "SUCCESS", values: {} }, 0);
    assert.equal(app.run("selectedRecord.value.protocolId"), 12);
    assert.equal(app.run("selectedRecord.value.frameCount"), 2);
    assert.equal(app.run("selectedRecord.value.deviceNumber"), "fixture-device");
    assert.deepEqual(app.calls.find((call) => call.name === "getProtocolParseRecordDetail").args, [7]);
    assert.equal(app.run("activeConfig.value.filters.some(field => field.key === 'protocolName')"), false);
  });

  test(`parse query errors remain visible instead of becoming an empty result (${localized})`, async () => {
    const app = harness("parse", { getProtocolParseRecordPage: () => ({ code: 401, msg: "未登录或token已过期" }) }, localized);
    await app.call("fetchRecords");
    assert.equal(app.run("loadError.value"), "未登录或token已过期");
    assert.equal(app.run("loading.value"), false);
  });

  test(`late parse detail cannot overwrite a newer selection (${localized})`, async () => {
    const pending = deferred();
    const app = harness("parse", { getProtocolParseRecordDetail: (id) => id === 1 ? pending.promise : ok({ id: 2, protocolId: 12 }) }, localized);
    const first = app.call("selectRecord", { id: 1 }, 0);
    await app.call("selectRecord", { id: 2 }, 1);
    pending.resolve(ok({ id: 1, protocolId: 99 }));
    await first;
    assert.equal(app.run("selectedRecord.value.id"), 2);
    assert.equal(app.run("selectedRecord.value.protocolId"), 12);
  });
}
