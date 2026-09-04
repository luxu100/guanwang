import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const crudSource = readFileSync(new URL("../src/services/shared/crud.js", import.meta.url), "utf8");
const userSource = readFileSync(new URL("../src/services/user/user.js", import.meta.url), "utf8");

test("shared delete requests append is_force=true by default", () => {
  assert.match(crudSource, /function appendForceDeleteParam/);
  assert.match(crudSource, /isForce = true/);
  assert.match(crudSource, /is_force: String\(isForce\)/);
  assert.match(crudSource, /deleteRequest\(url, data, isForce = true, timeout = 15000\)/);
  assert.match(crudSource, /delete\(id, isForce = true\)/);
  assert.match(crudSource, /batchDelete\(data, isForce = true\)/);
});

test("menu batch deletion uses a dedicated longer timeout", () => {
  const menuSource = readFileSync(new URL("../src/services/system/menu.js", import.meta.url), "utf8");
  assert.match(menuSource, /deleteRequest\("\/api\/permission\/batch-delete", data, isForce, 60000\)/);
});

test("manual user delete requests append is_force=true by default", () => {
  assert.match(userSource, /function appendForceDeleteParam/);
  assert.match(userSource, /export function deleteUser\(id, isForce = true\)/);
  assert.match(userSource, /appendForceDeleteParam/);
  assert.match(userSource, /export function batchDeleteUser\(data, isForce = true\)/);
});
