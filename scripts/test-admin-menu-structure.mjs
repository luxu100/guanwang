import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appShellSource = readFileSync(new URL("../src/components/AppShell.vue", import.meta.url), "utf8");
const systemSource = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");
const pagesJsonSource = readFileSync(new URL("../src/pages.json", import.meta.url), "utf8");

test("partition management replaces station management in visible menu labels", () => {
  assert.match(appShellSource, /label: "分区管理"/);
  assert.match(appShellSource, /placeholder="分区搜索"/);
  assert.match(pagesJsonSource, /"navigationBarTitleText": "分区管理"/);
  assert.doesNotMatch(appShellSource, /label: "站点管理"/);
});

test("default permission resources include partition management", () => {
  assert.match(systemSource, /permissionName: "分区管理"/);
  assert.match(systemSource, /permissionCode: "page:partition"/);
  assert.doesNotMatch(systemSource, /permissionName: "站点管理"/);
});

test("system settings binds roles to partitions from department service", () => {
  assert.match(systemSource, /import \{ getDeptList \} from "@\/services\/partition\/partition"/);
  assert.match(systemSource, /绑定分区（部门接口）/);
  assert.match(systemSource, /function loadPartitions/);
  assert.match(systemSource, /deptIds: selectedPartitionIds\.value/);
  assert.doesNotMatch(systemSource, /站点绑定范围|用户-站点绑定/);
});

test("protocol management is a child of the data receiving menu in AppShell", () => {
  const dataReceiveIndex = appShellSource.indexOf('label: "数据接收和解析"');
  const protocolIndex = appShellSource.indexOf('label: "协议管理"');
  const systemIndex = appShellSource.indexOf('label: "系统设置"');

  assert.ok(dataReceiveIndex >= 0, "data receiving menu should exist");
  assert.ok(protocolIndex > dataReceiveIndex, "protocol management should be after data receiving menu start");
  assert.ok(protocolIndex > systemIndex, "protocol management should not stay under system settings");

  const menuEndIndex = appShellSource.indexOf("const shellContentDefinitions", dataReceiveIndex);
  const dataReceiveSource = appShellSource.slice(dataReceiveIndex, menuEndIndex);
  assert.match(dataReceiveSource, /label: "协议管理"/);
  assert.match(dataReceiveSource, /path: "\/pages\/data-receive\/access\/access"/);
  assert.doesNotMatch(dataReceiveSource, /label: "数据接入"/);
});

test("default permission resources include protocol management under data receiving", () => {
  const dataReceiveIndex = systemSource.indexOf('permissionCode: "module:data-receive"');
  const protocolIndex = systemSource.indexOf('permissionCode: "page:data-receive:protocol"');

  assert.ok(dataReceiveIndex >= 0, "default data receiving permission module should exist");
  assert.ok(protocolIndex > dataReceiveIndex, "protocol permission should be nested after data receiving module");

  const dataReceivePermissionSource = systemSource.slice(dataReceiveIndex, systemSource.indexOf("],", dataReceiveIndex));
  assert.match(dataReceivePermissionSource, /permissionName: "协议管理"/);
  assert.match(dataReceivePermissionSource, /permissionCode: "page:data-receive:protocol"/);
  assert.match(dataReceivePermissionSource, /permissionCode: "page:data-receive:parse"/);
  assert.match(dataReceivePermissionSource, /permissionCode: "page:data-receive:record"/);
});
