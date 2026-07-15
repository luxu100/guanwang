import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");

test("user configuration displays existing partition bindings", () => {
  assert.match(source, /用户绑定分区（Region接口）/);
  assert.match(source, /selectedUserPartitionIds/);
  assert.match(source, /bound-partition-list/);
  assert.match(source, /getPartitionNameById/);
  assert.match(source, /removeUserPartition/);
});

test("user partition binding dialog starts empty and supports select all", () => {
  assert.match(source, /showUserPartitionDialog/);
  assert.match(source, /openUserPartitionDialog/);
  assert.match(source, /userPartitionDraftIds\.value = \[\]/);
  assert.match(source, /全选/);
  assert.match(source, /toggleAllUserPartitionDraft/);
  assert.match(source, /availableUserPartitionOptions/);
});

test("user partition binding dialog is spacious, informative, and responsive", () => {
  assert.match(source, /class="modal-panel modal-panel--partition"/);
  assert.match(source, /已选 \{\{ userPartitionDraftIds\.length \}\} 个/);
  assert.match(source, /本次将新增绑定 \{\{ userPartitionDraftIds\.length \}\} 个分区/);
  assert.match(source, /:disabled="!userPartitionDraftIds\.length"/);
  assert.match(source, /\.modal-panel--partition\s*\{[\s\S]*?width:\s*min\(760px, calc\(100vw - 40px\)\)/);
  assert.match(source, /\.partition-dialog-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(source, /@media \(max-width:\s*680px\)[\s\S]*?\.partition-dialog-list\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
});

test("user save payload carries multiple department partition ids", () => {
  assert.match(source, /deptIds: selectedUserPartitionIds\.value/);
  assert.match(source, /getArrayValue\(item \|\| \{\}, \["deptIds", "departmentIds", "partitionIds", "depts", "departments", "partitions"\]\)/);
});

test("user form includes region field from current API", () => {
  assert.match(source, /userRegionOptions/);
  assert.match(source, /region: userForm\.region/);
  assert.match(source, /getText\(item, \["region"\], "国内"\)/);
});

test("new users are submitted through register instead of create", () => {
  assert.match(source, /register, updateUser, type RegisterParams/);
  assert.match(source, /isCreating\.value \|\| !userForm\.id[\s\S]*await register\(\{/);
  assert.match(source, /satisfies RegisterParams/);
  assert.doesNotMatch(source, /createUser\(payload\)/);
});

test("new user password field has a stable visibility toggle", () => {
  assert.match(source, /showUserPassword/);
  assert.match(source, /toggleUserPasswordVisibility/);
  assert.match(source, /class="password-input-wrap"/);
  assert.match(source, /class="password-toggle"/);
  assert.match(source, /:password="!showUserPassword"/);
});

test("user role assignment uses role list ids without fetching user roles", () => {
  assert.doesNotMatch(source, /getUserRoles/);
  assert.doesNotMatch(source, /loadSelectedUserRoles/);
  assert.match(source, /selectedRoleIds\.value = \[\]/);
  assert.match(source, /assignUserRoles\(roleAssignment\.userId, roleAssignment\.roleIds\)/);
});

test("user table omits creation time and paginates from the top toolbar", () => {
  const userTableStart = source.indexOf('class="data-table data-table--user"');
  const userTableEnd = source.indexOf("</scroll-view>", userTableStart);
  const userTableSource = source.slice(userTableStart, userTableEnd);

  assert.doesNotMatch(userTableSource, /创建时间/);
  assert.doesNotMatch(userTableSource, /\['createdAt'\]/);
  assert.match(source, /v-if="mode === 'user'" class="user-pagination"/);
  assert.match(source, /v-model="pageSizeInputValue"/);
  assert.match(source, /v-model="pageInputValue"/);
  assert.match(source, /userTotalPages/);
  assert.match(source, /function jumpToPage/);
  assert.match(source, /filteredUsers\.slice\(pageStart, pageStart \+ pagination\.pageSize\)/);
  assert.match(source, /\.user-page-size__input,[\s\S]*?\.user-page-button,[\s\S]*?\.user-page-input\s*\{[\s\S]*?height:\s*32px;/);
});
