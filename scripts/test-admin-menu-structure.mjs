import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { frontendMenuItems, createDefaultMenuTree } from "../src/utils/frontendMenu.ts";

const appShellSource = readFileSync(new URL("../src/components/AppShell.vue", import.meta.url), "utf8");
const systemSource = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");
const pagesJsonSource = readFileSync(new URL("../src/pages.json", import.meta.url), "utf8");
const labels = JSON.parse(readFileSync(new URL("../src/components/locales/zh-CN.json", import.meta.url), "utf8")).appShellMenu;
const defaultMenuTree = createDefaultMenuTree(labels);

test("AppShell translates its logout and menu heading controls", () => {
  assert.match(appShellSource, /const shellT = createScopedT\("appShell"\)/);
  assert.match(appShellSource, /\{\{ shellT\("logout"\) \}\}/);
  assert.match(appShellSource, /\{\{ shellT\("menuTitle"\) \}\}/);
  assert.match(appShellSource, /shellT\('expandMenu'\)/);
  assert.match(appShellSource, /shellT\('collapseMenu'\)/);
});

test("partition management replaces station management in visible menu labels", () => {
  assert.ok(frontendMenuItems.some(item => item.labelKey === "partition"));
  assert.match(appShellSource, /placeholder="分区搜索"/);
  assert.match(pagesJsonSource, /"navigationBarTitleText": "分区管理"/);
  assert.doesNotMatch(appShellSource, /label: "站点管理"/);
});

test("default permission resources include partition management", () => {
  assert.ok(defaultMenuTree.some(item => item.permissionName === "分区管理" && item.permissionCode === "page:partition"));
  assert.ok(!defaultMenuTree.some(item => item.permissionName === "站点管理"));
});

test("system settings binds users to partitions from region service", () => {
  assert.match(systemSource, /import \{ getRegionList \} from "@\/services\/partition\/partition"/);
  assert.match(systemSource, /绑定分区（Region接口）/);
  assert.match(systemSource, /function loadPartitions/);
  assert.match(systemSource, /getRegionList\(\)/);
  assert.doesNotMatch(systemSource, /站点绑定范围|用户-站点绑定/);
});

test("protocol management is a child of the data receiving menu in AppShell", () => {
  assert.match(appShellSource, /const menuItems: MenuItem\[\] = frontendMenuItems/);
  const dataReceive = frontendMenuItems.find(item => item.labelKey === "dataReceive");
  assert.ok(dataReceive.children.some(item => item.labelKey === "dataReceiveProtocol" && item.path === "/pages/data-receive/access/access"));
  const system = frontendMenuItems.find(item => item.labelKey === "system");
  assert.ok(!system.children.some(item => item.labelKey === "dataReceiveProtocol"));
});

test("default permission resources include protocol management under data receiving", () => {
  const group = defaultMenuTree.find(item => item.permissionCode === "module:data-receive");
  assert.deepEqual(group.children.map(item => item.permissionCode), ["page:data-receive:protocol", "page:data-receive:parse", "page:data-receive:record"]);
  assert.equal(group.children[0].permissionName, "协议管理");
  assert.match(systemSource, /createDefaultMenuTree\(appShellZhCN.appShellMenu\)/);
});

test("default menu sync uses backend permission types and removes retired report pages", () => {
  assert.match(systemSource, /const rawPermissionType = Number\(getValue\(item, \["permissionType"\]\) \?\? 1\)/);
  assert.match(systemSource, /rawPermissionType === 0 \? 1 : rawPermissionType/);
  assert.match(systemSource, /\{ label: "接口", value: 3 \}/);
  assert.match(systemSource, /"page:report:generate"/);
  assert.match(systemSource, /"page:report:operation"/);
  assert.match(systemSource, /"page:report:command"/);
  assert.match(systemSource, /"\/pages\/report\/generate\/generate"/);
  assert.match(systemSource, /"\/pages\/report\/operation\/operation"/);
  assert.match(systemSource, /"\/pages\/report\/command\/command"/);
});

test("default menu sync avoids the slow large-page request when tree or list data is available", () => {
  assert.match(systemSource, /getMenuList/);
  assert.match(systemSource, /const treeRecords = toTreeRows\(parseListResponse\(treeResponse\)\);\s*if \(treeRecords\.length\) \{\s*return treeRecords;/);
  assert.match(systemSource, /const listRecords = toTreeRows\(parseListResponse\(listResponse\)\);\s*if \(listRecords\.length\) \{\s*return listRecords;/);
  assert.match(systemSource, /getMenuPage\(\{ pageNum: 1, pageSize: 100 \}\)/);
  assert.doesNotMatch(systemSource, /getMenuPage\(\{ pageNum: 1, pageSize: 500 \}\)/);
});

test("stale default menus use force deletion and preserve explicit delete modes", () => {
  assert.match(systemSource, /batchDeleteMenu\(Array\.from\(idsToDelete\), true\)/);
  assert.match(readFileSync(new URL("../src/services/system/menu.d.ts", import.meta.url), "utf8"), /batchDeleteMenu\(data: Array<number \| string>, isForce\?: boolean\)/);
  assert.match(readFileSync(new URL("../src/utils/request.js", import.meta.url), "utf8"), /if \(!params\.has\("is_force"\)\)/);
});
