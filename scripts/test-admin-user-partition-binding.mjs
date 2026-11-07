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
  for (const name of ["register", "updateUser", "RegisterParams"]) {
    assert.match(source, new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "@/services/system/user"`));
  }
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

test("user details default to an open collapsible drawer with internal scrolling", () => {
  assert.match(source, /const isUserDetailOpen = ref\(true\)/);
  assert.match(source, /v-if="isUserDetailOpen" class="detail-panel detail-panel--user"/);
  assert.match(source, /class="user-detail-collapse"/);
  assert.match(source, /@click="collapseUserDetail"/);
  assert.match(source, /function selectUser\(item: RecordLike \| null, openDetail = true\)/);
  assert.match(source, /if \(openDetail && item\) \{\s*isUserDetailOpen\.value = true;/);
  assert.match(source, /selectUser\(users\.value\[0\] \|\| null, false\)/);
  assert.match(source, /selectUser\(null, false\);[\s\S]*?isUserDetailOpen\.value = true;/);
  assert.match(source, /\.system-view--user\s*\{[\s\S]*?overflow:\s*hidden;/);
  assert.match(source, /\.content-layout--user\s*\{[\s\S]*?position:\s*relative;[\s\S]*?display:\s*block;[\s\S]*?height:\s*0;[\s\S]*?overflow:\s*hidden;/);
  assert.match(source, /\.workspace--user,[\s\S]*?\.workspace--user \.main-panel\s*\{[\s\S]*?overflow:\s*hidden;/);
  assert.match(source, /\.content-layout--user > \.table-panel\s*\{[\s\S]*?height:\s*100%;[\s\S]*?overflow:\s*hidden;/);
  assert.match(source, /\.detail-panel--user\s*\{[^}]*position:\s*absolute;[^}]*bottom:\s*10px;[^}]*height:\s*clamp\([1-9]\d*px,\s*[\d.]+%,\s*[1-9]\d*px\);/);
  assert.match(source, /\.detail-head--user\s*\{[\s\S]*?position:\s*relative;/);
  assert.match(source, /class="detail-head detail-head--user"[\s\S]*?class="user-detail-collapse"[\s\S]*?<\/view>/);
  assert.match(source, /\.user-detail-collapse\s*\{[\s\S]*?top:\s*50%;[\s\S]*?left:\s*50%;[\s\S]*?transform:\s*translate\(-50%, -50%\);/);
  assert.match(source, /\.detail-panel--user\s*\{[\s\S]*?box-shadow:\s*none;/);
  assert.match(source, /\.user-detail-collapse\s*\{[\s\S]*?box-shadow:\s*none;/);
  assert.match(source, /\.detail-panel--user \.form-grid--user\s*\{[\s\S]*?height:\s*0;[\s\S]*?overflow-y:\s*auto;[\s\S]*?overscroll-behavior:\s*contain;/);
});
