import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/system/components/SystemManagementView.vue", import.meta.url), "utf8");

test("user configuration displays existing partition bindings", () => {
  assert.match(source, /用户绑定分区（部门接口）/);
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

test("user save payload carries multiple department partition ids", () => {
  assert.match(source, /deptIds: selectedUserPartitionIds\.value/);
  assert.match(source, /getArrayValue\(item \|\| \{\}, \["deptIds", "departmentIds", "partitionIds", "depts", "departments", "partitions"\]\)/);
});

